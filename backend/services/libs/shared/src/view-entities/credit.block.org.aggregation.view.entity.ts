import { ViewColumn, ViewEntity } from "typeorm";

// One row per organization with its lifetime credit totals, used to populate
// the View Organisations table (creditIssued / creditRetired) and the org
// profile credit summary card (all five figures). Based on "company" so every
// org appears even after it has transferred or retired everything away.
//   - creditIssued      = SUM(amount) of Issued txns received (recieverId)
//   - creditRetired     = SUM(amount) of Retired txns performed (senderId)
//   - creditTransferred = SUM(amount) of Transfered txns sent (senderId)
//   - creditReceived    = SUM(amount) of Transfered txns received (recieverId)
//   - creditReserved    = SUM(reservedCreditAmount) of currently-owned blocks
//   - creditBalance     = SUM(creditAmount - reservedCreditAmount) of currently-owned blocks
@ViewEntity({
  expression: `
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
    ) bal ON bal."organizationId" = c."companyId"`,
})
export class CreditBlockOrgAggregationViewEntity {
  @ViewColumn()
  organizationId: number;

  @ViewColumn()
  creditIssued: number;

  @ViewColumn()
  creditRetired: number;

  @ViewColumn()
  creditTransferred: number;

  @ViewColumn()
  creditReceived: number;

  @ViewColumn()
  creditReserved: number;

  @ViewColumn()
  creditBalance: number;
}
