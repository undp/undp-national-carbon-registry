import { MigrationInterface, QueryRunner } from "typeorm";

// Adds `creditBlockId` (credit_transactions_entity.creditBlockId) to the
// retirements view behind the Credits > Retirements table. The frontend's CAD
// Trust sync badge on a completed retirement row needs the block id to look up
// that block's CAD Trust UNIT sync record - the row already shows the block's
// serial number, but the serial is not a stable key into cadtrust_sync_record
// (whose UNIT localId is creditBlockId).
//
// Written by hand rather than via `migration:generate` - the local dev DB runs
// with synchronize=true and has already auto-synced the view, leaving nothing
// for the generator to diff. Same convention as
// 1787300000000-ItmoVisibilityViews.ts. RETIREMENTS_SQL_PREV below is copied
// verbatim from that migration's RETIREMENTS_SQL (the current view shape).
export class AddCreditBlockIdToRetirementsView1788000000000
  implements MigrationInterface
{
  name = "AddCreditBlockIdToRetirementsView1788000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await replaceView(
      queryRunner,
      "credit_block_retirements_view_entity",
      RETIREMENTS_SQL_WITH_BLOCK_ID
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await replaceView(
      queryRunner,
      "credit_block_retirements_view_entity",
      RETIREMENTS_SQL_PREV
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
  await queryRunner.query(`DROP VIEW IF EXISTS "${view}"`);
  await queryRunner.query(`CREATE VIEW "${view}" AS ${sql}`);
  await queryRunner.query(
    `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
    ["public", "VIEW", view, sql]
  );
}

// Matches credit.block.retirements.view.entity.ts after this change.
const RETIREMENTS_SQL_WITH_BLOCK_ID = `
      SELECT
        ct."id" AS "id",
        ct."creditBlockId" AS "creditBlockId",
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

// Verbatim from 1787300000000-ItmoVisibilityViews.ts RETIREMENTS_SQL.
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
