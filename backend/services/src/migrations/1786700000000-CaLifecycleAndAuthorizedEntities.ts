import { MigrationInterface, QueryRunner } from "typeorm";

// Step 2 of the Article 6.2 refactor (UNCR-468):
//
// cooperative_approach
//   - "caReferenceNumber" (unique, nullable): mocked CARP-style CAxxxx
//     reference issued from a counter the first time an approach
//     becomes Active.
//
// initial_report
//   - "version" (int, default 1): append-only edit versioning — each
//     edit of a draft report inserts a new row with version + 1; the
//     row with MAX(version) per cooperative approach is the live one.
//
// ca_authorized_entity (new)
//   - Entities authorized under an Active cooperative approach (AEF v2
//     "Authorized entities" table shape). Removal soft-flips status to
//     'Inactive' so authorization history is retained.
//   - "countryOfIncorporation" (text, nullable): the country the entity is
//     incorporated in. Required at the DTO layer; nullable here so it can
//     stay unset for entities that predate this becoming mandatory
//     (folded directly into the table here rather than living in its own
//     later migration — squashed as part of the UNCR-468 migration
//     cleanup, since neither migration had ever been run).
//
// Written by hand rather than via `migration:generate` - the local dev
// DB runs with synchronize=true (NODE_ENV=dev) and has already
// auto-synced this schema. Same convention as
// 1785500000000-AddProjectOwnerToCreditViews.ts.
export class CaLifecycleAndAuthorizedEntities1786700000000
  implements MigrationInterface
{
  name = "CaLifecycleAndAuthorizedEntities1786700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cooperative_approach" ADD "caReferenceNumber" text`
    );
    await queryRunner.query(
      `ALTER TABLE "cooperative_approach" ADD CONSTRAINT "UQ_cooperative_approach_caReferenceNumber" UNIQUE ("caReferenceNumber")`
    );
    await queryRunner.query(
      `ALTER TABLE "initial_report" ADD "version" integer NOT NULL DEFAULT '1'`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."ca_authorized_entity_status_enum" AS ENUM('Active', 'Inactive')`
    );
    await queryRunner.query(
      `CREATE TABLE "ca_authorized_entity" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "cooperativeApproachId" character varying NOT NULL,
        "entityName" character varying NOT NULL,
        "entityIdentifier" text,
        "authorizingParty" text,
        "countryOfIncorporation" text,
        "authorizationDate" bigint,
        "authorizationReference" text,
        "status" "public"."ca_authorized_entity_status_enum" NOT NULL DEFAULT 'Active',
        "createdTime" bigint NOT NULL,
        "updatedTime" bigint NOT NULL,
        CONSTRAINT "PK_ca_authorized_entity_id" PRIMARY KEY ("id")
      )`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ca_authorized_entity"`);
    await queryRunner.query(
      `DROP TYPE "public"."ca_authorized_entity_status_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "initial_report" DROP COLUMN "version"`
    );
    await queryRunner.query(
      `ALTER TABLE "cooperative_approach" DROP CONSTRAINT "UQ_cooperative_approach_caReferenceNumber"`
    );
    await queryRunner.query(
      `ALTER TABLE "cooperative_approach" DROP COLUMN "caReferenceNumber"`
    );
  }
}
