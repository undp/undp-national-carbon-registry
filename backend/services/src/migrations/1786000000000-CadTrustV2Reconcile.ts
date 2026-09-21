import { MigrationInterface, QueryRunner } from "typeorm";

// Extends the CAD Trust v2 sync schema (see 1785500000000-CadTrustV2Sync.ts,
// 1785600000000-CadTrustV2Bootstrap.ts, 1785700000000-CadTrustV2ProjectRelations.ts and
// 1785800000000-CadTrustV2Validation.ts) for CADTV2Reconcile
// (libs/shared/src/cadtrust-sync/handlers/reconcile.handler.ts), which re-drives any FAILED
// cadtrust_sync_record and retries a stuck staged-but-uncommitted batch.
//
// Single ALTER TYPE ADD VALUE, transaction-safe on Postgres 12+ because the new label is not
// used in the same transaction: async_action_entity_actiontype_enum gains '22' for
// CADTV2Reconcile. The previous migration filled '0'..'21' exactly - there is no spare label.
// No new local/CAD Trust entity type is introduced, so cadtrust_sync_record's own enums are
// untouched.
const ACTION_TYPE_ENUM = `"public"."async_action_entity_actiontype_enum"`;

// Ordinal of CADTV2Reconcile. Keep in step with
// libs/shared/src/enum/async.action.type.enum.ts.
const NEW_ACTION_TYPE_LABEL = "22";

export class CadTrustV2Reconcile1786000000000 implements MigrationInterface {
  name = "CadTrustV2Reconcile1786000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE ${ACTION_TYPE_ENUM} ADD VALUE IF NOT EXISTS '${NEW_ACTION_TYPE_LABEL}'`
    );
  }

  public async down(): Promise<void> {
    // Deliberately a no-op, matching every prior CAD Trust migration: Postgres has no DROP VALUE,
    // and recreating the enum type would require rewriting every row that references it. Leaving
    // the unused label in place is harmless.
  }
}
