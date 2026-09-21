import { MigrationInterface, QueryRunner } from "typeorm";

// Adds `projectOwnerId` (project_entity.companyId) to the four credit views
// behind the Credits tables and the organization profile. The frontend needs
// to know which organisation *developed* a project so it can gate the
// project-details link to that organisation; the ids these views already
// carry (receiverId / senderId / organizationId) are credit holders and
// transfer counterparties, which is a different thing - a Project Developer
// can hold credits for a project another org owns.
//
// Two views are deliberately left alone: the explorer view, because
// queryExplorer is DNA-only, and the per-block balances view, because the only
// component reading it renders serial numbers rather than project links.
//
// Written by hand rather than via `migration:generate` - the local dev DB runs
// with synchronize=true (NODE_ENV=dev) and has already auto-synced these views,
// leaving nothing for the generator to diff. Same convention as
// 1784870412942-CreditBalanceAggregationViews.ts. The SQL below is copied
// verbatim from each view-entity `expression`.
export class AddProjectOwnerToCreditViews1785500000000
  implements MigrationInterface
{
  name = "AddProjectOwnerToCreditViews1785500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await replaceView(
      queryRunner,
      "credit_block_transfers_view_entity",
      TRANSFERS_WITH_OWNER
    );
    await replaceView(
      queryRunner,
      "credit_block_retirements_view_entity",
      RETIREMENTS_WITH_OWNER
    );
    await replaceView(
      queryRunner,
      "credit_block_issuances_view_entity",
      ISSUANCES_WITH_OWNER
    );
    await replaceView(
      queryRunner,
      "credit_block_org_transactions_view_entity",
      ORG_TRANSACTIONS_WITH_OWNER
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await replaceView(
      queryRunner,
      "credit_block_org_transactions_view_entity",
      ORG_TRANSACTIONS_WITHOUT_OWNER
    );
    await replaceView(
      queryRunner,
      "credit_block_issuances_view_entity",
      ISSUANCES_WITHOUT_OWNER
    );
    await replaceView(
      queryRunner,
      "credit_block_retirements_view_entity",
      RETIREMENTS_WITHOUT_OWNER
    );
    await replaceView(
      queryRunner,
      "credit_block_transfers_view_entity",
      TRANSFERS_WITHOUT_OWNER
    );
  }
}

// Drops a view (and its typeorm_metadata row) and recreates it from `sql`,
// re-registering the metadata so TypeORM keeps tracking the definition.
async function replaceView(
  queryRunner: QueryRunner,
  view: string,
  sql: string
): Promise<void> {
  await queryRunner.query(
    `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
    ["VIEW", view, "public"]
  );
  await queryRunner.query(`DROP VIEW "${view}"`);
  await queryRunner.query(`CREATE VIEW "${view}" AS ${sql}`);
  await queryRunner.query(
    `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
    ["public", "VIEW", view, sql]
  );
}

const TRANSFERS_WITH_OWNER = `SELECT
        ct."id" AS "id",
        ct."serialNumber" AS "serialNumber",
        ct."amount" AS "creditAmount",
        ct."createTime" AS "createdDate",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        p."companyId" AS "projectOwnerId",
        ct."recieverId" AS "recieverId",
        r."name" AS "receiverName",
        r."logo" AS "receiverLogo",
        ct."senderId" AS "senderId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo",
        ct."type"::text AS "type",
        COALESCE(ct."isFirstTransfer", FALSE) AS "isFirstTransfer",
        ct."cooperativeApproachId" AS "cooperativeApproachId",
        ct."authorizationPurpose"::text AS "authorizationPurpose",
        ct."fromAccountType"::text AS "fromAccountType",
        ct."toAccountType"::text AS "toAccountType"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      WHERE ct."type" IN ('Transfered', 'FirstTransfer')`;

const TRANSFERS_WITHOUT_OWNER = `SELECT
        ct."id" AS "id",
        ct."serialNumber" AS "serialNumber",
        ct."amount" AS "creditAmount",
        ct."createTime" AS "createdDate",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        ct."recieverId" AS "recieverId",
        r."name" AS "receiverName",
        r."logo" AS "receiverLogo",
        ct."senderId" AS "senderId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo",
        ct."type"::text AS "type",
        COALESCE(ct."isFirstTransfer", FALSE) AS "isFirstTransfer",
        ct."cooperativeApproachId" AS "cooperativeApproachId",
        ct."authorizationPurpose"::text AS "authorizationPurpose",
        ct."fromAccountType"::text AS "fromAccountType",
        ct."toAccountType"::text AS "toAccountType"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      WHERE ct."type" IN ('Transfered', 'FirstTransfer')`;

const RETIREMENTS_WITH_OWNER = `SELECT
        ct."id" AS "id",
        ct."serialNumber" AS "serialNumber",
        ct."amount" AS "creditAmount",
        ct."createTime" AS "createdDate",
        ct."retirementType" AS "retirementType",
        ct."status" AS "status",
        ct."projectRefId" AS "projectId",
        country."name" AS "country",
        ct."organizationName",
        ct."remarks",
        p."title" AS "projectName",
        p."companyId" AS "projectOwnerId",
        ct."senderId" AS "senderId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN country ON ct."country" = country."alpha2"
      WHERE ct."type" = 'Retired'`;

const RETIREMENTS_WITHOUT_OWNER = `SELECT
        ct."id" AS "id",
        ct."serialNumber" AS "serialNumber",
        ct."amount" AS "creditAmount",
        ct."createTime" AS "createdDate",
        ct."retirementType" AS "retirementType",
        ct."status" AS "status",
        ct."projectRefId" AS "projectId",
        country."name" AS "country",
        ct."organizationName",
        ct."remarks",
        p."title" AS "projectName",
        ct."senderId" AS "senderId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN country ON ct."country" = country."alpha2"
      WHERE ct."type" = 'Retired'`;

const ISSUANCES_WITH_OWNER = `SELECT
        ct."id" AS "id",
        ct."serialNumber" AS "serialNumber",
        ct."amount" AS "creditAmount",
        ct."createTime" AS "issuanceDate",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        p."companyId" AS "projectOwnerId",
        ct."recieverId" AS "organizationId",
        r."name" AS "organizationName",
        r."logo" AS "organizationLogo"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      WHERE ct."type" = 'Issued'`;

const ISSUANCES_WITHOUT_OWNER = `SELECT
        ct."id" AS "id",
        ct."serialNumber" AS "serialNumber",
        ct."amount" AS "creditAmount",
        ct."createTime" AS "issuanceDate",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        ct."recieverId" AS "organizationId",
        r."name" AS "organizationName",
        r."logo" AS "organizationLogo"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      WHERE ct."type" = 'Issued'`;

const ORG_TRANSACTIONS_WITH_OWNER = `SELECT
        ct."id" AS "id",
        'Issued' AS "currentStatus",
        ct."recieverId" AS "organizationId",
        ct."serialNumber" AS "serialNumber",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        p."companyId" AS "projectOwnerId",
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
        p."companyId" AS "projectOwnerId",
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
        p."companyId" AS "projectOwnerId",
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
        p."companyId" AS "projectOwnerId",
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
      AND ct.status = 'Completed'`;

const ORG_TRANSACTIONS_WITHOUT_OWNER = `SELECT
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
      AND ct.status = 'Completed'`;
