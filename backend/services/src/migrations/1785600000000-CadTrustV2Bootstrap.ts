import { MigrationInterface, QueryRunner } from "typeorm";

// Extends the CAD Trust v2 sync schema (see 1785500000000-CadTrustV2Sync.ts) for
// the bootstrap adaptor (libs/shared/src/cadtrust-sync/handlers/bootstrap.handler.ts),
// which verifies the CAD Trust home organization and stages the registry's one
// program and one methodology.
//
// Two independent ALTER TYPE ADD VALUE changes, both transaction-safe on
// Postgres 12+ because the new labels are not used in the same transaction:
//
// 1. async_action_entity_actiontype_enum gains '20' for CADTV2Bootstrap. The
//    previous migration filled '0'..'19' exactly - there is no spare label.
// 2. cadtrust_sync_record's two entity-type enums gain 'ORGANIZATION', 'PROGRAM'
//    and 'METHODOLOGY' - the sync record table itself already exists and needs
//    no structural change, only more allowed values in its two type columns.
const ACTION_TYPE_ENUM = `"public"."async_action_entity_actiontype_enum"`;
const LOCAL_ENTITY_TYPE_ENUM = `"public"."cadtrust_sync_record_localentitytype_enum"`;
const CADTRUST_ENTITY_TYPE_ENUM = `"public"."cadtrust_sync_record_cadtrustentitytype_enum"`;

// Ordinal of CADTV2Bootstrap. Keep in step with
// libs/shared/src/enum/async.action.type.enum.ts.
const NEW_ACTION_TYPE_LABEL = "20";

// Keep in step with libs/shared/src/enum/cadtrust.local.entity.type.enum.ts and
// cadtrust.resource.type.enum.ts — both enums use the same three new labels.
const NEW_ENTITY_TYPE_LABELS = ["ORGANIZATION", "PROGRAM", "METHODOLOGY"];

export class CadTrustV2Bootstrap1785600000000 implements MigrationInterface {
  name = "CadTrustV2Bootstrap1785600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE ${ACTION_TYPE_ENUM} ADD VALUE IF NOT EXISTS '${NEW_ACTION_TYPE_LABEL}'`
    );

    for (const label of NEW_ENTITY_TYPE_LABELS) {
      await queryRunner.query(`ALTER TYPE ${LOCAL_ENTITY_TYPE_ENUM} ADD VALUE IF NOT EXISTS '${label}'`);
      await queryRunner.query(
        `ALTER TYPE ${CADTRUST_ENTITY_TYPE_ENUM} ADD VALUE IF NOT EXISTS '${label}'`
      );
    }
  }

  public async down(): Promise<void> {
    // Deliberately a no-op, matching 1785500000000-CadTrustV2Sync.ts: Postgres
    // has no DROP VALUE, and recreating any of these three enum types would
    // require rewriting every row that references it. Leaving the unused labels
    // in place is harmless.
  }
}
