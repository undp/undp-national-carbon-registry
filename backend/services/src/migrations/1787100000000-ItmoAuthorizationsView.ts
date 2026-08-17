import { MigrationInterface, QueryRunner } from "typeorm";

// Continuation of the Article 6.2 refactor (UNCR-468): the ITMO
// authorization request/approve/reject/cancel flow (Step 1,
// 1786600000000-CreditTxSubTypeAndItmoAuth.ts) was built without any
// way to list pending requests. This adds the missing read side —
// credit_block_itmo_authorizations_view_entity — mirroring
// credit_block_retirements_view_entity's shape but filtered to
// ct."type" = 'ItmoAuthorized', pulling cooperativeApproachId /
// authorizationPurpose / remarks out of the jsonb "data" column
// (matches ItmoAuthorizationData).
//
// Written by hand rather than via `migration:generate` - the local dev
// DB runs with synchronize=true (NODE_ENV=dev) and has already
// auto-synced this schema. Same convention as prior Step migrations.
export class ItmoAuthorizationsView1787100000000
  implements MigrationInterface
{
  name = "ItmoAuthorizationsView1787100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await createView(
      queryRunner,
      "credit_block_itmo_authorizations_view_entity",
      ITMO_AUTHORIZATIONS_SQL
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await dropView(
      queryRunner,
      "credit_block_itmo_authorizations_view_entity"
    );
  }
}

async function dropView(queryRunner: QueryRunner, view: string): Promise<void> {
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

// Matches credit.block.itmo.authorizations.view.entity.ts.
const ITMO_AUTHORIZATIONS_SQL = `
      SELECT
        ct."id" AS "id",
        ct."serialNumber" AS "serialNumber",
        ct."amount" AS "creditAmount",
        ct."createTime" AS "createdDate",
        ct."status" AS "status",
        ct."projectRefId" AS "projectId",
        ct."data"->>'cooperativeApproachId' AS "cooperativeApproachId",
        ct."data"->>'authorizationPurpose' AS "authorizationPurpose",
        ct."data"->>'remarks' AS "remarks",
        p."title" AS "projectName",
        p."companyId" AS "projectOwnerId",
        ct."senderId" AS "senderId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      WHERE ct."type" = 'ItmoAuthorized'
    `;
