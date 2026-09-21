import { MigrationInterface, QueryRunner } from "typeorm";

// Corresponding adjustments become one row per reporting year, with a
// real distinction between the Trajectory and Averaging methods.
//
// Two new columns:
//   appliedAdjustment     the adjustment actually applied for the year —
//                         the year's raw balance under Trajectory, or the
//                         running period average under Averaging. One
//                         canonical column so readers need no CASE on
//                         caMethod.
//   reportingYearEmission the year's actual emissions, now collected on
//                         the calculate form instead of being read from
//                         the Emission table (same rationale as
//                         baseYearEmission on the initial report: a
//                         calculation shouldn't depend on a separate
//                         inventory record existing first).
// Both nullable — rows created before this change legitimately have
// neither.
//
// Then UNIQUE (year). Before this, calculateCA blindly INSERTed on every
// call, so a repeated Calculate silently created duplicate rows that
// both counted in the reconciliation summary and double-subtracted from
// the outstanding gap. Any pre-existing duplicates are archived into
// corresponding_adjustment_superseded rather than dropped, then the
// surviving row per year is kept by a total ordering (most advanced
// status first, then most recently updated). Deliberately NOT a
// RAISE EXCEPTION on non-empty like 1787700000000 did for ndc_target:
// here the conflict is auto-resolvable, so blocking every environment on
// manual intervention isn't warranted.
//
// No country column: this registry is single-country (systemCountry
// scopes every query), so the year alone is the natural key.
//
// cooperativeApproachId is deliberately left in place, data and all —
// adjustments are registry-wide per year and it is no longer written on
// new rows, but existing values are preserved.
export class CorrespondingAdjustmentOnePerYear1787800000000
  implements MigrationInterface
{
  name = "CorrespondingAdjustmentOnePerYear1787800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "corresponding_adjustment" ADD COLUMN IF NOT EXISTS "appliedAdjustment" numeric(15,5)`
    );
    await queryRunner.query(
      `ALTER TABLE "corresponding_adjustment" ADD COLUMN IF NOT EXISTS "reportingYearEmission" numeric(15,5)`
    );

    // Backfill appliedAdjustment for existing rows so the period table
    // isn't blank for them. Every pre-existing row was computed under
    // the old logic, where the applied figure was always the year's raw
    // balance (Averaging had no effect at all back then).
    await queryRunner.query(`
      UPDATE "corresponding_adjustment"
      SET "appliedAdjustment" = "emissionsBalance"
      WHERE "appliedAdjustment" IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "corresponding_adjustment_superseded" (
        "caId" text PRIMARY KEY,
        "year" integer NOT NULL,
        "supersededTime" bigint NOT NULL,
        "row" jsonb NOT NULL
      )
    `);

    await queryRunner.query(`
      WITH ranked AS (
        SELECT "caId", "year",
               ROW_NUMBER() OVER (
                 PARTITION BY "year"
                 ORDER BY CASE "status"
                            WHEN 'Approved'  THEN 0
                            WHEN 'Submitted' THEN 1
                            ELSE 2
                          END,
                          "updatedTime" DESC,
                          "caId" DESC
               ) AS rn
        FROM "corresponding_adjustment"
      )
      INSERT INTO "corresponding_adjustment_superseded" ("caId", "year", "supersededTime", "row")
      SELECT ca."caId", ca."year",
             (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint,
             to_jsonb(ca)
      FROM "corresponding_adjustment" ca
      JOIN ranked r ON r."caId" = ca."caId"
      WHERE r.rn > 1
      ON CONFLICT ("caId") DO NOTHING
    `);

    await queryRunner.query(`
      DELETE FROM "corresponding_adjustment"
      WHERE "caId" IN (SELECT "caId" FROM "corresponding_adjustment_superseded")
    `);

    await queryRunner.query(`
      DO $$
      DECLARE moved integer;
      BEGIN
        SELECT COUNT(*) INTO moved FROM "corresponding_adjustment_superseded";
        IF moved > 0 THEN
          RAISE NOTICE 'Archived % duplicate corresponding_adjustment row(s) into corresponding_adjustment_superseded', moved;
        END IF;
      END $$
    `);

    await queryRunner.query(`
      ALTER TABLE "corresponding_adjustment"
      ADD CONSTRAINT "UQ_corresponding_adjustment_year" UNIQUE ("year")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "corresponding_adjustment" DROP CONSTRAINT IF EXISTS "UQ_corresponding_adjustment_year"`
    );

    // Restore anything the dedupe archived, then drop the archive.
    await queryRunner.query(`
      INSERT INTO "corresponding_adjustment"
      SELECT (jsonb_populate_record(NULL::"corresponding_adjustment", s."row")).*
      FROM "corresponding_adjustment_superseded" s
      ON CONFLICT ("caId") DO NOTHING
    `);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "corresponding_adjustment_superseded"`
    );

    await queryRunner.query(
      `ALTER TABLE "corresponding_adjustment" DROP COLUMN IF EXISTS "reportingYearEmission"`
    );
    await queryRunner.query(
      `ALTER TABLE "corresponding_adjustment" DROP COLUMN IF EXISTS "appliedAdjustment"`
    );
  }
}
