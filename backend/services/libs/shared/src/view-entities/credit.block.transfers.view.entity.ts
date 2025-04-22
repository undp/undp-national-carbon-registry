import { ViewColumn, ViewEntity } from "typeorm";

@ViewEntity({
  expression: `
      SELECT 
        ct."id" AS "id",
        ct."serialNumber" AS "serialNumber",
        ct."amount" AS "creditAmount",
        ct."createTime" AS "createdDate",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        ct."recieverId" AS "recieverId",
        r."name" AS "receiverName",
        r."logo" AS "receiverLogo",
        ct."senderId" AS "senderId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      WHERE ct."type" = 'Transfered'
    `,
})
export class CreditBlockTransfersViewEntity {
  @ViewColumn()
  id: string;

  @ViewColumn()
  serialNumber: string;

  @ViewColumn()
  creditAmount: number;

  @ViewColumn()
  createdDate: number;

  @ViewColumn()
  projectId: string;

  @ViewColumn()
  projectName: string;

  @ViewColumn()
  recieverId: number;

  @ViewColumn()
  receiverName: string;

  @ViewColumn()
  receiverLogo: string;

  @ViewColumn()
  senderId: number;

  @ViewColumn()
  senderName: string;

  @ViewColumn()
  senderLogo: string;
}
