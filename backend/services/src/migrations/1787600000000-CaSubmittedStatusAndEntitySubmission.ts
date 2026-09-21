import { MigrationInterface, QueryRunner } from "typeorm";

// UNCR-478 — authorized entities are submitted with the cooperative
// approach, and the approach gains a Submitted state:
//
// cooperative_approach_status_enum
//   - new 'Submitted' value between 'Draft' and 'Active'. Set only by
//     InitialReportService.submitReport via markSubmitted(); Draft has
//     no manual transitions and Submitted can only move on to Active.
//
// ca_authorized_entity
//   - "submissionStatus" (Draft/Submitted): a second axis alongside the
//     existing Active/Inactive "status", which answers a different
//     question (is the authorization currently in force). Entities are
//     created against a Draft approach and flip to Submitted with it;
//     only Submitted entities are reportable in AEF Table 5.
//   - Backfill sets every existing row to 'Submitted': before this
//     change entities could only be created against an Active approach,
//     so all of them are post-submission by construction.
//
// The status enum is rebuilt rather than extended with ALTER TYPE ...
// ADD VALUE because TypeORM runs each migration inside a transaction,
// and a newly added enum value cannot be used in the same transaction
// that adds it.
//
// Written by hand rather than via `migration:generate` - the local dev
// DB runs with synchronize=true (NODE_ENV=dev) and has already
// auto-synced this schema. Same convention as
// 1786700000000-CaLifecycleAndAuthorizedEntities.ts.
export class CaSubmittedStatusAndEntitySubmission1787600000000
  implements MigrationInterface
{
  name = "CaSubmittedStatusAndEntitySubmission1787600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."cooperative_approach_status_enum" RENAME TO "cooperative_approach_status_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."cooperative_approach_status_enum" AS ENUM('Draft', 'Submitted', 'Active', 'Suspended', 'Completed', 'Revoked')`
    );
    await queryRunner.query(
      `ALTER TABLE "cooperative_approach" ALTER COLUMN "status" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "cooperative_approach" ALTER COLUMN "status" TYPE "public"."cooperative_approach_status_enum" USING "status"::text::"public"."cooperative_approach_status_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "cooperative_approach" ALTER COLUMN "status" SET DEFAULT 'Draft'`
    );
    await queryRunner.query(
      `DROP TYPE "public"."cooperative_approach_status_enum_old"`
    );

    await queryRunner.query(
      `CREATE TYPE "public"."ca_authorized_entity_submission_status_enum" AS ENUM('Draft', 'Submitted')`
    );
    await queryRunner.query(
      `ALTER TABLE "ca_authorized_entity" ADD "submissionStatus" "public"."ca_authorized_entity_submission_status_enum" NOT NULL DEFAULT 'Draft'`
    );
    await queryRunner.query(
      `UPDATE "ca_authorized_entity" SET "submissionStatus" = 'Submitted'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ca_authorized_entity" DROP COLUMN "submissionStatus"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."ca_authorized_entity_submission_status_enum"`
    );

    // Submitted has no pre-existing equivalent — the closest prior state
    // for an approach whose initial report was filed but not yet
    // activated is Draft, which is what it would have been before.
    await queryRunner.query(
      `UPDATE "cooperative_approach" SET "status" = 'Draft' WHERE "status" = 'Submitted'`
    );
    await queryRunner.query(
      `ALTER TYPE "public"."cooperative_approach_status_enum" RENAME TO "cooperative_approach_status_enum_new"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."cooperative_approach_status_enum" AS ENUM('Draft', 'Active', 'Suspended', 'Completed', 'Revoked')`
    );
    await queryRunner.query(
      `ALTER TABLE "cooperative_approach" ALTER COLUMN "status" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "cooperative_approach" ALTER COLUMN "status" TYPE "public"."cooperative_approach_status_enum" USING "status"::text::"public"."cooperative_approach_status_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "cooperative_approach" ALTER COLUMN "status" SET DEFAULT 'Draft'`
    );
    await queryRunner.query(
      `DROP TYPE "public"."cooperative_approach_status_enum_new"`
    );
  }
}
