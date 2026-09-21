import { MigrationInterface, QueryRunner } from "typeorm";

// Extends the CAD Trust v2 sync schema (see 1785500000000-CadTrustV2Sync.ts,
// 1785600000000-CadTrustV2Bootstrap.ts and 1785700000000-CadTrustV2ProjectRelations.ts) for
// CADTV2ValidationCreate (libs/shared/src/cadtrust-sync/handlers/validation-create.handler.ts),
// which stages a CAD Trust validation record when a PDD or a validation report is DNA-approved.
//
// Two independent ALTER TYPE ADD VALUE changes, both transaction-safe on Postgres 12+ because the
// new labels are not used in the same transaction:
//
// 1. async_action_entity_actiontype_enum gains '21' for CADTV2ValidationCreate. The previous
//    migration filled '0'..'20' exactly - there is no spare label.
// 2. cadtrust_sync_record's two entity-type enums gain 'VALIDATION' - the sync record table itself
//    already exists and needs no structural change, only one more allowed value in its two type
//    columns.
const ACTION_TYPE_ENUM = `"public"."async_action_entity_actiontype_enum"`;
const LOCAL_ENTITY_TYPE_ENUM = `"public"."cadtrust_sync_record_localentitytype_enum"`;
const CADTRUST_ENTITY_TYPE_ENUM = `"public"."cadtrust_sync_record_cadtrustentitytype_enum"`;

// Ordinal of CADTV2ValidationCreate. Keep in step with
// libs/shared/src/enum/async.action.type.enum.ts.
const NEW_ACTION_TYPE_LABEL = "21";

// Keep in step with libs/shared/src/enum/cadtrust.local.entity.type.enum.ts and
// cadtrust.resource.type.enum.ts — both enums use the same new label.
const NEW_ENTITY_TYPE_LABEL = "VALIDATION";

export class CadTrustV2Validation1785800000000 implements MigrationInterface {
  name = "CadTrustV2Validation1785800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE ${ACTION_TYPE_ENUM} ADD VALUE IF NOT EXISTS '${NEW_ACTION_TYPE_LABEL}'`
    );

    await queryRunner.query(
      `ALTER TYPE ${LOCAL_ENTITY_TYPE_ENUM} ADD VALUE IF NOT EXISTS '${NEW_ENTITY_TYPE_LABEL}'`
    );
    await queryRunner.query(
      `ALTER TYPE ${CADTRUST_ENTITY_TYPE_ENUM} ADD VALUE IF NOT EXISTS '${NEW_ENTITY_TYPE_LABEL}'`
    );
  }

  public async down(): Promise<void> {
    // Deliberately a no-op, matching every prior CAD Trust migration: Postgres has no DROP VALUE,
    // and recreating either enum type would require rewriting every row that references it. Leaving
    // the unused labels in place is harmless.
  }
}
