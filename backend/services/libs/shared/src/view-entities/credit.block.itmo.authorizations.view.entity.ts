import { ViewColumn, ViewEntity } from "typeorm";
import { CreditTransactionStatusEnum } from "../enum/credit.transaction.status.enum";
import { AuthorizationPurpose } from "../enum/authorization.purpose.enum";

@ViewEntity({
  expression: `
      SELECT
        ct."id" AS "id",
        ct."serialNumber" AS "serialNumber",
        ct."amount" AS "creditAmount",
        ct."createTime" AS "createdDate",
        ct."status" AS "status",
        ct."projectRefId" AS "projectId",
        ct."data"->>'cooperativeApproachId' AS "cooperativeApproachId",
        ct."data"->>'authorizationPurpose' AS "authorizationPurpose",
        ct."data"->>'remarks' AS "remarks",
        p."title" AS "projectName",
        p."companyId" AS "projectOwnerId",
        ct."senderId" AS "senderId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      WHERE ct."type" = 'ItmoAuthorized'
    `,
})
export class CreditBlockItmoAuthorizationsViewEntity {
  @ViewColumn()
  id: string;

  @ViewColumn()
  serialNumber: string;

  @ViewColumn()
  creditAmount: number;

  @ViewColumn()
  createdDate: number;

  @ViewColumn()
  status: CreditTransactionStatusEnum;

  @ViewColumn()
  projectId: string;

  @ViewColumn()
  cooperativeApproachId?: string;

  @ViewColumn()
  authorizationPurpose?: AuthorizationPurpose;

  @ViewColumn()
  remarks?: string;

  @ViewColumn()
  projectName: string;

  @ViewColumn()
  projectOwnerId: number;

  @ViewColumn()
  senderId: number;

  @ViewColumn()
  senderName: string;

  @ViewColumn()
  senderLogo: string;
}
