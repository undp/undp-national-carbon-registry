import { MigrationInterface, QueryRunner } from "typeorm";

// Adds the two per-organization credit views:
//   - credit_block_org_transactions_view_entity: the org-scoped interactions
//     feed (issued / received / transferred / retired) behind POST
//     /national/creditTransactionsManagement/orgCreditBlocks.
//   - credit_block_org_aggregation_view_entity: per-org lifetime totals used
//     by the View Organisations table (creditIssued / creditRetired) and the
//     org profile credit summary card.
// Written by hand rather than via `migration:generate` - the local dev DB runs
// with synchronize=true (NODE_ENV=dev) so it had already auto-synced these
// views, leaving nothing to diff. The CREATE VIEW SQL is copied verbatim from
// the corresponding view-entity `expression`, matching the convention set by
// 1784711176589-AddCreditBlockIssuancesView.ts.

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

export class AddOrgCreditInteractionViews1785000000000
  implements MigrationInterface
{
  name = "AddOrgCreditInteractionViews1785000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
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
  }
}
