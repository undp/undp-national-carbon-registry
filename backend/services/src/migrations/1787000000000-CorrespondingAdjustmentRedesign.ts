import { MigrationInterface, QueryRunner } from "typeorm";

// Step 5 of the Article 6.2 refactor (UNCR-468): Corresponding
// Adjustments redesign.
//
// ndc_target (new)
//   - The country's NDC target(s), one row per year (mirrors
//     "emission"'s exact shape: year+country unique, no in-app write
//     path — both are meant to be migrated in periodically from
//     outside the registry, never entered through a UI).
//
// corresponding_adjustment
//   - Gains "cumulativeFirstTransferred" / "indicativeAnnualAdjustment"
//     (MultiYear-only transparency figures — Decision 2/CMA.3's
//     indicative annual corresponding adjustment) and "remarks" (a
//     free-text admin annotation, editable while Draft, distinct from
//     the system-computed "safeguardNotes").
//
// Written by hand rather than via `migration:generate` - the local dev
// DB runs with synchronize=true (NODE_ENV=dev) and has already
// auto-synced this schema. Same convention as the preceding Steps'
// migrations.
export class CorrespondingAdjustmentRedesign1787000000000
  implements MigrationInterface
{
  name = "CorrespondingAdjustmentRedesign1787000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."ndc_target_ndctype_enum" AS ENUM('SingleYear', 'MultiYear')`
    );
    await queryRunner.query(
      `CREATE TABLE "ndc_target" (
        "id" SERIAL NOT NULL,
        "country" character varying NOT NULL,
        "year" character varying NOT NULL,
        "ndcType" "public"."ndc_target_ndctype_enum" NOT NULL,
        "singleYearTarget" numeric(15,5),
        "budgetPeriodStartYear" integer,
        "budgetPeriodEndYear" integer,
        "cumulativeBudget" numeric(15,5),
        "remarks" character varying,
        "createdAt" TIMESTAMP WITH TIME ZONE,
        "updatedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "UQ_ndc_target_year_country" UNIQUE ("year", "country"),
        CONSTRAINT "PK_ndc_target_id" PRIMARY KEY ("id")
      )`
    );

    await queryRunner.query(
      `ALTER TABLE "corresponding_adjustment" ADD "cumulativeFirstTransferred" numeric(15,5)`
    );
    await queryRunner.query(
      `ALTER TABLE "corresponding_adjustment" ADD "indicativeAnnualAdjustment" numeric(15,5)`
    );
    await queryRunner.query(
      `ALTER TABLE "corresponding_adjustment" ADD "remarks" text`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "corresponding_adjustment" DROP COLUMN "remarks"`
    );
    await queryRunner.query(
      `ALTER TABLE "corresponding_adjustment" DROP COLUMN "indicativeAnnualAdjustment"`
    );
    await queryRunner.query(
      `ALTER TABLE "corresponding_adjustment" DROP COLUMN "cumulativeFirstTransferred"`
    );

    await queryRunner.query(`DROP TABLE "ndc_target"`);
    await queryRunner.query(`DROP TYPE "public"."ndc_target_ndctype_enum"`);
  }
}
