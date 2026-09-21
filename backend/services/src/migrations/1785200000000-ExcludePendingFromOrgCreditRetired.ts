import { MigrationInterface, QueryRunner } from "typeorm";

// Forward-fixes the two org-credit views added by
// 1785000000000-AddOrgCreditInteractionViews.ts: their "Retired" branches
// counted retirements still awaiting DNA approval (status = 'Pending') as
// already retired, inflating creditRetired and the org transactions feed.
// Written as a new migration rather than editing 1785000000000 in place -
// that migration has already run (with the old SQL) against develop's test
// database, so TypeORM would just skip it there; only a new migration
// actually reaches an environment that's already applied the old one. Safe
// to run again on an environment seeing 1785000000000 for the first time
// with this fix already baked in (e.g. a fresh DB) - it just re-applies the
// same CREATE VIEW SQL a second time.
const ORG_TRANSACTIONS_VIEW = "credit_block_org_transactions_view_entity";
const ORG_AGGREGATION_VIEW = "credit_block_org_aggregation_view_entity";

const ORG_TRANSACTIONS_SQL = `
      SELECT
        ct."id" AS "id",
        'Issued' AS "currentStatus",
        ct."recieverId" AS "organizationId",
        ct."serialNumber" AS "serialNumber",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        s."name" AS "senderName",
        s."logo" AS "senderLogo",
        r."name" AS "receiverName",
        r."logo" AS "receiverLogo",
        ct."createTime" AS "updatedDate",
        ct."amount" AS "creditAmount"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      WHERE ct."type" = 'Issued'

      UNION ALL

      SELECT
        ct."id" AS "id",
        'Received' AS "currentStatus",
        ct."recieverId" AS "organizationId",
        ct."serialNumber" AS "serialNumber",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        s."name" AS "senderName",
        s."logo" AS "senderLogo",
        r."name" AS "receiverName",
        r."logo" AS "receiverLogo",
        ct."createTime" AS "updatedDate",
        ct."amount" AS "creditAmount"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      WHERE ct."type" IN ('Transfered', 'FirstTransfer')

      UNION ALL

      SELECT
        ct."id" AS "id",
        'Transferred' AS "currentStatus",
        ct."senderId" AS "organizationId",
        ct."serialNumber" AS "serialNumber",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        s."name" AS "senderName",
        s."logo" AS "senderLogo",
        r."name" AS "receiverName",
        r."logo" AS "receiverLogo",
        ct."createTime" AS "updatedDate",
        ct."amount" AS "creditAmount"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      WHERE ct."type" IN ('Transfered', 'FirstTransfer')

      UNION ALL

      SELECT
        ct."id" AS "id",
        'Retired' AS "currentStatus",
        ct."senderId" AS "organizationId",
        ct."serialNumber" AS "serialNumber",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        s."name" AS "senderName",
        s."logo" AS "senderLogo",
        r."name" AS "receiverName",
        r."logo" AS "receiverLogo",
        ct."createTime" AS "updatedDate",
        ct."amount" AS "creditAmount"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      WHERE ct."type" = 'Retired'
      AND ct.status != 'Pending'
    `;

const ORG_TRANSACTIONS_SQL_OLD = `
      SELECT
        ct."id" AS "id",
        'Issued' AS "currentStatus",
        ct."recieverId" AS "organizationId",
        ct."serialNumber" AS "serialNumber",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        s."name" AS "senderName",
        s."logo" AS "senderLogo",
        r."name" AS "receiverName",
        r."logo" AS "receiverLogo",
        ct."createTime" AS "updatedDate",
        ct."amount" AS "creditAmount"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      WHERE ct."type" = 'Issued'

      UNION ALL

      SELECT
        ct."id" AS "id",
        'Received' AS "currentStatus",
        ct."recieverId" AS "organizationId",
        ct."serialNumber" AS "serialNumber",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        s."name" AS "senderName",
        s."logo" AS "senderLogo",
        r."name" AS "receiverName",
        r."logo" AS "receiverLogo",
        ct."createTime" AS "updatedDate",
        ct."amount" AS "creditAmount"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      WHERE ct."type" IN ('Transfered', 'FirstTransfer')

      UNION ALL

      SELECT
        ct."id" AS "id",
        'Transferred' AS "currentStatus",
        ct."senderId" AS "organizationId",
        ct."serialNumber" AS "serialNumber",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        s."name" AS "senderName",
        s."logo" AS "senderLogo",
        r."name" AS "receiverName",
        r."logo" AS "receiverLogo",
        ct."createTime" AS "updatedDate",
        ct."amount" AS "creditAmount"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      WHERE ct."type" IN ('Transfered', 'FirstTransfer')

      UNION ALL

      SELECT
        ct."id" AS "id",
        'Retired' AS "currentStatus",
        ct."senderId" AS "organizationId",
        ct."serialNumber" AS "serialNumber",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        s."name" AS "senderName",
        s."logo" AS "senderLogo",
        r."name" AS "receiverName",
        r."logo" AS "receiverLogo",
        ct."createTime" AS "updatedDate",
        ct."amount" AS "creditAmount"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      WHERE ct."type" = 'Retired'
    `;

const ORG_AGGREGATION_SQL = `
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

export class ExcludePendingFromOrgCreditRetired1785200000000
  implements MigrationInterface
{
  name = "ExcludePendingFromOrgCreditRetired1785200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ["VIEW", ORG_AGGREGATION_VIEW, "public"]
    );
    await queryRunner.query(`DROP VIEW "${ORG_AGGREGATION_VIEW}"`);

    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ["VIEW", ORG_TRANSACTIONS_VIEW, "public"]
    );
    await queryRunner.query(`DROP VIEW "${ORG_TRANSACTIONS_VIEW}"`);

    await queryRunner.query(
      `CREATE VIEW "${ORG_TRANSACTIONS_VIEW}" AS ${ORG_TRANSACTIONS_SQL}`
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      ["public", "VIEW", ORG_TRANSACTIONS_VIEW, ORG_TRANSACTIONS_SQL]
    );

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
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ["VIEW", ORG_TRANSACTIONS_VIEW, "public"]
    );
    await queryRunner.query(`DROP VIEW "${ORG_TRANSACTIONS_VIEW}"`);

    await queryRunner.query(
      `CREATE VIEW "${ORG_TRANSACTIONS_VIEW}" AS ${ORG_TRANSACTIONS_SQL_OLD}`
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      ["public", "VIEW", ORG_TRANSACTIONS_VIEW, ORG_TRANSACTIONS_SQL_OLD]
    );

    await queryRunner.query(
      `CREATE VIEW "${ORG_AGGREGATION_VIEW}" AS ${ORG_AGGREGATION_SQL_OLD}`
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      ["public", "VIEW", ORG_AGGREGATION_VIEW, ORG_AGGREGATION_SQL_OLD]
    );
  }
}
