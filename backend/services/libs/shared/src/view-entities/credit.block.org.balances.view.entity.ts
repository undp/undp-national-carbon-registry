import { ViewColumn, ViewEntity } from "typeorm";

// Credits -> Balance -> By Organization (DNA only): one row per
// credit-holding organization, aggregating the balance (creditAmount -
// reservedCreditAmount) and reserved amount of every non-retired block it
// owns. updatedTime is the most recent block update (txTime) among those
// blocks. Ignores account type by design - totals cover all account types.
@ViewEntity({
  expression: `
    SELECT
      cb."ownerCompanyId" AS "organizationId",
      o."name" AS "organizationName",
      o."logo" AS "organizationLogo",
      SUM(cb."creditAmount" - cb."reservedCreditAmount") AS "creditBalance",
      SUM(cb."reservedCreditAmount") AS "reservedCredits",
      COALESCE(SUM(cb."creditAmount" - cb."reservedCreditAmount")
        FILTER (WHERE cb."itmoAuthorizationRecord" IS NOT NULL), 0) AS "itmoBalance",
      COALESCE(SUM(cb."reservedCreditAmount")
        FILTER (WHERE cb."itmoAuthorizationRecord" IS NOT NULL), 0) AS "itmoReservedCredits",
      MAX(cb."txTime") AS "updatedTime"
    FROM credit_blocks_entity cb
    LEFT JOIN company o ON cb."ownerCompanyId" = o."companyId"
    WHERE cb."ownerCompanyId" != 0
    GROUP BY cb."ownerCompanyId", o."name", o."logo"`,
})
export class CreditBlockOrgBalancesViewEntity {
  @ViewColumn()
  organizationId: number;

  @ViewColumn()
  organizationName: string;

  @ViewColumn()
  organizationLogo: string;

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
