import { ViewColumn, ViewEntity } from "typeorm";

// Credits -> Balance -> By Project (Project Developer): one row per
// (project, holder) pair, aggregating the balance (creditAmount -
// reservedCreditAmount) and reserved amount of every non-retired block a
// given organization holds within a given project. A Project Developer
// queries this filtered to holderId = own companyId, yielding one row per
// project it holds credits in, scoped strictly to its own holdings -
// unlike CreditBlockProjectBalancesViewEntity (DNA), which sums across all
// holders. projectOwner* still identifies the project's developer company,
// which may differ from the current holder. updatedTime is the most recent
// block update (txTime) within the (project, holder) scope. Ignores
// account type by design - totals cover all account types.
@ViewEntity({
  expression: `
    SELECT
      cb."projectRefId" || '-' || cb."ownerCompanyId" AS "id",
      cb."projectRefId" AS "projectId",
      p."title" AS "projectName",
      p."companyId" AS "projectOwnerId",
      pc."name" AS "projectOwnerName",
      pc."logo" AS "projectOwnerLogo",
      cb."ownerCompanyId" AS "holderId",
      SUM(cb."creditAmount" - cb."reservedCreditAmount") AS "creditBalance",
      SUM(cb."reservedCreditAmount") AS "reservedCredits",
      COALESCE(SUM(cb."creditAmount" - cb."reservedCreditAmount")
        FILTER (WHERE cb."itmoAuthorizationRecord" IS NOT NULL), 0) AS "itmoBalance",
      COALESCE(SUM(cb."reservedCreditAmount")
        FILTER (WHERE cb."itmoAuthorizationRecord" IS NOT NULL), 0) AS "itmoReservedCredits",
      MAX(cb."txTime") AS "updatedTime"
    FROM credit_blocks_entity cb
    LEFT JOIN project_entity p ON cb."projectRefId" = p."refId"
    LEFT JOIN company pc ON p."companyId" = pc."companyId"
    WHERE cb."ownerCompanyId" != 0
    GROUP BY cb."projectRefId", p."title", p."companyId", pc."name", pc."logo", cb."ownerCompanyId"`,
})
export class CreditBlockProjectHolderBalancesViewEntity {
  @ViewColumn()
  id: string;

  @ViewColumn()
  projectId: string;

  @ViewColumn()
  projectName: string;

  @ViewColumn()
  projectOwnerId: number;

  @ViewColumn()
  projectOwnerName: string;

  @ViewColumn()
  projectOwnerLogo: string;

  @ViewColumn()
  holderId: number;

  @ViewColumn()
  creditBalance: number;

  @ViewColumn()
  reservedCredits: number;

  // ITMO-only subset of creditBalance / reservedCredits (blocks with a
  // non-null itmoAuthorizationRecord). MO figures are derived
  // client-side as creditBalance - itmoBalance.
  @ViewColumn()
  itmoBalance: number;

  @ViewColumn()
  itmoReservedCredits: number;

  @ViewColumn()
  updatedTime: number;
}
