import { MigrationInterface, QueryRunner } from "typeorm";

// Extends the CAD Trust v2 sync schema for credit-event sync (issuance, transfer, retirement,
// ITMO authorization/retirement) — see libs/shared/src/cadtrust-sync/README.md's "Event-by-event
// design" section, and the new handlers under libs/shared/src/cadtrust-sync/handlers/
// (verification-create, credit-issuance, unit-update).
//
// Three independent ALTER TYPE ADD VALUE changes, all transaction-safe on Postgres 12+ because
// none of the new labels are used in the same transaction:
//
// 1. async_action_entity_actiontype_enum gains '23', '24', '25' for CADTV2VerificationCreate,
//    CADTV2CreditIssuance and CADTV2UnitUpdate. The previous migration filled '0'..'22' exactly -
//    there is no spare label.
// 2. cadtrust_sync_record's two entity-type enums gain 'VERIFICATION', 'ISSUANCE', 'UNIT',
//    'LABEL', 'UNIT_LABEL' - the sync record table itself already exists and needs no structural
//    change, only more allowed values in its two type columns.
const ACTION_TYPE_ENUM = `"public"."async_action_entity_actiontype_enum"`;
const LOCAL_ENTITY_TYPE_ENUM = `"public"."cadtrust_sync_record_localentitytype_enum"`;
const CADTRUST_ENTITY_TYPE_ENUM = `"public"."cadtrust_sync_record_cadtrustentitytype_enum"`;

// Ordinals of CADTV2VerificationCreate / CADTV2CreditIssuance / CADTV2UnitUpdate. Keep in step
// with libs/shared/src/enum/async.action.type.enum.ts.
const NEW_ACTION_TYPE_LABELS = ["23", "24", "25"];

// Keep in step with libs/shared/src/enum/cadtrust.local.entity.type.enum.ts and
// cadtrust.resource.type.enum.ts — both enums use the same five new labels.
const NEW_ENTITY_TYPE_LABELS = ["VERIFICATION", "ISSUANCE", "UNIT", "LABEL", "UNIT_LABEL"];

export class CadTrustV2Credits1787700000000 implements MigrationInterface {
  name = "CadTrustV2Credits1787700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const label of NEW_ACTION_TYPE_LABELS) {
      await queryRunner.query(`ALTER TYPE ${ACTION_TYPE_ENUM} ADD VALUE IF NOT EXISTS '${label}'`);
    }

    for (const label of NEW_ENTITY_TYPE_LABELS) {
      await queryRunner.query(`ALTER TYPE ${LOCAL_ENTITY_TYPE_ENUM} ADD VALUE IF NOT EXISTS '${label}'`);
      await queryRunner.query(
        `ALTER TYPE ${CADTRUST_ENTITY_TYPE_ENUM} ADD VALUE IF NOT EXISTS '${label}'`
      );
    }
  }

  public async down(): Promise<void> {
    // Deliberately a no-op, matching every prior CAD Trust migration: Postgres has no DROP VALUE,
    // and recreating any of these enum types would require rewriting every row that references it.
    // Leaving the unused labels in place is harmless.
  }
}
