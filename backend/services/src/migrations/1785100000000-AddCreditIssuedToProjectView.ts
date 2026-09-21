import { MigrationInterface, QueryRunner } from "typeorm";

// Adds project_entity.creditIssued (already incrementally maintained by
// programme-ledger.service.ts on every issuance) to project_view_entity, the
// view behind POST national/projectManagement/query. Mirrors creditBalance/
// creditRetired, which the view already selected from the same row -
// creditIssued was simply missing from the SELECT list. Written by hand
// rather than via `migration:generate` per the convention set by
// 1784870412942-CreditBalanceAggregationViews.ts (local dev runs
// synchronize=true, so there's nothing for the generator to diff).
export class AddCreditIssuedToProjectView1785100000000
  implements MigrationInterface
{
  name = "AddCreditIssuedToProjectView1785100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ["VIEW", "project_view_entity", "public"]
    );
    await queryRunner.query(`DROP VIEW "project_view_entity"`);

    await queryRunner.query(`CREATE VIEW "project_view_entity" AS
    SELECT
      p."refId" as "projectId",
      p."refId",
      p."title",
      p."projectProposalStage",
      p."createTime" as "createdTime",
      p."creditBalance",
      p."creditRetired",
      p."creditIssued",
      p."sector",
      p."sectoralScope",
      p."authorizationId",
      p."independentCertifiers",
      c."companyId",
      c."name",
      c."logo",
      c."companyRole"
    FROM "project_entity" p
    JOIN "company" c ON p."companyId" = c."companyId"
  `);
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        "public",
        "VIEW",
        "project_view_entity",
        `SELECT
      p."refId" as "projectId",
      p."refId",
      p."title",
      p."projectProposalStage",
      p."createTime" as "createdTime",
      p."creditBalance",
      p."creditRetired",
      p."creditIssued",
      p."sector",
      p."sectoralScope",
      p."authorizationId",
      p."independentCertifiers",
      c."companyId",
      c."name",
      c."logo",
      c."companyRole"
    FROM "project_entity" p
    JOIN "company" c ON p."companyId" = c."companyId"
  `,
      ]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ["VIEW", "project_view_entity", "public"]
    );
    await queryRunner.query(`DROP VIEW "project_view_entity"`);

    await queryRunner.query(`CREATE VIEW "project_view_entity" AS
    SELECT
      p."refId" as "projectId",
      p."refId",
      p."title",
      p."projectProposalStage",
      p."createTime" as "createdTime",
      p."creditBalance",
      p."creditRetired",
      p."sector",
      p."sectoralScope",
      p."authorizationId",
      p."independentCertifiers",
      c."companyId",
      c."name",
      c."logo",
      c."companyRole"
    FROM "project_entity" p
    JOIN "company" c ON p."companyId" = c."companyId"
  `);
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        "public",
        "VIEW",
        "project_view_entity",
        `SELECT
      p."refId" as "projectId",
      p."refId",
      p."title",
      p."projectProposalStage",
      p."createTime" as "createdTime",
      p."creditBalance",
      p."creditRetired",
      p."sector",
      p."sectoralScope",
      p."authorizationId",
      p."independentCertifiers",
      c."companyId",
      c."name",
      c."logo",
      c."companyRole"
    FROM "project_entity" p
    JOIN "company" c ON p."companyId" = c."companyId"
  `,
      ]
    );
  }
}
