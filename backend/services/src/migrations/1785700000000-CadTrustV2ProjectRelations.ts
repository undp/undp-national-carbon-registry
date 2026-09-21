import { MigrationInterface, QueryRunner } from "typeorm";

// Extends the CAD Trust v2 sync schema (see 1785500000000-CadTrustV2Sync.ts and
// 1785600000000-CadTrustV2Bootstrap.ts) for project-creation sync now also
// staging a stakeholder, a project-methodology link, a stakeholder-project
// link and a location alongside the project itself
// (libs/shared/src/cadtrust-sync/handlers/project-create.handler.ts).
//
// One ALTER TYPE ADD VALUE per new label, transaction-safe on Postgres 12+
// because the new labels are not used in the same transaction. No
// async_action_entity change — none of this needs a new AsyncActionType; it
// all runs inline inside the existing CADTV2ProjectCreate handler.
const LOCAL_ENTITY_TYPE_ENUM = `"public"."cadtrust_sync_record_localentitytype_enum"`;
const CADTRUST_ENTITY_TYPE_ENUM = `"public"."cadtrust_sync_record_cadtrustentitytype_enum"`;

// Keep in step with libs/shared/src/enum/cadtrust.local.entity.type.enum.ts and
// cadtrust.resource.type.enum.ts — both enums use the same four new labels.
const NEW_ENTITY_TYPE_LABELS = ["STAKEHOLDER", "PROJECT_METHODOLOGY", "STAKEHOLDER_PROJECT", "LOCATION"];

export class CadTrustV2ProjectRelations1785700000000 implements MigrationInterface {
  name = "CadTrustV2ProjectRelations1785700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const label of NEW_ENTITY_TYPE_LABELS) {
      await queryRunner.query(`ALTER TYPE ${LOCAL_ENTITY_TYPE_ENUM} ADD VALUE IF NOT EXISTS '${label}'`);
      await queryRunner.query(
        `ALTER TYPE ${CADTRUST_ENTITY_TYPE_ENUM} ADD VALUE IF NOT EXISTS '${label}'`
      );
    }
  }

  public async down(): Promise<void> {
    // Deliberately a no-op, matching the two prior CAD Trust migrations:
    // Postgres has no DROP VALUE, and recreating either enum type would
    // require rewriting every row that references it. Leaving the unused
    // labels in place is harmless.
  }
}
