import { MigrationInterface, QueryRunner } from "typeorm";

// Continuation of the Article 6.2 refactor (UNCR-468): the frontend
// Credits UI is being updated to surface MO vs ITMO everywhere a credit
// block or block-derived transaction is listed, and to show the ITMO
// serial (Dec 6/CMA.4 Annex I para 5 identifier) on hover/click. That
// data already lives on credit_blocks_entity (itmoSerial,
// itmoAuthorizationRecord) but most read-views never selected it, and
// the three aggregate balance views had no ITMO subtotal. This
// recreates the five affected views:
//   - credit_block_project_balances_view_entity
//   - credit_block_project_holder_balances_view_entity
//   - credit_block_org_balances_view_entity
//     (add itmoBalance / itmoReservedCredits alongside the existing
//     grand-total creditBalance / reservedCredits; MO figures are
//     derived client-side as total - itmo)
//   - credit_block_explorer_view_entity
//   - credit_block_retirements_view_entity
//
// credit_block_itmo_authorizations_view_entity is deliberately NOT
// touched here: an earlier draft of this migration joined
// credit_blocks_entity for itmoSerial, but that join is wrong — the
// block row it points at keeps getting re-split by later
// retirements/transfers, so the joined itmoSerial drifts away from
// what was actually generated for that specific authorization. The
// ITMO serial for that table is instead derived in
// CreditTransactionsManagementService.queryItmoAuthorizations from the
// transaction's own immutable serialNumber (reusing
// SerialNumberManagementService.getItmoSerial, the same helper that
// generated it in the first place) — no view change needed.
//
// Written by hand rather than via `migration:generate` - the local dev
// DB runs with synchronize=true (NODE_ENV=dev) and has already
// auto-synced this schema. Same convention as prior Step migrations
// (see 1787100000000-ItmoAuthorizationsView.ts).
export class ItmoVisibilityViews1787300000000 implements MigrationInterface {
  name = "ItmoVisibilityViews1787300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await dropView(queryRunner, "credit_block_project_balances_view_entity");
    await dropView(
      queryRunner,
      "credit_block_project_holder_balances_view_entity"
    );
    await dropView(queryRunner, "credit_block_org_balances_view_entity");
    await dropView(queryRunner, "credit_block_explorer_view_entity");
    await dropView(queryRunner, "credit_block_retirements_view_entity");

    await createView(
      queryRunner,
      "credit_block_project_balances_view_entity",
      PROJECT_BALANCES_SQL
    );
    await createView(
      queryRunner,
      "credit_block_project_holder_balances_view_entity",
      PROJECT_HOLDER_BALANCES_SQL
    );
    await createView(
      queryRunner,
      "credit_block_org_balances_view_entity",
      ORG_BALANCES_SQL
    );
    await createView(
      queryRunner,
      "credit_block_explorer_view_entity",
      EXPLORER_SQL
    );
    await createView(
      queryRunner,
      "credit_block_retirements_view_entity",
      RETIREMENTS_SQL
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await dropView(queryRunner, "credit_block_project_balances_view_entity");
    await dropView(
      queryRunner,
      "credit_block_project_holder_balances_view_entity"
    );
    await dropView(queryRunner, "credit_block_org_balances_view_entity");
    await dropView(queryRunner, "credit_block_explorer_view_entity");
    await dropView(queryRunner, "credit_block_retirements_view_entity");

    await createView(
      queryRunner,
      "credit_block_project_balances_view_entity",
      PROJECT_BALANCES_SQL_PREV
    );
    await createView(
      queryRunner,
      "credit_block_project_holder_balances_view_entity",
      PROJECT_HOLDER_BALANCES_SQL_PREV
    );
    await createView(
      queryRunner,
      "credit_block_org_balances_view_entity",
      ORG_BALANCES_SQL_PREV
    );
    await createView(
      queryRunner,
      "credit_block_explorer_view_entity",
      EXPLORER_SQL_PREV
    );
    await createView(
      queryRunner,
      "credit_block_retirements_view_entity",
      RETIREMENTS_SQL_PREV
    );
  }
}

async function dropView(
  queryRunner: QueryRunner,
  view: string
): Promise<void> {
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

// Matches credit.block.project.balances.view.entity.ts.
const PROJECT_BALANCES_SQL = `
    SELECT
      cb."projectRefId" AS "projectId",
      p."title" AS "projectName",
      p."companyId" AS "projectOwnerId",
      pc."name" AS "projectOwnerName",
      pc."logo" AS "projectOwnerLogo",
      SUM(cb."creditAmount" - cb."reservedCreditAmount") AS "creditBalance",
      SUM(cb."reservedCreditAmount") AS "reservedCredits",
      COALESCE(SUM(cb."creditAmount" - cb."reservedCreditAmount")
        FILTER (WHERE cb."itmoAuthorizationRecord" IS NOT NULL), 0) AS "itmoBalance",
      COALESCE(SUM(cb."reservedCreditAmount")
        FILTER (WHERE cb."itmoAuthorizationRecord" IS NOT NULL), 0) AS "itmoReservedCredits",
      MAX(cb."txTime") AS "updatedTime"
    FROM credit_blocks_entity cb
    LEFT JOIN project_entity p ON cb."projectRefId" = p."refId"
    LEFT JOIN company pc ON p."companyId" = pc."companyId"
    WHERE cb."ownerCompanyId" != 0
    GROUP BY cb."projectRefId", p."title", p."companyId", pc."name", pc."logo"
`;

const PROJECT_BALANCES_SQL_PREV = `
    SELECT
      cb."projectRefId" AS "projectId",
      p."title" AS "projectName",
      p."companyId" AS "projectOwnerId",
      pc."name" AS "projectOwnerName",
      pc."logo" AS "projectOwnerLogo",
      SUM(cb."creditAmount" - cb."reservedCreditAmount") AS "creditBalance",
      SUM(cb."reservedCreditAmount") AS "reservedCredits",
      MAX(cb."txTime") AS "updatedTime"
    FROM credit_blocks_entity cb
    LEFT JOIN project_entity p ON cb."projectRefId" = p."refId"
    LEFT JOIN company pc ON p."companyId" = pc."companyId"
    WHERE cb."ownerCompanyId" != 0
    GROUP BY cb."projectRefId", p."title", p."companyId", pc."name", pc."logo"
`;

// Matches credit.block.project.holder.balances.view.entity.ts.
const PROJECT_HOLDER_BALANCES_SQL = `
    SELECT
      cb."projectRefId" || '-' || cb."ownerCompanyId" AS "id",
      cb."projectRefId" AS "projectId",
      p."title" AS "projectName",
      p."companyId" AS "projectOwnerId",
      pc."name" AS "projectOwnerName",
      pc."logo" AS "projectOwnerLogo",
      cb."ownerCompanyId" AS "holderId",
      SUM(cb."creditAmount" - cb."reservedCreditAmount") AS "creditBalance",
      SUM(cb."reservedCreditAmount") AS "reservedCredits",
      COALESCE(SUM(cb."creditAmount" - cb."reservedCreditAmount")
        FILTER (WHERE cb."itmoAuthorizationRecord" IS NOT NULL), 0) AS "itmoBalance",
      COALESCE(SUM(cb."reservedCreditAmount")
        FILTER (WHERE cb."itmoAuthorizationRecord" IS NOT NULL), 0) AS "itmoReservedCredits",
      MAX(cb."txTime") AS "updatedTime"
    FROM credit_blocks_entity cb
    LEFT JOIN project_entity p ON cb."projectRefId" = p."refId"
    LEFT JOIN company pc ON p."companyId" = pc."companyId"
    WHERE cb."ownerCompanyId" != 0
    GROUP BY cb."projectRefId", p."title", p."companyId", pc."name", pc."logo", cb."ownerCompanyId"
`;

const PROJECT_HOLDER_BALANCES_SQL_PREV = `
    SELECT
      cb."projectRefId" || '-' || cb."ownerCompanyId" AS "id",
      cb."projectRefId" AS "projectId",
      p."title" AS "projectName",
      p."companyId" AS "projectOwnerId",
      pc."name" AS "projectOwnerName",
      pc."logo" AS "projectOwnerLogo",
      cb."ownerCompanyId" AS "holderId",
      SUM(cb."creditAmount" - cb."reservedCreditAmount") AS "creditBalance",
      SUM(cb."reservedCreditAmount") AS "reservedCredits",
      MAX(cb."txTime") AS "updatedTime"
    FROM credit_blocks_entity cb
    LEFT JOIN project_entity p ON cb."projectRefId" = p."refId"
    LEFT JOIN company pc ON p."companyId" = pc."companyId"
    WHERE cb."ownerCompanyId" != 0
    GROUP BY cb."projectRefId", p."title", p."companyId", pc."name", pc."logo", cb."ownerCompanyId"
`;

// Matches credit.block.org.balances.view.entity.ts.
const ORG_BALANCES_SQL = `
    SELECT
      cb."ownerCompanyId" AS "organizationId",
      o."name" AS "organizationName",
      o."logo" AS "organizationLogo",
      SUM(cb."creditAmount" - cb."reservedCreditAmount") AS "creditBalance",
      SUM(cb."reservedCreditAmount") AS "reservedCredits",
      COALESCE(SUM(cb."creditAmount" - cb."reservedCreditAmount")
        FILTER (WHERE cb."itmoAuthorizationRecord" IS NOT NULL), 0) AS "itmoBalance",
      COALESCE(SUM(cb."reservedCreditAmount")
        FILTER (WHERE cb."itmoAuthorizationRecord" IS NOT NULL), 0) AS "itmoReservedCredits",
      MAX(cb."txTime") AS "updatedTime"
    FROM credit_blocks_entity cb
    LEFT JOIN company o ON cb."ownerCompanyId" = o."companyId"
    WHERE cb."ownerCompanyId" != 0
    GROUP BY cb."ownerCompanyId", o."name", o."logo"
`;

const ORG_BALANCES_SQL_PREV = `
    SELECT
      cb."ownerCompanyId" AS "organizationId",
      o."name" AS "organizationName",
      o."logo" AS "organizationLogo",
      SUM(cb."creditAmount" - cb."reservedCreditAmount") AS "creditBalance",
      SUM(cb."reservedCreditAmount") AS "reservedCredits",
      MAX(cb."txTime") AS "updatedTime"
    FROM credit_blocks_entity cb
    LEFT JOIN company o ON cb."ownerCompanyId" = o."companyId"
    WHERE cb."ownerCompanyId" != 0
    GROUP BY cb."ownerCompanyId", o."name", o."logo"
`;

// Matches credit.block.explorer.view.entity.ts.
const EXPLORER_SQL = `
    SELECT
      cb."creditBlockId" AS "id",
      cb."serialNumber" AS "serialNumber",
      cb."itmoSerial" AS "itmoSerial",
      cb."itmoAuthorizationRecord" AS "itmoAuthorizationRecord",
      cb."ownerCompanyId" AS "organizationId",
      o."name" AS "organizationName",
      o."logo" AS "organizationLogo",
      cb."projectRefId" AS "projectId",
      p."title" AS "projectName",
      (cb."creditAmount" - cb."reservedCreditAmount") AS "balance",
      cb."reservedCreditAmount" AS "reserved",
      CASE
        WHEN cb."ownerCompanyId" = 0 THEN 'Retired'
        ELSE 'Assigned'
      END AS "status",
      cb."txTime" AS "updatedTime"
    FROM credit_blocks_entity cb
    LEFT JOIN project_entity p ON cb."projectRefId" = p."refId"
    LEFT JOIN company o ON cb."ownerCompanyId" = o."companyId"
`;

const EXPLORER_SQL_PREV = `
    SELECT
      cb."creditBlockId" AS "id",
      cb."serialNumber" AS "serialNumber",
      cb."ownerCompanyId" AS "organizationId",
      o."name" AS "organizationName",
      o."logo" AS "organizationLogo",
      cb."projectRefId" AS "projectId",
      p."title" AS "projectName",
      (cb."creditAmount" - cb."reservedCreditAmount") AS "balance",
      cb."reservedCreditAmount" AS "reserved",
      CASE
        WHEN cb."ownerCompanyId" = 0 THEN 'Retired'
        ELSE 'Assigned'
      END AS "status",
      cb."txTime" AS "updatedTime"
    FROM credit_blocks_entity cb
    LEFT JOIN project_entity p ON cb."projectRefId" = p."refId"
    LEFT JOIN company o ON cb."ownerCompanyId" = o."companyId"
`;

// Matches credit.block.retirements.view.entity.ts.
const RETIREMENTS_SQL = `
      SELECT
        ct."id" AS "id",
        ct."serialNumber" AS "serialNumber",
        ct."amount" AS "creditAmount",
        ct."createTime" AS "createdDate",
        ct."subType" AS "subType",
        ct."status" AS "status",
        ct."projectRefId" AS "projectId",
        country."name" AS "country",
        ct."data"->>'entityName' AS "entityName",
        ct."data"->>'remarks' AS "remarks",
        p."title" AS "projectName",
        p."companyId" AS "projectOwnerId",
        ct."senderId" AS "senderId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo",
        rb."itmoSerial" AS "itmoSerial",
        rb."itmoAuthorizationRecord" AS "itmoAuthorizationRecord"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN country ON ct."data"->>'country' = country."alpha2"
      LEFT JOIN credit_blocks_entity rb ON ct."creditBlockId" = rb."creditBlockId"
      WHERE ct."type" = 'Retired'
`;

const RETIREMENTS_SQL_PREV = `
      SELECT
        ct."id" AS "id",
        ct."serialNumber" AS "serialNumber",
        ct."amount" AS "creditAmount",
        ct."createTime" AS "createdDate",
        ct."subType" AS "subType",
        ct."status" AS "status",
        ct."projectRefId" AS "projectId",
        country."name" AS "country",
        ct."data"->>'entityName' AS "entityName",
        ct."data"->>'remarks' AS "remarks",
        p."title" AS "projectName",
        p."companyId" AS "projectOwnerId",
        ct."senderId" AS "senderId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN country ON ct."data"->>'country' = country."alpha2"
      WHERE ct."type" = 'Retired'
`;
