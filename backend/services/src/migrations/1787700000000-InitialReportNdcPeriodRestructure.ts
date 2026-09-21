import { MigrationInterface, QueryRunner } from "typeorm";

// UNCR-478 (continuation) — the Initial Report moves from "one report
// per cooperative approach" to "one report per NDC implementation
// period, covering every cooperative approach filed under it":
//
// initial_report
//   - PRIMARY KEY moves from the old counter-minted "reportId" (which
//     changed on every append-only edit) to a new stable "reportNumber"
//     ("IR-001") — the row itself is now MUTABLE, and history lives in
//     initial_report_version instead of extra rows here.
//   - "cooperativeApproachId" / "cooperativeApproachDetails" /
//     "ndcQuantification" / "version" are dropped. "ndcQuantification"'s
//     three real fields (ndcTarget, baseYear, targetYear->ndcEndYear)
//     are promoted to columns, alongside new "ndcStartYear", "ndcType",
//     "caMethod", "sectors", "majorVersion", "minorVersion",
//     "ndcPeriodId". A new "baseYearEmission" column (not promoted from
//     anything — no legacy source) collects the emission value AT
//     baseYear directly on the report, so filing one never depends on
//     a pre-existing Emission record for that year/country. Everything
//     promoted or added is nullable — legacy rows have no source for
//     ndcStartYear/ndcType/caMethod/baseYearEmission, and submitReport's
//     completeness check is what makes them required going forward.
//
// initial_report_cooperative_approach (new)
//   - Links an approach to the report that covers it. One row per
//     (report, approach) for the life of the report, not one per
//     version — which versions a link was live for is reconstructed
//     from addedInMajor/removedInMajor rather than copied forward.
//     cooperativeApproachId is globally UNIQUE: an approach belongs to
//     exactly one report.
//
// initial_report_version (new)
//   - Append-only, written only at submit. Each row freezes the whole
//     filing — general fields, every linked approach, and each
//     approach's full ca_authorized_entity set — so a minor version
//     bump (an approach amendment) is self-contained without needing to
//     version ca_authorized_entity separately.
//
// ndc_target
//   - Restructured from one row per YEAR to one row per NDC PERIOD —
//     the entity's own prior comment conceded the per-year shape
//     repeated "the same value on every year-row within the period".
//     "year" is dropped; "ndcStartYear"/"ndcEndYear"/"baseYear"/
//     "baseYearEmission"/"targetYear"/"sourceReportNumber" are added.
//     "budgetPeriodStartYear"/"budgetPeriodEndYear"/"cumulativeBudget"
//     are KEPT, unwritten, so a future MultiYear NDC needs no schema
//     change — only a formula branch in the view below plus lifting the
//     submit-time rejection.
//   - The table is empty in the dev database this migration was written
//     against, so up() asserts that and aborts otherwise: per-year rows
//     cannot be folded into per-period rows without knowing the
//     intended trajectory, so a non-empty table needs a bespoke
//     data-migration decision, not this one.
//
// ndc_target_yearly (new VIEW)
//   - Expands each ndc_target period row into one row per year, on a
//     straight line from (baseYear, baseYearEmission) to (targetYear,
//     ndcTarget) — the Trajectory method of Dec 2/CMA.3 para 7a(i).
//     Matches libs/shared/src/view-entities/ndc.target.yearly.view.entity.ts
//     and the TypeScript reference implementation in
//     libs/shared/src/initial-report/ndc-trajectory.ts.
//
// down() is LOSSY: a report covering more than one cooperative approach
// cannot be represented in the old one-report-per-approach shape. It
// restores one legacy row per (report, approach) link, using the
// report's current general fields for all of them, and drops the
// per-approach detail a full snapshot would have carried.
//
// Written by hand rather than via `migration:generate` - the local dev
// DB runs with synchronize=true (NODE_ENV=dev) and has already
// auto-synced this schema. Same convention as
// 1787600000000-CaSubmittedStatusAndEntitySubmission.ts.
export class InitialReportNdcPeriodRestructure1787700000000
  implements MigrationInterface
{
  name = "InitialReportNdcPeriodRestructure1787700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ----------------------------------------------------------------
    // 1. New link + version tables
    // ----------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "initial_report_cooperative_approach" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reportNumber" character varying NOT NULL,
        "cooperativeApproachId" character varying NOT NULL,
        "addedInMajor" integer,
        "removedInMajor" integer,
        "cooperativeApproachDetails" jsonb,
        "createdTime" bigint NOT NULL,
        CONSTRAINT "PK_initial_report_cooperative_approach_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_initial_report_cooperative_approach_caId" UNIQUE ("cooperativeApproachId")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_initial_report_cooperative_approach_reportNumber"
        ON "initial_report_cooperative_approach" ("reportNumber")
    `);

    await queryRunner.query(`
      CREATE TABLE "initial_report_version" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reportNumber" character varying NOT NULL,
        "majorVersion" integer NOT NULL,
        "minorVersion" integer NOT NULL,
        "changedCooperativeApproachId" text,
        "submittedBy" text,
        "submittedTime" bigint NOT NULL,
        "snapshot" jsonb NOT NULL,
        CONSTRAINT "PK_initial_report_version_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_initial_report_version_reportNumber_major_minor"
          UNIQUE ("reportNumber", "majorVersion", "minorVersion")
      )
    `);

    // ----------------------------------------------------------------
    // 2. ndc_target: per-year -> per-period, plus the yearly view
    // ----------------------------------------------------------------
    await queryRunner.query(`
      DO $$
      BEGIN
        IF (SELECT COUNT(*) FROM "ndc_target") > 0 THEN
          RAISE EXCEPTION
            'ndc_target has % row(s) — this migration only restructures an empty table. See the header comment of InitialReportNdcPeriodRestructure1787700000000 for why per-year rows cannot be auto-folded into per-period rows.',
            (SELECT COUNT(*) FROM "ndc_target");
        END IF;
      END $$;
    `);

    await queryRunner.query(`ALTER TABLE "ndc_target" ADD "ndcStartYear" integer`);
    await queryRunner.query(`ALTER TABLE "ndc_target" ADD "ndcEndYear" integer`);
    await queryRunner.query(`ALTER TABLE "ndc_target" ADD "baseYear" integer`);
    await queryRunner.query(
      `ALTER TABLE "ndc_target" ADD "baseYearEmission" numeric(15,5)`
    );
    await queryRunner.query(`ALTER TABLE "ndc_target" ADD "targetYear" integer`);
    await queryRunner.query(
      `ALTER TABLE "ndc_target" ADD "ndcTarget" numeric(15,5)`
    );
    await queryRunner.query(`ALTER TABLE "ndc_target" ADD "sourceReportNumber" text`);

    await queryRunner.query(
      `ALTER TABLE "ndc_target" DROP CONSTRAINT "UQ_480555ce609f07497c81b97eedd"`
    );
    await queryRunner.query(`ALTER TABLE "ndc_target" DROP COLUMN "year"`);
    await queryRunner.query(
      `ALTER TABLE "ndc_target" ALTER COLUMN "ndcStartYear" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "ndc_target" ALTER COLUMN "ndcEndYear" SET NOT NULL`
    );
    await queryRunner.query(`
      ALTER TABLE "ndc_target" ADD CONSTRAINT "UQ_ndc_target_period_country"
        UNIQUE ("ndcStartYear", "ndcEndYear", "country")
    `);

    await createView(queryRunner, "ndc_target_yearly", NDC_TARGET_YEARLY_SQL);

    // ----------------------------------------------------------------
    // 3. initial_report: reshape to one mutable row per report
    // ----------------------------------------------------------------
    await queryRunner.query(
      `CREATE TYPE "public"."initial_report_ndctype_enum" AS ENUM('SingleYear', 'MultiYear')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."initial_report_camethod_enum" AS ENUM('Trajectory', 'Averaging', 'MultiYear')`
    );

    await queryRunner.query(`ALTER TABLE "initial_report" ADD "reportNumber" character varying`);
    await queryRunner.query(`ALTER TABLE "initial_report" ADD "ndcStartYear" integer`);
    await queryRunner.query(`ALTER TABLE "initial_report" ADD "ndcEndYear" integer`);
    await queryRunner.query(`ALTER TABLE "initial_report" ADD "ndcPeriodId" integer`);
    await queryRunner.query(
      `ALTER TABLE "initial_report" ADD "ndcType" "public"."initial_report_ndctype_enum"`
    );
    await queryRunner.query(`ALTER TABLE "initial_report" ADD "baseYear" integer`);
    // The emission value AT baseYear, collected on the report itself
    // rather than looked up from the separate Emission domain — see
    // InitialReportService.submitReport, which used to require a
    // pre-existing Emission row for this year/country before a report
    // could be filed at all.
    await queryRunner.query(
      `ALTER TABLE "initial_report" ADD "baseYearEmission" numeric(15,5)`
    );
    await queryRunner.query(
      `ALTER TABLE "initial_report" ADD "ndcTarget" numeric(15,5)`
    );
    await queryRunner.query(
      `ALTER TABLE "initial_report" ADD "caMethod" "public"."initial_report_camethod_enum"`
    );
    await queryRunner.query(`ALTER TABLE "initial_report" ADD "sectors" text[]`);
    await queryRunner.query(
      `ALTER TABLE "initial_report" ADD "majorVersion" integer NOT NULL DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "initial_report" ADD "minorVersion" integer NOT NULL DEFAULT 0`
    );

    // One report group per legacy cooperativeApproachId (the old model
    // was 1:1), numbered by earliest createdTime — kept in a temp table
    // so the group -> reportNumber mapping is computed once.
    await queryRunner.query(`
      CREATE TEMPORARY TABLE "ir_report_groups" AS
      SELECT
        "cooperativeApproachId",
        'IR-' || LPAD(
          (ROW_NUMBER() OVER (ORDER BY MIN("createdTime")))::text, 3, '0'
        ) AS "reportNumber",
        MIN("createdTime") AS "firstTime"
      FROM "initial_report"
      GROUP BY "cooperativeApproachId"
    `);

    await queryRunner.query(`
      UPDATE "initial_report" ir
      SET "reportNumber" = g."reportNumber"
      FROM "ir_report_groups" g
      WHERE ir."cooperativeApproachId" = g."cooperativeApproachId"
    `);

    // Lift the three real ndcQuantification fields onto columns.
    // ndcStartYear / ndcType / caMethod have no legacy source and stay
    // null — see header comment.
    await queryRunner.query(`
      UPDATE "initial_report" SET
        "ndcTarget" = NULLIF("ndcQuantification"->>'ndcTarget', '')::numeric,
        "baseYear" = NULLIF("ndcQuantification"->>'baseYear', '')::integer,
        "ndcEndYear" = NULLIF("ndcQuantification"->>'targetYear', '')::integer,
        "sectors" = ARRAY(
          SELECT jsonb_array_elements_text(COALESCE("ndcQuantification"->'sectors', '[]'::jsonb))
        )
    `);

    // One link row per group, from the most recent legacy row (by
    // version, then createdTime) — addedInMajor = 1 since every
    // existing report has exactly one linked approach.
    await queryRunner.query(`
      INSERT INTO "initial_report_cooperative_approach"
        ("reportNumber", "cooperativeApproachId", "addedInMajor", "removedInMajor",
         "cooperativeApproachDetails", "createdTime")
      SELECT DISTINCT ON (ir."cooperativeApproachId")
        ir."reportNumber", ir."cooperativeApproachId", 1, NULL,
        ir."cooperativeApproachDetails", ir."createdTime"
      FROM "initial_report" ir
      ORDER BY ir."cooperativeApproachId", ir."version" DESC, ir."createdTime" DESC
    `);

    // One version snapshot per legacy row that was Submitted, numbered
    // 1.0, 2.0, ... by createdTime within its group (today's data has
    // exactly one Submitted row per group, i.e. every report lands on
    // 1.0, but this stays correct for a group with more history).
    await queryRunner.query(`
      INSERT INTO "initial_report_version"
        ("reportNumber", "majorVersion", "minorVersion",
         "changedCooperativeApproachId", "submittedBy", "submittedTime", "snapshot")
      SELECT
        g."reportNumber",
        (ROW_NUMBER() OVER (
          PARTITION BY ir."cooperativeApproachId" ORDER BY ir."createdTime" ASC
        ))::integer,
        0,
        ir."cooperativeApproachId",
        NULL,
        ir."createdTime",
        jsonb_build_object(
          'general', jsonb_build_object(
            'ndcTarget', ir."ndcQuantification"->'ndcTarget',
            'baseYear', ir."ndcQuantification"->'baseYear',
            'ndcEndYear', ir."ndcQuantification"->'targetYear',
            'sectors', COALESCE(ir."ndcQuantification"->'sectors', '[]'::jsonb),
            'caMethodDescription', ir."caMethodDescription",
            'participationDemonstration', ir."participationDemonstration",
            'itmoMetrics', ir."itmoMetrics",
            'environmentalIntegrity', ir."environmentalIntegrity"
          ),
          'cooperativeApproaches', jsonb_build_array(
            jsonb_build_object(
              'cooperativeApproachId', ir."cooperativeApproachId",
              'addedInMajor', 1,
              'details', ir."cooperativeApproachDetails",
              'authorizedEntities', COALESCE(
                (SELECT jsonb_agg(e) FROM "ca_authorized_entity" e
                  WHERE e."cooperativeApproachId" = ir."cooperativeApproachId"),
                '[]'::jsonb
              )
            )
          )
        )
      FROM "initial_report" ir
      JOIN "ir_report_groups" g ON g."cooperativeApproachId" = ir."cooperativeApproachId"
      WHERE ir."status" = 'Submitted'
    `);

    // Keep only the latest legacy row per group as the surviving
    // initial_report row; the rest are now fully represented by the
    // version snapshots just written.
    await queryRunner.query(`
      DELETE FROM "initial_report" WHERE "reportId" IN (
        SELECT "reportId" FROM (
          SELECT "reportId",
                 ROW_NUMBER() OVER (
                   PARTITION BY "cooperativeApproachId" ORDER BY "version" DESC, "createdTime" DESC
                 ) AS rn
          FROM "initial_report"
        ) ranked WHERE rn > 1
      )
    `);

    // Stamp the survivor with the last version actually filed.
    await queryRunner.query(`
      UPDATE "initial_report" ir
      SET "majorVersion" = v."majorVersion", "minorVersion" = v."minorVersion"
      FROM (
        SELECT DISTINCT ON ("reportNumber") "reportNumber", "majorVersion", "minorVersion"
        FROM "initial_report_version"
        ORDER BY "reportNumber", "majorVersion" DESC, "minorVersion" DESC
      ) v
      WHERE ir."reportNumber" = v."reportNumber"
    `);

    // Re-point the primary key from reportId to reportNumber, then drop
    // the columns the new shape no longer carries.
    await queryRunner.query(
      `ALTER TABLE "initial_report" DROP CONSTRAINT "PK_18de656d7ec0ba3f0905abc5f34"`
    );
    await queryRunner.query(
      `ALTER TABLE "initial_report" ALTER COLUMN "reportNumber" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "initial_report" ADD CONSTRAINT "PK_initial_report_reportNumber" PRIMARY KEY ("reportNumber")`
    );
    await queryRunner.query(`ALTER TABLE "initial_report" DROP COLUMN "reportId"`);
    await queryRunner.query(
      `ALTER TABLE "initial_report" DROP COLUMN "cooperativeApproachId"`
    );
    await queryRunner.query(
      `ALTER TABLE "initial_report" DROP COLUMN "cooperativeApproachDetails"`
    );
    await queryRunner.query(
      `ALTER TABLE "initial_report" DROP COLUMN "ndcQuantification"`
    );
    await queryRunner.query(`ALTER TABLE "initial_report" DROP COLUMN "version"`);

    await queryRunner.query(`
      ALTER TABLE "initial_report" ADD CONSTRAINT "UQ_initial_report_ndcPeriodId" UNIQUE ("ndcPeriodId")
    `);

    // "No two initial reports may cover overlapping NDC periods" —
    // guaranteed from the moment both period years are set (Draft
    // included, not just at submit; UQ_initial_report_ndcPeriodId above
    // only fires once a report is actually submitted). An exact-match
    // UNIQUE INDEX on (ndcStartYear, ndcEndYear) isn't enough — e.g.
    // 2021-2030 and 2021-2031 are distinct tuples but still overlap — so
    // this is a GIST exclusion constraint over the inclusive integer
    // range instead, which rejects any two rows whose ranges intersect.
    // Partial so a report can still be generated with no period chosen
    // yet. InitialReportService.assertPeriodAvailable is the
    // application-level check that turns a violation into a message
    // naming the report already holding the overlapping period; this
    // constraint is the backstop that makes it a real guarantee under
    // concurrent requests.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS btree_gist`);
    await queryRunner.query(`
      ALTER TABLE "initial_report" ADD CONSTRAINT "EXCL_initial_report_ndc_period_overlap"
        EXCLUDE USING gist (int4range("ndcStartYear", "ndcEndYear", '[]') WITH &&)
        WHERE ("ndcStartYear" IS NOT NULL AND "ndcEndYear" IS NOT NULL)
    `);

    await queryRunner.query(`DROP TABLE "ir_report_groups"`);

    // Reset the counter so the next generated report doesn't collide
    // with a reportNumber this backfill just minted.
    await queryRunner.query(`
      UPDATE "counter" SET counter = (SELECT COUNT(DISTINCT "reportNumber") FROM "initial_report")
      WHERE id = '19'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the old columns, then rebuild one legacy row PER LINK —
    // this is the lossy step: a report covering more than one approach
    // becomes multiple rows, each carrying the report's current general
    // fields (there is no way back to what a specific historical
    // version looked like once its snapshot's shape no longer exists).
    await queryRunner.query(`ALTER TABLE "initial_report" ADD "reportId" character varying`);
    await queryRunner.query(
      `ALTER TABLE "initial_report" ADD "cooperativeApproachId" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "initial_report" ADD "cooperativeApproachDetails" jsonb`
    );
    await queryRunner.query(`ALTER TABLE "initial_report" ADD "ndcQuantification" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "initial_report" ADD "version" integer NOT NULL DEFAULT 1`
    );

    await queryRunner.query(`
      CREATE TEMPORARY TABLE "ir_down_rows" AS
      SELECT
        ir."reportNumber",
        l."cooperativeApproachId",
        l."cooperativeApproachDetails",
        jsonb_build_object(
          'ndcTarget', ir."ndcTarget",
          'baseYear', ir."baseYear",
          'targetYear', ir."ndcEndYear",
          'sectors', to_jsonb(COALESCE(ir."sectors", ARRAY[]::text[])),
          'ghgs', '["CO2"]'::jsonb
        ) AS "ndcQuantification",
        ir."caMethodDescription", ir."participationDemonstration", ir."itmoMetrics",
        ir."environmentalIntegrity", ir."status", ir."majorVersion", ir."minorVersion",
        ir."generatedDocumentUrl", ir."createdTime", ir."updatedTime",
        ROW_NUMBER() OVER (ORDER BY ir."reportNumber", l."createdTime") AS "seq"
      FROM "initial_report" ir
      JOIN "initial_report_cooperative_approach" l ON l."reportNumber" = ir."reportNumber"
    `);

    await queryRunner.query(`
      UPDATE "initial_report" ir
      SET
        "cooperativeApproachId" = d."cooperativeApproachId",
        "cooperativeApproachDetails" = d."cooperativeApproachDetails",
        "ndcQuantification" = d."ndcQuantification",
        "reportId" = ir."reportNumber"
      FROM "ir_down_rows" d
      WHERE d."reportNumber" = ir."reportNumber" AND d."seq" = (
        SELECT MIN("seq") FROM "ir_down_rows" WHERE "reportNumber" = ir."reportNumber"
      )
    `);

    // Any additional linked approach on a multi-approach report becomes
    // its own row, reportId suffixed to stay unique.
    await queryRunner.query(`
      INSERT INTO "initial_report"
        ("reportId", "cooperativeApproachId", "version", "status",
         "participationDemonstration", "itmoMetrics", "caMethodDescription",
         "ndcQuantification", "cooperativeApproachDetails", "environmentalIntegrity",
         "generatedDocumentUrl", "createdTime", "updatedTime")
      SELECT
        d."reportNumber" || '-' || d."seq",
        d."cooperativeApproachId", 1, d."status",
        d."participationDemonstration", d."itmoMetrics", d."caMethodDescription",
        d."ndcQuantification", d."cooperativeApproachDetails", d."environmentalIntegrity",
        d."generatedDocumentUrl", d."createdTime", d."updatedTime"
      FROM "ir_down_rows" d
      WHERE d."seq" > (SELECT MIN("seq") FROM "ir_down_rows" d2 WHERE d2."reportNumber" = d."reportNumber")
    `);

    await queryRunner.query(`DROP TABLE "ir_down_rows"`);

    await queryRunner.query(
      `ALTER TABLE "initial_report" DROP CONSTRAINT "EXCL_initial_report_ndc_period_overlap"`
    );
    await queryRunner.query(
      `ALTER TABLE "initial_report" DROP CONSTRAINT "UQ_initial_report_ndcPeriodId"`
    );
    await queryRunner.query(
      `ALTER TABLE "initial_report" DROP CONSTRAINT "PK_initial_report_reportNumber"`
    );
    await queryRunner.query(`ALTER TABLE "initial_report" ALTER COLUMN "reportId" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "initial_report" ADD CONSTRAINT "PK_18de656d7ec0ba3f0905abc5f34" PRIMARY KEY ("reportId")`
    );
    await queryRunner.query(
      `ALTER TABLE "initial_report" ALTER COLUMN "cooperativeApproachId" SET NOT NULL`
    );

    await queryRunner.query(`ALTER TABLE "initial_report" DROP COLUMN "reportNumber"`);
    await queryRunner.query(`ALTER TABLE "initial_report" DROP COLUMN "ndcStartYear"`);
    await queryRunner.query(`ALTER TABLE "initial_report" DROP COLUMN "ndcEndYear"`);
    await queryRunner.query(`ALTER TABLE "initial_report" DROP COLUMN "ndcPeriodId"`);
    await queryRunner.query(`ALTER TABLE "initial_report" DROP COLUMN "ndcType"`);
    await queryRunner.query(`ALTER TABLE "initial_report" DROP COLUMN "baseYear"`);
    await queryRunner.query(`ALTER TABLE "initial_report" DROP COLUMN "baseYearEmission"`);
    await queryRunner.query(`ALTER TABLE "initial_report" DROP COLUMN "ndcTarget"`);
    await queryRunner.query(`ALTER TABLE "initial_report" DROP COLUMN "caMethod"`);
    await queryRunner.query(`ALTER TABLE "initial_report" DROP COLUMN "sectors"`);
    await queryRunner.query(`ALTER TABLE "initial_report" DROP COLUMN "majorVersion"`);
    await queryRunner.query(`ALTER TABLE "initial_report" DROP COLUMN "minorVersion"`);
    await queryRunner.query(`DROP TYPE "public"."initial_report_ndctype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."initial_report_camethod_enum"`);

    await dropView(queryRunner, "ndc_target_yearly");

    await queryRunner.query(
      `ALTER TABLE "ndc_target" DROP CONSTRAINT "UQ_ndc_target_period_country"`
    );
    await queryRunner.query(`ALTER TABLE "ndc_target" ADD "year" character varying`);
    await queryRunner.query(`
      UPDATE "ndc_target" SET "year" = "targetYear"::text WHERE "targetYear" IS NOT NULL
    `);
    await queryRunner.query(`ALTER TABLE "ndc_target" ALTER COLUMN "year" SET NOT NULL`);
    await queryRunner.query(`
      ALTER TABLE "ndc_target" ADD CONSTRAINT "UQ_480555ce609f07497c81b97eedd" UNIQUE ("year", "country")
    `);
    await queryRunner.query(`ALTER TABLE "ndc_target" DROP COLUMN "ndcStartYear"`);
    await queryRunner.query(`ALTER TABLE "ndc_target" DROP COLUMN "ndcEndYear"`);
    await queryRunner.query(`ALTER TABLE "ndc_target" DROP COLUMN "baseYear"`);
    await queryRunner.query(`ALTER TABLE "ndc_target" DROP COLUMN "baseYearEmission"`);
    await queryRunner.query(`ALTER TABLE "ndc_target" DROP COLUMN "targetYear"`);
    await queryRunner.query(`ALTER TABLE "ndc_target" DROP COLUMN "ndcTarget"`);
    await queryRunner.query(`ALTER TABLE "ndc_target" DROP COLUMN "sourceReportNumber"`);

    await queryRunner.query(`DROP TABLE "initial_report_version"`);
    await queryRunner.query(`DROP TABLE "initial_report_cooperative_approach"`);
  }
}

// Matches libs/shared/src/view-entities/ndc.target.yearly.view.entity.ts
// and the reference implementation in
// libs/shared/src/initial-report/ndc-trajectory.ts.
const NDC_TARGET_YEARLY_SQL = `
      SELECT
        y AS "targetYear",
        t."country" AS "country",
        t."ndcType" AS "ndcType",
        t."baseYear" AS "baseYear",
        t."baseYearEmission" AS "baseYearEmission",
        t."ndcTarget" AS "periodTarget",
        t."sourceReportNumber" AS "sourceReportNumber",
        ROUND(
          t."baseYearEmission"
            + (t."ndcTarget" - t."baseYearEmission")
              * (y - t."baseYear")::numeric
              / (t."targetYear" - t."baseYear")::numeric
        , 5) AS "singleYearTarget"
      FROM "ndc_target" t
      CROSS JOIN LATERAL generate_series(t."ndcStartYear", t."ndcEndYear") AS y
      WHERE t."ndcType" = 'SingleYear'
        AND t."baseYear" IS NOT NULL
        AND t."baseYearEmission" IS NOT NULL
        AND t."targetYear" IS NOT NULL
        AND t."ndcTarget" IS NOT NULL
        AND t."targetYear" > t."baseYear"
    `;

async function dropView(queryRunner: QueryRunner, view: string): Promise<void> {
  await queryRunner.query(
    `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
    ["VIEW", view, "public"]
  );
  await queryRunner.query(`DROP VIEW IF EXISTS "${view}"`);
}

async function createView(
  queryRunner: QueryRunner,
  view: string,
  sql: string
): Promise<void> {
  await queryRunner.query(`CREATE VIEW "${view}" AS ${sql}`);
  await queryRunner.query(
    `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
    ["public", "VIEW", view, sql]
  );
}
