import { MigrationInterface, QueryRunner } from "typeorm";

// Continuation of the Article 6.2 refactor (UNCR-468): the organisation
// profile's transactions table needs to distinguish MO from ITMO credits,
// and to show ITMO authorizations at all. This recreates
// credit_block_org_transactions_view_entity to:
//
//   1. LEFT JOIN credit_blocks_entity on the transaction's creditBlockId and
//      expose "itmoAuthorizationRecord" - non-null => the units are ITMOs.
//      That is the same presence test every other credit table already uses
//      for its credit-type column. Note it reflects the units' *current*
//      character, so a block authorized in whole after issuance makes its
//      earlier "Issued" row read as ITMO too.
//   2. Add a fifth UNION branch for completed ITMO authorizations
//      ('ITMO Authorized'). Until now an authorization - a real action that
//      converts an org's MOs into ITMOs - never appeared in that org's own
//      transaction history at all. It is keyed on senderId only and surfaces
//      ONCE, unlike a transfer's two perspective rows, because an
//      authorization does not change hands (senderId = recieverId = the
//      owning org). Gated on status = 'Completed' for the same reason the
//      Retired branch is: a rejected/cancelled request is not an action that
//      happened.
//
// The block's itmoSerial is deliberately NOT joined here. That block row keeps
// getting re-split by later retirements/transfers, so a joined serial drifts
// away from the range a given action actually covered (e.g. an authorization
// of 2417-3916 whose block now reads 2417-2906). It is instead derived
// per row from the transaction's own frozen serialNumber - see
// CreditTransactionsManagementService.enrichOrgTransactionRowsWithItmoSerial,
// the same reasoning as enrichItmoAuthorizationRows and the note in
// 1787300000000-ItmoVisibilityViews.ts.
//
// Written by hand rather than via `migration:generate` - the local dev DB runs
// with synchronize=true (NODE_ENV=dev) and has already auto-synced this
// schema. Same convention as prior Step migrations. The SQL below is copied
// verbatim from the view-entity `expression`; the down() SQL is the previous
// definition from 1786600000000-CreditTxSubTypeAndItmoAuth.ts.
export class OrgTransactionsItmoType1787400000000 implements MigrationInterface {
  name = "OrgTransactionsItmoType1787400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await replaceView(
      queryRunner,
      "credit_block_org_transactions_view_entity",
      ORG_TRANSACTIONS_WITH_ITMO
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await replaceView(
      queryRunner,
      "credit_block_org_transactions_view_entity",
      ORG_TRANSACTIONS_WITHOUT_ITMO
    );
  }
}

async function replaceView(
  queryRunner: QueryRunner,
  view: string,
  sql: string
): Promise<void> {
  await queryRunner.query(
    `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
    ["VIEW", view, "public"]
  );
  await queryRunner.query(`DROP VIEW IF EXISTS "${view}"`);
  await queryRunner.query(`CREATE VIEW "${view}" AS ${sql}`);
  await queryRunner.query(
    `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
    ["public", "VIEW", view, sql]
  );
}

// Matches credit.block.org.transactions.view.entity.ts.
const ORG_TRANSACTIONS_WITH_ITMO = `
      SELECT
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
        ct."amount" AS "creditAmount",
        cb."itmoAuthorizationRecord" AS "itmoAuthorizationRecord"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      LEFT JOIN credit_blocks_entity cb ON ct."creditBlockId" = cb."creditBlockId"
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
        ct."amount" AS "creditAmount",
        cb."itmoAuthorizationRecord" AS "itmoAuthorizationRecord"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      LEFT JOIN credit_blocks_entity cb ON ct."creditBlockId" = cb."creditBlockId"
      WHERE ct."type" = 'Transfered'

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
        ct."amount" AS "creditAmount",
        cb."itmoAuthorizationRecord" AS "itmoAuthorizationRecord"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      LEFT JOIN credit_blocks_entity cb ON ct."creditBlockId" = cb."creditBlockId"
      WHERE ct."type" = 'Transfered'

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
        ct."amount" AS "creditAmount",
        cb."itmoAuthorizationRecord" AS "itmoAuthorizationRecord"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      LEFT JOIN credit_blocks_entity cb ON ct."creditBlockId" = cb."creditBlockId"
      WHERE ct."type" = 'Retired'
      AND ct.status = 'Completed'

      UNION ALL

      SELECT
        ct."id" AS "id",
        'ITMO Authorized' AS "currentStatus",
        ct."senderId" AS "organizationId",
        ct."serialNumber" AS "serialNumber",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        p."companyId" AS "projectOwnerId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo",
        NULL AS "receiverName",
        NULL AS "receiverLogo",
        ct."createTime" AS "updatedDate",
        ct."amount" AS "creditAmount",
        cb."itmoAuthorizationRecord" AS "itmoAuthorizationRecord"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN credit_blocks_entity cb ON ct."creditBlockId" = cb."creditBlockId"
      WHERE ct."type" = 'ItmoAuthorized'
      AND ct.status = 'Completed'
    `;

// Previous definition, from 1786600000000-CreditTxSubTypeAndItmoAuth.ts.
const ORG_TRANSACTIONS_WITHOUT_ITMO = `
      SELECT
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
      WHERE ct."type" = 'Transfered'

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
      WHERE ct."type" = 'Transfered'

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
      AND ct.status = 'Completed'
    `;
