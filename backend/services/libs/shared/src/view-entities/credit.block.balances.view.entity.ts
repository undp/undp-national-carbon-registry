import { ViewColumn, ViewEntity } from "typeorm";

@ViewEntity({
  expression: `
    SELECT 
      cb."creditBlockId" AS "id",
      cb."serialNumber" AS "serialNumber",
      (cb."creditAmount" - cb."reservedCreditAmount") AS "creditAmount",
      cb."createTime" AS "createdDate",
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
      END AS "type"
    FROM credit_blocks_entity cb
    LEFT JOIN project_entity p ON cb."projectRefId" = p."refId"
    LEFT JOIN company r ON cb."ownerCompanyId" = r."companyId"
    LEFT JOIN company s ON cb."previousOwnerCompanyId" = s."companyId"
    WHERE cb."ownerCompanyId" != 0`,
})
export class CreditBlockBalancesViewEntity {
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
  receiverId: number;

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
}
