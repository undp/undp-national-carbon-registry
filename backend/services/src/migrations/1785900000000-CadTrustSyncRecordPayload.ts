import { MigrationInterface, QueryRunner } from "typeorm";

// Adds a debugging-only `payload` column to cadtrust_sync_record
// (libs/shared/src/entities/cadtrust.sync.record.entity.ts) — the exact CAD Trust
// request body a handler built for that sync, so a failed or wrong sync can be
// diagnosed from the row alone instead of reproduced from scratch.
//
// Unlike every prior CAD Trust migration, this touches no enum type — it's a plain
// column add, so it's also cleanly reversible.
export class CadTrustSyncRecordPayload1785900000000 implements MigrationInterface {
  name = "CadTrustSyncRecordPayload1785900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cadtrust_sync_record" ADD COLUMN IF NOT EXISTS "payload" jsonb`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cadtrust_sync_record" DROP COLUMN IF EXISTS "payload"`);
  }
}
