import { MigrationInterface, QueryRunner } from "typeorm";

// Step 1 of the Article 6.2 refactor (UNCR-468):
//
// credit_transactions_entity
//   - "type" enum reduced to Issued / Transfered / Retired /
//     ItmoAuthorized / Acquired. Historical rows written with the
//     removed values are remapped: FirstTransfer -> Transfered,
//     UseTowardsNDC / UseForOIMP / VoluntaryCancellation /
//     OMGECancellation -> Retired + the matching "subType".
//   - "retirementType" replaced by the new "subType" enum column:
//     'Voluntary Cancellations' | 'Use Towards NDC' |
//     'First Transfer Towards NDC' | 'First Transfer For OIMP' |
//     'OMGE Cancellation'. SOP Adaptation had no successor subtype and
//     maps to NULL. The two First-Transfer-* values are ITMO-only
//     (the credits cross the host country's border); plain "Use Towards
//     NDC" stays MO-only (domestic use) — see the classification below.
//   - the type-specific columns remarks / country / organizationName /
//     cooperativeApproachId / authorizationPurpose are folded into a
//     new "data" jsonb column (see credit.transaction.data.types.ts).
//
// credit_blocks_entity
//   - cooperativeApproachId / authorizationPurpose /
//     omgeDeductedAtIssuance / sopDeductedAtIssuance dropped.
//   - new "itmoAuthorizationRecord" column: id of the ITMO_AUTHORIZED
//     transaction record that authorized the block (null = MO block).
//
// Every view reading credit_transactions_entity (or the dropped block
// columns) is dropped up front and recreated afterwards from the
// current view-entity SQL, since ALTER COLUMN TYPE cannot run under a
// dependent view.
//
// SQUASHED (UNCR-468 migration cleanup): this single migration now does
// what used to be split across three — 1786600000000 (this one),
// 1786800000000-MoItmoRetirementRules.ts (both since deleted), and
// 1787200000000-FirstTransferRetirementSubTypes.ts. None of the three had
// ever been run against a real database, so the intermediate schema states
// they produced (a "Cross-Border Transactions" subType value that existed
// only to be immediately remapped away; an undifferentiated "Use Towards
// NDC"/"Use For OIMP" pair later split into MO/ITMO variants) were never
// observed by anything — the subType enum is created here directly with
// its final 5 values, and the historical backfill classifies straight to
// them in one pass. This is behaviourally identical to running the
// original three migrations back-to-back with no real usage in between
// (which is exactly what would have happened, since none had run): the
// original ITMO/MO split also checked credit_blocks_entity.itmoAuthorizationRecord
// alongside isFirstTransfer, but that column starts NULL for every row
// regardless of when it's added and nothing populates it for historical
// blocks in either version — so only "isFirstTransfer" (an existing,
// already-populated column) ever actually distinguished historical rows
// in practice. The check below omits the always-false half of that OR
// rather than reference a column this migration hasn't added yet at this
// point (see step 4's comment).
//
// credit_block_retirements_view_entity and credit_block_balances_view_entity
// are each created here exactly once, in their near-final shape (entityName,
// not the transitional organizationName; the final subType values; balances'
// itmoCooperativeApproachId/itmoAuthorizationPurpose join) — the versions
// MoItmoRetirementRules and FirstTransferRetirementSubTypes used to
// (re)create along the way are gone, since nothing ever observed them.
// credit_block_retirements_view_entity still gets one more legitimate
// drop+recreate later, in 1787300000000-ItmoVisibilityViews.ts, which adds
// the itmoSerial/itmoAuthorizationRecord join — that is genuinely new
// content introduced there, not duplicated here.
//
// Written by hand rather than via `migration:generate` - the local dev
// DB runs with synchronize=true (NODE_ENV=dev) and has already
// auto-synced this schema. Same convention as
// 1785500000000-AddProjectOwnerToCreditViews.ts.
export class CreditTxSubTypeAndItmoAuth1786600000000
  implements MigrationInterface
{
  name = "CreditTxSubTypeAndItmoAuth1786600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop dependent views.
    for (const view of VIEWS_TO_REBUILD) {
      await dropView(queryRunner, view);
    }

    // 2. credit_transactions_entity: new subType + data columns. subType
    //    is created directly with its final 5 values — see the module
    //    docblock on why no intermediate enum shape is needed.
    await queryRunner.query(
      `CREATE TYPE "public"."credit_transactions_entity_subtype_enum" AS ENUM('Voluntary Cancellations', 'Use Towards NDC', 'First Transfer Towards NDC', 'First Transfer For OIMP', 'OMGE Cancellation')`
    );
    await queryRunner.query(
      `ALTER TABLE "credit_transactions_entity" ADD "subType" "public"."credit_transactions_entity_subtype_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "credit_transactions_entity" ADD "data" jsonb`
    );

    // 3. Backfill data from the dropped per-type columns.
    await queryRunner.query(
      `UPDATE "credit_transactions_entity"
       SET "data" = jsonb_strip_nulls(jsonb_build_object(
         'country', "country",
         'organizationName', "organizationName",
         'remarks', "remarks",
         'cooperativeApproachId', "cooperativeApproachId",
         'authorizationPurpose', "authorizationPurpose"
       ))
       WHERE "country" IS NOT NULL
          OR "organizationName" IS NOT NULL
          OR "remarks" IS NOT NULL
          OR "cooperativeApproachId" IS NOT NULL
          OR "authorizationPurpose" IS NOT NULL`
    );
    await queryRunner.query(
      `UPDATE "credit_transactions_entity" SET "data" = NULL WHERE "data" = '{}'::jsonb`
    );

    // 4. Backfill subType for rows already typed 'Retired', from the old
    //    "retirementType" column — classified straight to final values.
    //    "Cross-Border Transactions" and "Use Towards NDC" both resolve
    //    through the same ITMO/MO check the historical
    //    FirstTransferRetirementSubTypes migration used — except that
    //    check originally also looked at credit_blocks_entity.itmoAuthorizationRecord,
    //    a column this migration doesn't add until step 8. Deliberately
    //    dropped here rather than reordered: that column starts NULL for
    //    every row regardless of when it's added (nothing populates it
    //    for historical blocks in either the squashed or original
    //    sequential migrations — see the module docblock), so the two
    //    conditions were never actually distinguishable; "isFirstTransfer"
    //    alone is behaviourally identical. "Use For OIMP" was always
    //    ITMO-only (a pure rename, no check needed); SOP Adaptation has no
    //    successor and stays NULL.
    await queryRunner.query(
      `UPDATE "credit_transactions_entity" ct
       SET "subType" = (CASE
         WHEN ct."retirementType"::text IN ('Cross-Border Transactions', 'Use Towards NDC') THEN
           (CASE
             WHEN ct."isFirstTransfer" = TRUE THEN 'First Transfer Towards NDC'
             ELSE 'Use Towards NDC'
           END)
         WHEN ct."retirementType"::text = 'Use For OIMP' THEN 'First Transfer For OIMP'
         WHEN ct."retirementType"::text = 'Voluntary Cancellations' THEN 'Voluntary Cancellations'
         WHEN ct."retirementType"::text = 'OMGE Cancellation' THEN 'OMGE Cancellation'
         ELSE NULL
       END)::"public"."credit_transactions_entity_subtype_enum"
       WHERE ct."retirementType" IS NOT NULL`
    );

    // 5. Remap the removed "type" values, working on text so both the
    //    removed source values and the new ItmoAuthorized target are
    //    representable during the swap.
    await queryRunner.query(
      `ALTER TABLE "credit_transactions_entity" ALTER COLUMN "type" TYPE text USING "type"::text`
    );
    await queryRunner.query(
      `UPDATE "credit_transactions_entity" SET "type" = 'Transfered' WHERE "type" = 'FirstTransfer'`
    );
    await queryRunner.query(
      `UPDATE "credit_transactions_entity" SET "type" = 'ItmoAuthorized' WHERE "type" = 'Authorized'`
    );

    // 6. The even-older generation of rows, which encoded retirement
    //    flavour directly in "type" rather than via "retirementType" —
    //    remapped to type='Retired' with subType classified the same way
    //    as step 4 (COALESCE guards a row step 4 already classified,
    //    though the WHERE clauses here are already mutually exclusive by
    //    "type" with step 4's, which only ever matched 'Retired' rows).
    const legacyTypeRemaps: Array<[string, string]> = [
      ["UseTowardsNDC", "Use Towards NDC"],
      ["UseForOIMP", "First Transfer For OIMP"],
      ["VoluntaryCancellation", "Voluntary Cancellations"],
      ["OMGECancellation", "OMGE Cancellation"],
    ];
    for (const [oldType, finalSubType] of legacyTypeRemaps) {
      if (oldType === "UseTowardsNDC") {
        // Needs the same ITMO/MO check as step 4 — can't use a flat
        // COALESCE-to-constant like the other three.
        await queryRunner.query(
          `UPDATE "credit_transactions_entity" ct
           SET "type" = 'Retired',
               "subType" = COALESCE(ct."subType", (CASE
                 WHEN ct."isFirstTransfer" = TRUE THEN 'First Transfer Towards NDC'
                 ELSE 'Use Towards NDC'
               END)::"public"."credit_transactions_entity_subtype_enum")
           WHERE ct."type" = $1`,
          [oldType]
        );
      } else {
        await queryRunner.query(
          `UPDATE "credit_transactions_entity"
           SET "type" = 'Retired',
               "subType" = COALESCE("subType", $1::"public"."credit_transactions_entity_subtype_enum")
           WHERE "type" = $2`,
          [finalSubType, oldType]
        );
      }
    }
    await queryRunner.query(
      `DROP TYPE "public"."credit_transactions_entity_type_enum"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."credit_transactions_entity_type_enum" AS ENUM('Issued', 'Transfered', 'Retired', 'ItmoAuthorized', 'Acquired')`
    );
    await queryRunner.query(
      `ALTER TABLE "credit_transactions_entity" ALTER COLUMN "type" TYPE "public"."credit_transactions_entity_type_enum" USING "type"::"public"."credit_transactions_entity_type_enum"`
    );

    // 7. Drop the folded-in columns and their orphaned enum types.
    await queryRunner.query(
      `ALTER TABLE "credit_transactions_entity"
         DROP COLUMN "retirementType",
         DROP COLUMN "remarks",
         DROP COLUMN "country",
         DROP COLUMN "organizationName",
         DROP COLUMN "cooperativeApproachId",
         DROP COLUMN "authorizationPurpose"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."credit_transactions_entity_retirementtype_enum"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."credit_transactions_entity_authorizationpurpose_enum"`
    );

    // 8. credit_blocks_entity: drop the Article 6.2 metadata columns,
    //    add the ITMO authorization linkage.
    await queryRunner.query(
      `ALTER TABLE "credit_blocks_entity"
         DROP COLUMN "cooperativeApproachId",
         DROP COLUMN "authorizationPurpose",
         DROP COLUMN "omgeDeductedAtIssuance",
         DROP COLUMN "sopDeductedAtIssuance"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."credit_blocks_entity_authorizationpurpose_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "credit_blocks_entity" ADD "itmoAuthorizationRecord" text`
    );

    // 9. Recreate the views from the current view-entity SQL.
    await createView(queryRunner, "credit_block_transfers_view_entity", TRANSFERS_SQL);
    await createView(queryRunner, "credit_block_retirements_view_entity", RETIREMENTS_SQL);
    await createView(queryRunner, "credit_block_balances_view_entity", BALANCES_SQL);
    await createView(queryRunner, "credit_block_issuances_view_entity", ISSUANCES_SQL);
    await createView(queryRunner, "credit_block_org_transactions_view_entity", ORG_TRANSACTIONS_SQL);
    await createView(queryRunner, "credit_block_org_aggregation_view_entity", ORG_AGGREGATION_SQL);
  }

  public async down(): Promise<void> {
    // The up() migration remaps historical enum values and folds
    // columns into jsonb; the source distinctions (e.g. which Retired
    // rows were FirstTransfer rows) are not recoverable. Restore from a
    // backup instead of reverting.
    throw new Error(
      "CreditTxSubTypeAndItmoAuth1786600000000 is irreversible - restore from a backup."
    );
  }
}

const VIEWS_TO_REBUILD = [
  "credit_block_transfers_view_entity",
  "credit_block_retirements_view_entity",
  "credit_block_balances_view_entity",
  "credit_block_issuances_view_entity",
  "credit_block_org_transactions_view_entity",
  "credit_block_org_aggregation_view_entity",
];

async function dropView(queryRunner: QueryRunner, view: string): Promise<void> {
  await queryRunner.query(
    `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`,
    ["VIEW", view, "public"]
  );
  await queryRunner.query(`DROP VIEW IF EXISTS "${view}"`);
}

async function createView(
  queryRunner: QueryRunner,
  view: string,
  sql: string
): Promise<void> {
  await queryRunner.query(`CREATE VIEW "${view}" AS ${sql}`);
  await queryRunner.query(
    `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`,
    ["public", "VIEW", view, sql]
  );
}

// The SQL below is copied verbatim from each view entity's
// `expression` in libs/shared/src/view-entities/, as of this migration's
// point in the timeline (credit_block_retirements_view_entity gets one
// more legitimate touch later, in ItmoVisibilityViews, adding the
// itmoSerial/itmoAuthorizationRecord join).

const TRANSFERS_SQL = `
      SELECT
        ct."id" AS "id",
        ct."serialNumber" AS "serialNumber",
        ct."amount" AS "creditAmount",
        ct."createTime" AS "createdDate",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        p."companyId" AS "projectOwnerId",
        ct."recieverId" AS "recieverId",
        r."name" AS "receiverName",
        r."logo" AS "receiverLogo",
        ct."senderId" AS "senderId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo",
        ct."type"::text AS "type",
        COALESCE(ct."isFirstTransfer", FALSE) AS "isFirstTransfer",
        ct."fromAccountType"::text AS "fromAccountType",
        ct."toAccountType"::text AS "toAccountType"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      WHERE ct."type" = 'Transfered'
    `;

// Final shape as of 1786800000000-MoItmoRetirementRules.ts /
// 1787200000000-FirstTransferRetirementSubTypes.ts (both now folded in
// here) — entityName (not the transitional organizationName), selecting
// the final subType values. ItmoVisibilityViews recreates this again
// later to add the itmoSerial/itmoAuthorizationRecord join.
const RETIREMENTS_SQL = `
      SELECT
        ct."id" AS "id",
        ct."serialNumber" AS "serialNumber",
        ct."amount" AS "creditAmount",
        ct."createTime" AS "createdDate",
        ct."subType" AS "subType",
        ct."status" AS "status",
        ct."projectRefId" AS "projectId",
        country."name" AS "country",
        ct."data"->>'entityName' AS "entityName",
        ct."data"->>'remarks' AS "remarks",
        p."title" AS "projectName",
        p."companyId" AS "projectOwnerId",
        ct."senderId" AS "senderId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN country ON ct."data"->>'country' = country."alpha2"
      WHERE ct."type" = 'Retired'
    `;

// Final shape as of 1786800000000-MoItmoRetirementRules.ts (now folded in
// here) — includes the ITMO authorization join. Nothing later ever
// changes this view again.
const BALANCES_SQL = `
    SELECT
      cb."creditBlockId" AS "id",
      cb."serialNumber" AS "serialNumber",
      cb."itmoSerial" AS "itmoSerial",
      (cb."creditAmount" - cb."reservedCreditAmount") AS "creditAmount",
      cb."reservedCreditAmount" AS "reservedCredits",
      cb."createTime" AS "createdDate",
      cb."txTime" AS "updatedTime",
      cb."projectRefId" AS "projectId",
      p."title" AS "projectName",
      cb."ownerCompanyId" AS "receiverId",
      r."name" AS "receiverName",
      r."logo" AS "receiverLogo",
      cb."previousOwnerCompanyId" AS "senderId",
      s."name" AS "senderName",
      s."logo" AS "senderLogo",
      CASE
        WHEN cb."isNotTransferred" = TRUE THEN 'issued'
        ELSE 'received'
      END AS "type",
      cb."accountType"::text AS "accountType",
      cb."itmoAuthorizationRecord" AS "itmoAuthorizationRecord",
      itmoauth."data"->>'cooperativeApproachId' AS "itmoCooperativeApproachId",
      itmoauth."data"->>'authorizationPurpose' AS "itmoAuthorizationPurpose"
    FROM credit_blocks_entity cb
    LEFT JOIN project_entity p ON cb."projectRefId" = p."refId"
    LEFT JOIN company r ON cb."ownerCompanyId" = r."companyId"
    LEFT JOIN company s ON cb."previousOwnerCompanyId" = s."companyId"
    LEFT JOIN credit_transactions_entity itmoauth ON cb."itmoAuthorizationRecord" = itmoauth."id"
    WHERE cb."ownerCompanyId" != 0`;

const ISSUANCES_SQL = `
      SELECT
        ct."id" AS "id",
        ct."serialNumber" AS "serialNumber",
        ct."amount" AS "creditAmount",
        ct."createTime" AS "issuanceDate",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        p."companyId" AS "projectOwnerId",
        ct."recieverId" AS "organizationId",
        r."name" AS "organizationName",
        r."logo" AS "organizationLogo"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      WHERE ct."type" = 'Issued'
    `;

const ORG_TRANSACTIONS_SQL = `
      SELECT
        ct."id" AS "id",
        'Issued' AS "currentStatus",
        ct."recieverId" AS "organizationId",
        ct."serialNumber" AS "serialNumber",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        p."companyId" AS "projectOwnerId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo",
        r."name" AS "receiverName",
        r."logo" AS "receiverLogo",
        ct."createTime" AS "updatedDate",
        ct."amount" AS "creditAmount"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      WHERE ct."type" = 'Issued'

      UNION ALL

      SELECT
        ct."id" AS "id",
        'Received' AS "currentStatus",
        ct."recieverId" AS "organizationId",
        ct."serialNumber" AS "serialNumber",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        p."companyId" AS "projectOwnerId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo",
        r."name" AS "receiverName",
        r."logo" AS "receiverLogo",
        ct."createTime" AS "updatedDate",
        ct."amount" AS "creditAmount"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      WHERE ct."type" = 'Transfered'

      UNION ALL

      SELECT
        ct."id" AS "id",
        'Transferred' AS "currentStatus",
        ct."senderId" AS "organizationId",
        ct."serialNumber" AS "serialNumber",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        p."companyId" AS "projectOwnerId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo",
        r."name" AS "receiverName",
        r."logo" AS "receiverLogo",
        ct."createTime" AS "updatedDate",
        ct."amount" AS "creditAmount"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      WHERE ct."type" = 'Transfered'

      UNION ALL

      SELECT
        ct."id" AS "id",
        'Retired' AS "currentStatus",
        ct."senderId" AS "organizationId",
        ct."serialNumber" AS "serialNumber",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        p."companyId" AS "projectOwnerId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo",
        r."name" AS "receiverName",
        r."logo" AS "receiverLogo",
        ct."createTime" AS "updatedDate",
        ct."amount" AS "creditAmount"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      WHERE ct."type" = 'Retired'
      AND ct.status = 'Completed'
    `;

const ORG_AGGREGATION_SQL = `
    SELECT
      c."companyId" AS "organizationId",
      COALESCE(iss."creditIssued", 0) AS "creditIssued",
      COALESCE(ret."creditRetired", 0) AS "creditRetired",
      COALESCE(tr."creditTransferred", 0) AS "creditTransferred",
      COALESCE(rec."creditReceived", 0) AS "creditReceived",
      COALESCE(bal."creditReserved", 0) AS "creditReserved",
      COALESCE(bal."creditBalance", 0) AS "creditBalance"
    FROM "company" c
    LEFT JOIN (
      SELECT ct."recieverId" AS "organizationId", SUM(ct."amount") AS "creditIssued"
      FROM "credit_transactions_entity" ct
      WHERE ct."type" = 'Issued'
      GROUP BY ct."recieverId"
    ) iss ON iss."organizationId" = c."companyId"
    LEFT JOIN (
      SELECT ct."senderId" AS "organizationId", SUM(ct."amount") AS "creditRetired"
      FROM "credit_transactions_entity" ct
      WHERE ct."type" = 'Retired'
      AND ct.status = 'Completed'
      GROUP BY ct."senderId"
    ) ret ON ret."organizationId" = c."companyId"
    LEFT JOIN (
      SELECT ct."senderId" AS "organizationId", SUM(ct."amount") AS "creditTransferred"
      FROM "credit_transactions_entity" ct
      WHERE ct."type" = 'Transfered'
      GROUP BY ct."senderId"
    ) tr ON tr."organizationId" = c."companyId"
    LEFT JOIN (
      SELECT ct."recieverId" AS "organizationId", SUM(ct."amount") AS "creditReceived"
      FROM "credit_transactions_entity" ct
      WHERE ct."type" = 'Transfered'
      GROUP BY ct."recieverId"
    ) rec ON rec."organizationId" = c."companyId"
    LEFT JOIN (
      SELECT
        cb."ownerCompanyId" AS "organizationId",
        SUM(cb."reservedCreditAmount") AS "creditReserved",
        SUM(cb."creditAmount" - cb."reservedCreditAmount") AS "creditBalance"
      FROM "credit_blocks_entity" cb
      WHERE cb."ownerCompanyId" != 0
      GROUP BY cb."ownerCompanyId"
    ) bal ON bal."organizationId" = c."companyId"`;
