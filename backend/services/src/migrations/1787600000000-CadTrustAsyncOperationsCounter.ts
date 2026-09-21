import { MigrationInterface, QueryRunner } from "typeorm";

// Adds two labels to counter_id_enum (the "counter" table's generic named-cursor id):
//
// 1. '20' for CounterType.CA_REFERENCE — this label was already used in code
//    (cooperative-approach.service.ts) but the baseline migration
//    (1780893992718-Baseline.ts) only created labels '0'..'19'. Closing that gap
//    here, since we're already touching this exact enum for reason 2 below — an
//    insert for CA_REFERENCE fails today with
//    `invalid input value for enum counter_id_enum: "20"` until this runs.
// 2. '21' for the new CounterType.CADTRUST_ASYNC_OPERATIONS — the CAD Trust-only
//    async-operations cursor. See
//    src/async-operations-handler/cadtrust-async-operations-handler.service.ts and
//    libs/shared/src/util/counter.type.enum.ts.
//
// Both are transaction-safe ALTER TYPE ADD VALUE calls on Postgres 12+ because
// neither new label is used in the same transaction it's added in — the same
// pattern every CAD Trust v2 migration before this one uses.
const COUNTER_ID_ENUM = `"public"."counter_id_enum"`;

export class CadTrustAsyncOperationsCounter1787600000000 implements MigrationInterface {
  name = "CadTrustAsyncOperationsCounter1787600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE ${COUNTER_ID_ENUM} ADD VALUE IF NOT EXISTS '20'`);
    await queryRunner.query(`ALTER TYPE ${COUNTER_ID_ENUM} ADD VALUE IF NOT EXISTS '21'`);
  }

  public async down(): Promise<void> {
    // Deliberately a no-op, matching every prior CAD Trust migration: Postgres has no DROP VALUE,
    // and recreating the enum type would require rewriting every row that references it. Leaving
    // the unused labels in place is harmless.
  }
}
