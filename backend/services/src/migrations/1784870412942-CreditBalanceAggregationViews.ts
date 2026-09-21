import { MigrationInterface, QueryRunner } from "typeorm";

// Credits -> Balance redesign: adds the By Organization and By Project
// aggregation views, and extends the existing per-block balances view
// with reservedCredits/updatedTime so the design's inner (expanded)
// per-block table has what it needs. Written by hand rather than via
// `migration:generate` - the local dev DB runs with synchronize=true
// (NODE_ENV=dev), so it had already auto-synced these exact views,
// leaving nothing for the generator to diff (and it surfaced unrelated
// pre-existing drift instead). The CREATE VIEW SQL below is copied
// verbatim from the corresponding view-entity `expression`, matching the
// convention set by 1784711176589-AddCreditBlockIssuancesView.ts.
export class CreditBalanceAggregationViews1784870412942
  implements MigrationInterface
{
  name = "CreditBalanceAggregationViews1784870412942";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- Replace credit_block_balances_view_entity with the extended
    // version (adds reservedCredits, updatedTime) ---
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ["VIEW", "credit_block_balances_view_entity", "public"]
    );
    await queryRunner.query(`DROP VIEW "credit_block_balances_view_entity"`);

    await queryRunner.query(`CREATE VIEW "credit_block_balances_view_entity" AS
    SELECT
      cb."creditBlockId" AS "id",
      cb."serialNumber" AS "serialNumber",
      cb."itmoSerial" AS "itmoSerial",
      (cb."creditAmount" - cb."reservedCreditAmount") AS "creditAmount",
      cb."reservedCreditAmount" AS "reservedCredits",
      cb."createTime" AS "createdDate",
      cb."txTime" AS "updatedTime",
      cb."projectRefId" AS "projectId",
      p."title" AS "projectName",
      cb."ownerCompanyId" AS "receiverId",
      r."name" AS "receiverName",
      r."logo" AS "receiverLogo",
      cb."previousOwnerCompanyId" AS "senderId",
      s."name" AS "senderName",
      s."logo" AS "senderLogo",
      CASE
        WHEN cb."isNotTransferred" = TRUE THEN 'issued'
        ELSE 'received'
      END AS "type",
      cb."cooperativeApproachId" AS "cooperativeApproachId",
      cb."authorizationPurpose"::text AS "authorizationPurpose",
      cb."accountType"::text AS "accountType",
      COALESCE(cb."omgeDeductedAtIssuance", FALSE) AS "omgeDeductedAtIssuance",
      COALESCE(cb."sopDeductedAtIssuance", FALSE) AS "sopDeductedAtIssuance"
    FROM credit_blocks_entity cb
    LEFT JOIN project_entity p ON cb."projectRefId" = p."refId"
    LEFT JOIN company r ON cb."ownerCompanyId" = r."companyId"
    LEFT JOIN company s ON cb."previousOwnerCompanyId" = s."companyId"
    WHERE cb."ownerCompanyId" != 0`);
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        "public",
        "VIEW",
        "credit_block_balances_view_entity",
        `SELECT
      cb."creditBlockId" AS "id",
      cb."serialNumber" AS "serialNumber",
      cb."itmoSerial" AS "itmoSerial",
      (cb."creditAmount" - cb."reservedCreditAmount") AS "creditAmount",
      cb."reservedCreditAmount" AS "reservedCredits",
      cb."createTime" AS "createdDate",
      cb."txTime" AS "updatedTime",
      cb."projectRefId" AS "projectId",
      p."title" AS "projectName",
      cb."ownerCompanyId" AS "receiverId",
      r."name" AS "receiverName",
      r."logo" AS "receiverLogo",
      cb."previousOwnerCompanyId" AS "senderId",
      s."name" AS "senderName",
      s."logo" AS "senderLogo",
      CASE
        WHEN cb."isNotTransferred" = TRUE THEN 'issued'
        ELSE 'received'
      END AS "type",
      cb."cooperativeApproachId" AS "cooperativeApproachId",
      cb."authorizationPurpose"::text AS "authorizationPurpose",
      cb."accountType"::text AS "accountType",
      COALESCE(cb."omgeDeductedAtIssuance", FALSE) AS "omgeDeductedAtIssuance",
      COALESCE(cb."sopDeductedAtIssuance", FALSE) AS "sopDeductedAtIssuance"
    FROM credit_blocks_entity cb
    LEFT JOIN project_entity p ON cb."projectRefId" = p."refId"
    LEFT JOIN company r ON cb."ownerCompanyId" = r."companyId"
    LEFT JOIN company s ON cb."previousOwnerCompanyId" = s."companyId"
    WHERE cb."ownerCompanyId" != 0`,
      ]
    );

    // --- credit_block_org_balances_view_entity (Balance -> By Organization) ---
    await queryRunner.query(`CREATE VIEW "credit_block_org_balances_view_entity" AS
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
    GROUP BY cb."ownerCompanyId", o."name", o."logo"`);
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        "public",
        "VIEW",
        "credit_block_org_balances_view_entity",
        `SELECT
      cb."ownerCompanyId" AS "organizationId",
      o."name" AS "organizationName",
      o."logo" AS "organizationLogo",
      SUM(cb."creditAmount" - cb."reservedCreditAmount") AS "creditBalance",
      SUM(cb."reservedCreditAmount") AS "reservedCredits",
      MAX(cb."txTime") AS "updatedTime"
    FROM credit_blocks_entity cb
    LEFT JOIN company o ON cb."ownerCompanyId" = o."companyId"
    WHERE cb."ownerCompanyId" != 0
    GROUP BY cb."ownerCompanyId", o."name", o."logo"`,
      ]
    );

    // --- credit_block_project_balances_view_entity (Balance -> By Project, DNA) ---
    await queryRunner.query(`CREATE VIEW "credit_block_project_balances_view_entity" AS
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
    GROUP BY cb."projectRefId", p."title", p."companyId", pc."name", pc."logo"`);
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        "public",
        "VIEW",
        "credit_block_project_balances_view_entity",
        `SELECT
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
    GROUP BY cb."projectRefId", p."title", p."companyId", pc."name", pc."logo"`,
      ]
    );

    // --- credit_block_project_holder_balances_view_entity (Balance -> By Project, Project Developer) ---
    await queryRunner.query(`CREATE VIEW "credit_block_project_holder_balances_view_entity" AS
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
    GROUP BY cb."projectRefId", p."title", p."companyId", pc."name", pc."logo", cb."ownerCompanyId"`);
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        "public",
        "VIEW",
        "credit_block_project_holder_balances_view_entity",
        `SELECT
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
    GROUP BY cb."projectRefId", p."title", p."companyId", pc."name", pc."logo", cb."ownerCompanyId"`,
      ]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // --- drop the 3 new views, newest first ---
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ["VIEW", "credit_block_project_holder_balances_view_entity", "public"]
    );
    await queryRunner.query(
      `DROP VIEW "credit_block_project_holder_balances_view_entity"`
    );

    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ["VIEW", "credit_block_project_balances_view_entity", "public"]
    );
    await queryRunner.query(
      `DROP VIEW "credit_block_project_balances_view_entity"`
    );

    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ["VIEW", "credit_block_org_balances_view_entity", "public"]
    );
    await queryRunner.query(`DROP VIEW "credit_block_org_balances_view_entity"`);

    // --- restore the original (pre-extension) credit_block_balances_view_entity ---
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
      ["VIEW", "credit_block_balances_view_entity", "public"]
    );
    await queryRunner.query(`DROP VIEW "credit_block_balances_view_entity"`);

    await queryRunner.query(`CREATE VIEW "credit_block_balances_view_entity" AS
    SELECT
      cb."creditBlockId" AS "id",
      cb."serialNumber" AS "serialNumber",
      cb."itmoSerial" AS "itmoSerial",
      (cb."creditAmount" - cb."reservedCreditAmount") AS "creditAmount",
      cb."createTime" AS "createdDate",
      cb."projectRefId" AS "projectId",
      p."title" AS "projectName",
      cb."ownerCompanyId" AS "receiverId",
      r."name" AS "receiverName",
      r."logo" AS "receiverLogo",
      cb."previousOwnerCompanyId" AS "senderId",
      s."name" AS "senderName",
      s."logo" AS "senderLogo",
      CASE
        WHEN cb."isNotTransferred" = TRUE THEN 'issued'
        ELSE 'received'
      END AS "type",
      cb."cooperativeApproachId" AS "cooperativeApproachId",
      cb."authorizationPurpose"::text AS "authorizationPurpose",
      cb."accountType"::text AS "accountType",
      COALESCE(cb."omgeDeductedAtIssuance", FALSE) AS "omgeDeductedAtIssuance",
      COALESCE(cb."sopDeductedAtIssuance", FALSE) AS "sopDeductedAtIssuance"
    FROM credit_blocks_entity cb
    LEFT JOIN project_entity p ON cb."projectRefId" = p."refId"
    LEFT JOIN company r ON cb."ownerCompanyId" = r."companyId"
    LEFT JOIN company s ON cb."previousOwnerCompanyId" = s."companyId"
    WHERE cb."ownerCompanyId" != 0`);
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
      [
        "public",
        "VIEW",
        "credit_block_balances_view_entity",
        `SELECT
      cb."creditBlockId" AS "id",
      cb."serialNumber" AS "serialNumber",
      cb."itmoSerial" AS "itmoSerial",
      (cb."creditAmount" - cb."reservedCreditAmount") AS "creditAmount",
      cb."createTime" AS "createdDate",
      cb."projectRefId" AS "projectId",
      p."title" AS "projectName",
      cb."ownerCompanyId" AS "receiverId",
      r."name" AS "receiverName",
      r."logo" AS "receiverLogo",
      cb."previousOwnerCompanyId" AS "senderId",
      s."name" AS "senderName",
      s."logo" AS "senderLogo",
      CASE
        WHEN cb."isNotTransferred" = TRUE THEN 'issued'
        ELSE 'received'
      END AS "type",
      cb."cooperativeApproachId" AS "cooperativeApproachId",
      cb."authorizationPurpose"::text AS "authorizationPurpose",
      cb."accountType"::text AS "accountType",
      COALESCE(cb."omgeDeductedAtIssuance", FALSE) AS "omgeDeductedAtIssuance",
      COALESCE(cb."sopDeductedAtIssuance", FALSE) AS "sopDeductedAtIssuance"
    FROM credit_blocks_entity cb
    LEFT JOIN project_entity p ON cb."projectRefId" = p."refId"
    LEFT JOIN company r ON cb."ownerCompanyId" = r."companyId"
    LEFT JOIN company s ON cb."previousOwnerCompanyId" = s."companyId"
    WHERE cb."ownerCompanyId" != 0`,
      ]
    );
  }
}
