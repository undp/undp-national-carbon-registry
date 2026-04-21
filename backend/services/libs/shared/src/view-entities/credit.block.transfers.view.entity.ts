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
        s."logo" AS "senderLogo",
        ct."type"::text AS "type",
        COALESCE(ct."isFirstTransfer", FALSE) AS "isFirstTransfer",
        ct."cooperativeApproachId" AS "cooperativeApproachId",
        ct."authorizationPurpose"::text AS "authorizationPurpose",
        ct."fromAccountType"::text AS "fromAccountType",
        ct."toAccountType"::text AS "toAccountType"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      -- Dec 2/CMA.3 Annex para 1(a) and Dec 4/CMA.6 Annex II Actions
      -- table require the "first transfer" to be surfaced alongside
      -- subsequent transfers. Prior to this commit the view filtered to
      -- type='Transfered' only, so FirstTransfer rows produced by the
      -- replicator were invisible to queryTransfers and to AEF Actions
      -- consumers. Broaden to include both types.
      WHERE ct."type" IN ('Transfered', 'FirstTransfer')
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

  @ViewColumn()
  type: string;

  @ViewColumn()
  isFirstTransfer: boolean;

  @ViewColumn()
  cooperativeApproachId: string;

  @ViewColumn()
  authorizationPurpose: string;

  @ViewColumn()
  fromAccountType: string;

  @ViewColumn()
  toAccountType: string;
}
