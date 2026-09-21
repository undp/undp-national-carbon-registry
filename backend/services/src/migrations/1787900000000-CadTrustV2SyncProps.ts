import { MigrationInterface, QueryRunner } from "typeorm";

// Adds cadtrust_sync_record."syncProps" — the inbound queue snapshot a sync was driven from, kept
// so CadTrustReconcileHandler can re-drive a FAILED VALIDATION / VERIFICATION / ISSUANCE record
// after the async_action_entity row that carried the snapshot has been consumed. See
// libs/shared/src/cadtrust-sync/reconcile-scope.ts and the "syncProps" column doc on
// libs/shared/src/entities/cadtrust.sync.record.entity.ts.
//
// Unlike the ALTER TYPE ADD VALUE migrations elsewhere in this module, a plain nullable column add
// is fully reversible, so down() drops it rather than being a deliberate no-op.
const TABLE = `"cadtrust_sync_record"`;

export class CadTrustV2SyncProps1787900000000 implements MigrationInterface {
  name = "CadTrustV2SyncProps1787900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS "syncProps" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE ${TABLE} DROP COLUMN IF EXISTS "syncProps"`);
  }
}
