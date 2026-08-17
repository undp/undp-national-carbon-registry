import { ViewColumn, ViewEntity } from "typeorm";

@ViewEntity({
  expression: `
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
    `,
})
export class CreditBlockIssuancesViewEntity {
  @ViewColumn()
  id: string;

  @ViewColumn()
  serialNumber: string;

  @ViewColumn()
  creditAmount: number;

  @ViewColumn()
  issuanceDate: number;

  @ViewColumn()
  projectId: string;

  @ViewColumn()
  projectName: string;

  @ViewColumn()
  projectOwnerId: number;

  @ViewColumn()
  organizationId: number;

  @ViewColumn()
  organizationName: string;

  @ViewColumn()
  organizationLogo: string;
}
