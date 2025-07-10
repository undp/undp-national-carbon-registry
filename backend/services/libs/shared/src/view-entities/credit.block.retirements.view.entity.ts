import { ViewColumn, ViewEntity } from "typeorm";
import { CreditRetirementTypeEnum } from "../enum/credit.retirement.type.enum";
import { CreditTransactionStatusEnum } from "../enum/credit.transaction.status.enum";

@ViewEntity({
  expression: `
      SELECT 
        ct."id" AS "id",
        ct."serialNumber" AS "serialNumber",
        ct."amount" AS "creditAmount",
        ct."createTime" AS "createdDate",
        ct."retirementType" AS "retirementType",
        ct."status" AS "status",
        ct."projectRefId" AS "projectId",
        country."name" AS "country",
        ct."organizationName",
        ct."remarks",
        p."title" AS "projectName",
        ct."senderId" AS "senderId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN country ON ct."country" = country."alpha2"
      WHERE ct."type" = 'Retired'
    `,
})
export class CreditBlockRetirementsViewEntity {
  @ViewColumn()
  id: string;

  @ViewColumn()
  serialNumber: string;

  @ViewColumn()
  creditAmount: number;

  @ViewColumn()
  createdDate: number;

  @ViewColumn()
  retirementType: CreditRetirementTypeEnum;

  @ViewColumn()
  status: CreditTransactionStatusEnum;

  @ViewColumn()
  projectId: string;

  @ViewColumn()
  projectName: string;

  @ViewColumn()
  senderId: number;

  @ViewColumn()
  senderName: string;

  @ViewColumn()
  senderLogo: string;

  @ViewColumn()
  country?: string;

  @ViewColumn()
  organizationName?: string;

  @ViewColumn()
  remarks?: string;
}
