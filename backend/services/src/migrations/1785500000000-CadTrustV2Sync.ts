import { MigrationInterface, QueryRunner } from "typeorm";

// Schema for the CAD Trust v2 sync adaptor (libs/shared/src/cadtrust-sync).
//
// Two independent changes:
//
// 1. Extend the async-action enum. `AsyncActionType` is a numeric TypeScript enum
//    persisted as a Postgres enum whose labels are the ordinals as strings. The
//    baseline (1780893992718) created '0'..'16', which the 17 members that existed
//    at the time fill exactly - there is no spare label. Without the ALTER below,
//    the very first CAD Trust action enqueued fails with
//    `invalid input value for enum async_action_entity_actiontype_enum: "17"`.
//
//    ALTER TYPE ... ADD VALUE is transaction-safe on Postgres 12+ as long as the
//    new label is not *used* in the same transaction. It isn't - nothing here
//    inserts an async action. IF NOT EXISTS keeps this re-runnable.
//
// 2. Create cadtrust_sync_record: the local-record <-> CAD Trust-UUID map plus
//    per-record sync state (see the entity for why state lives here rather than
//    on the shared AsyncActionEntity).
const ACTION_TYPE_ENUM = `"public"."async_action_entity_actiontype_enum"`;

// Ordinals of CADTV2ProjectCreate / CADTV2ProjectUpdate / CADTV2Commit.
// Keep in step with libs/shared/src/enum/async.action.type.enum.ts.
const NEW_ACTION_TYPE_LABELS = ["17", "18", "19"];

export class CadTrustV2Sync1785500000000 implements MigrationInterface {
  name = "CadTrustV2Sync1785500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const label of NEW_ACTION_TYPE_LABELS) {
      await queryRunner.query(`ALTER TYPE ${ACTION_TYPE_ENUM} ADD VALUE IF NOT EXISTS '${label}'`);
    }

    await queryRunner.query(
      `CREATE TYPE "public"."cadtrust_sync_record_localentitytype_enum" AS ENUM('PROJECT')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."cadtrust_sync_record_cadtrustentitytype_enum" AS ENUM('PROJECT')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."cadtrust_sync_record_syncstatus_enum" AS ENUM('PENDING', 'STAGED', 'COMMITTED', 'FAILED')`
    );

    await queryRunner.query(`
      CREATE TABLE "cadtrust_sync_record" (
        "id" SERIAL NOT NULL,
        "localEntityType" "public"."cadtrust_sync_record_localentitytype_enum" NOT NULL,
        "localId" character varying NOT NULL,
        "cadTrustEntityType" "public"."cadtrust_sync_record_cadtrustentitytype_enum" NOT NULL,
        "cadTrustId" character varying,
        "stagingUuid" character varying,
        "syncStatus" "public"."cadtrust_sync_record_syncstatus_enum" NOT NULL DEFAULT 'PENDING',
        "attemptCount" integer NOT NULL DEFAULT 0,
        "lastError" text,
        "lastAttemptTime" bigint,
        "createTime" bigint NOT NULL,
        "updateTime" bigint NOT NULL,
        CONSTRAINT "PK_cadtrust_sync_record" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_cadtrust_sync_record_local"
          UNIQUE ("localEntityType", "localId", "cadTrustEntityType")
      )
    `);

    // The commit handler sweeps every STAGED row; the handlers look rows up by
    // the unique triple (already indexed by the constraint above).
    await queryRunner.query(
      `CREATE INDEX "IDX_cadtrust_sync_record_status" ON "cadtrust_sync_record" ("syncStatus")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_cadtrust_sync_record_status"`);
    await queryRunner.query(`DROP TABLE "cadtrust_sync_record"`);
    await queryRunner.query(`DROP TYPE "public"."cadtrust_sync_record_syncstatus_enum"`);
    await queryRunner.query(`DROP TYPE "public"."cadtrust_sync_record_cadtrustentitytype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."cadtrust_sync_record_localentitytype_enum"`);

    // The async-action enum labels are deliberately NOT removed. Postgres has no
    // DROP VALUE, and recreating the type would require rewriting every
    // async_action_entity row. Leaving '17'..'19' in place is harmless: they are
    // simply unused labels if this migration is reverted.
  }
}
