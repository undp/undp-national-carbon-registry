import { MigrationInterface, QueryRunner } from "typeorm";

// Adds creditReceived to credit_block_org_aggregation_view_entity -
// SUM(amount) of Transfered/FirstTransfer txns received (recieverId), the
// aggregation counterpart of the org transactions feed's existing
// "Received" rows. Written as a new migration rather than editing
// 1785200000000-ExcludePendingFromOrgCreditRetired.ts in place - that
// migration is already merged into develop (and so has already run against
// its test database), so TypeORM would just skip a re-edited version of it
// there; only a new migration actually reaches an environment that's
// already applied it.
const ORG_AGGREGATION_VIEW = "credit_block_org_aggregation_view_entity";

const ORG_AGGREGATION_SQL = `
    SELECT
      c."companyId" AS "organizationId",
      COALESCE(iss."creditIssued", 0) AS "creditIssued",
      COALESCE(ret."creditRetired", 0) AS "creditRetired",
      COALESCE(tr."creditTransferred", 0) AS "creditTransferred",
      COALESCE(rec."creditReceived", 0) AS "creditReceived",
      COALESCE(bal."creditReserved", 0) AS "creditReserved",
      COALESCE(bal."creditBalance", 0) AS "creditBalance"
    FROM "company" c
    LEFT JOIN (
      SELECT ct."recieverId" AS "organizationId", SUM(ct."amount") AS "creditIssued"
      FROM "credit_transactions_entity" ct
      WHERE ct."type" = 'Issued'
      GROUP BY ct."recieverId"
    ) iss ON iss."organizationId" = c."companyId"
    LEFT JOIN (
      SELECT ct."senderId" AS "organizationId", SUM(ct."amount") AS "creditRetired"
      FROM "credit_transactions_entity" ct
      WHERE ct."type" = 'Retired'
      AND ct.status != 'Pending'
      GROUP BY ct."senderId"
    ) ret ON ret."organizationId" = c."companyId"
    LEFT JOIN (
      SELECT ct."senderId" AS "organizationId", SUM(ct."amount") AS "creditTransferred"
      FROM "credit_transactions_entity" ct
      WHERE ct."type" IN ('Transfered', 'FirstTransfer')
      GROUP BY ct."senderId"
    ) tr ON tr."organizationId" = c."companyId"
    LEFT JOIN (
      SELECT ct."recieverId" AS "organizationId", SUM(ct."amount") AS "creditReceived"
      FROM "credit_transactions_entity" ct
      WHERE ct."type" IN ('Transfered', 'FirstTransfer')
      GROUP BY ct."recieverId"
    ) rec ON rec."organizationId" = c."companyId"
    LEFT JOIN (
      SELECT
        cb."ownerCompanyId" AS "organizationId",
        SUM(cb."reservedCreditAmount") AS "creditReserved",
        SUM(cb."creditAmount" - cb."reservedCreditAmount") AS "creditBalance"
      FROM "credit_blocks_entity" cb
      WHERE cb."ownerCompanyId" != 0
      GROUP BY cb."ownerCompanyId"
    ) bal ON bal."organizationId" = c."companyId"`;

const ORG_AGGREGATION_SQL_OLD = `
    SELECT
      c."companyId" AS "organizationId",
      COALESCE(iss."creditIssued", 0) AS "creditIssued",
      COALESCE(ret."creditRetired", 0) AS "creditRetired",
      COALESCE(tr."creditTransferred", 0) AS "creditTransferred",
      COALESCE(bal."creditReserved", 0) AS "creditReserved",
      COALESCE(bal."creditBalance", 0) AS "creditBalance"
    FROM "company" c
    LEFT JOIN (
      SELECT ct."recieverId" AS "organizationId", SUM(ct."amount") AS "creditIssued"
      FROM "credit_transactions_entity" ct
      WHERE ct."type" = 'Issued'
      GROUP BY ct."recieverId"
    ) iss ON iss."organizationId" = c."companyId"
    LEFT JOIN (
      SELECT ct."senderId" AS "organizationId", SUM(ct."amount") AS "creditRetired"
      FROM "credit_transactions_entity" ct
      WHERE ct."type" = 'Retired'
      AND ct.status != 'Pending'
      GROUP BY ct."senderId"
    ) ret ON ret."organizationId" = c."companyId"
    LEFT JOIN (
      SELECT ct."senderId" AS "organizationId", SUM(ct."amount") AS "creditTransferred"
      FROM "credit_transactions_entity" ct
      WHERE ct."type" IN ('Transfered', 'FirstTransfer')
      GROUP BY ct."senderId"
    ) tr ON tr."organizationId" = c."companyId"
    LEFT JOIN (
      SELECT
        cb."ownerCompanyId" AS "organizationId",
        SUM(cb."reservedCreditAmount") AS "creditReserved",
        SUM(cb."creditAmount" - cb."reservedCreditAmount") AS "creditBalance"
      FROM "credit_blocks_entity" cb
      WHERE cb."ownerCompanyId" != 0
      GROUP BY cb."ownerCompanyId"
    ) bal ON bal."organizationId" = c."companyId"`;

export class AddOrgCreditReceived1785300000000 implements MigrationInterface {
  name = "AddOrgCreditReceived1785300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ["VIEW", ORG_AGGREGATION_VIEW, "public"]
    );
    await queryRunner.query(`DROP VIEW "${ORG_AGGREGATION_VIEW}"`);

    await queryRunner.query(
      `CREATE VIEW "${ORG_AGGREGATION_VIEW}" AS ${ORG_AGGREGATION_SQL}`
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      ["public", "VIEW", ORG_AGGREGATION_VIEW, ORG_AGGREGATION_SQL]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ["VIEW", ORG_AGGREGATION_VIEW, "public"]
    );
    await queryRunner.query(`DROP VIEW "${ORG_AGGREGATION_VIEW}"`);

    await queryRunner.query(
      `CREATE VIEW "${ORG_AGGREGATION_VIEW}" AS ${ORG_AGGREGATION_SQL_OLD}`
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      ["public", "VIEW", ORG_AGGREGATION_VIEW, ORG_AGGREGATION_SQL_OLD]
    );
  }
}
