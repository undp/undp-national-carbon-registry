import { MigrationInterface, QueryRunner } from "typeorm";

// Step 4 of the Article 6.2 refactor (UNCR-468): real ITMO serial
// generation.
//
// No schema change — "itmoSerial" already exists on credit_blocks_entity
// (added in 1786600000000). This is a pure data-correctness migration:
//
//   - Previously every block got an itmoSerial at ISSUANCE, in a
//     bespoke colon-ranged 5-component format
//     ("{party}-{type}-{vintage}-{activityId}-{start}:{end}"), even
//     though only ITMO-authorized blocks should ever carry one.
//   - itmoSerial is now only assigned at ITMO authorization approval
//     (ProgrammeLedgerService.itmoAuthRequestAction), in the SAME
//     shape as the regular serial number
//     ("{caReferenceNumber}-{country}-{country}-{projectId}-{start}-{end}-{vintage}"),
//     using the block's ITMO-authorized cooperative approach's real
//     caReferenceNumber instead of the mock creditIdentifier, and the
//     registry's own country in both party slots instead of the mock
//     firstTransferringPartyId.
//
// This migration brings existing rows in line with that:
//   1. Regenerates itmoSerial (new format) for every block that is
//      already ITMO-authorized, by joining to its authorization
//      record's cooperative approach.
//   2. Nulls itmoSerial on every block that was never ITMO-authorized
//      (clears the old issuance-time mock value from MO blocks).
//
// ":country" below is inlined as the configured systemCountry default
// ("NG") since migrations don't read app config; this also assumes the
// default "-" serial separator, consistent with every other hardcoded
// assumption in this codebase's migrations.
//
// Written by hand rather than via `migration:generate` - the local dev
// DB runs with synchronize=true (NODE_ENV=dev). Same convention as
// 1786800000000-MoItmoRetirementRules.ts.
export class ItmoSerialGeneration1786900000000 implements MigrationInterface {
  name = "ItmoSerialGeneration1786900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const country = "NG";

    const [{ count: regenerated }] = await queryRunner.query(
      `SELECT COUNT(*)::int AS count
       FROM credit_blocks_entity cb
       JOIN credit_transactions_entity itmoauth ON cb."itmoAuthorizationRecord" = itmoauth."id"
       JOIN cooperative_approach ca ON ca."cooperativeApproachId" = itmoauth."data"->>'cooperativeApproachId'
       WHERE ca."caReferenceNumber" IS NOT NULL`
    );
    if (regenerated > 0) {
      // eslint-disable-next-line no-console
      console.log(
        `ItmoSerialGeneration1786900000000: regenerating itmoSerial for ${regenerated} already-ITMO-authorized block(s)`
      );
    }

    await queryRunner.query(
      `UPDATE credit_blocks_entity cb
       SET "itmoSerial" =
         ca."caReferenceNumber" || '-' || $1 || '-' || $1 || '-' ||
         split_part(cb."serialNumber", '-', 4) || '-' ||
         split_part(cb."serialNumber", '-', 5) || '-' ||
         split_part(cb."serialNumber", '-', 6) || '-' ||
         cb."vintage"
       FROM credit_transactions_entity itmoauth
       JOIN cooperative_approach ca ON ca."cooperativeApproachId" = itmoauth."data"->>'cooperativeApproachId'
       WHERE cb."itmoAuthorizationRecord" = itmoauth."id"
         AND ca."caReferenceNumber" IS NOT NULL`,
      [country]
    );

    await queryRunner.query(
      `UPDATE credit_blocks_entity SET "itmoSerial" = NULL WHERE "itmoAuthorizationRecord" IS NULL`
    );
  }

  public async down(): Promise<void> {
    // The old colon-based format this replaces no longer exists
    // anywhere in the codebase, so there is nothing meaningful to
    // revert itmoSerial values to.
  }
}
