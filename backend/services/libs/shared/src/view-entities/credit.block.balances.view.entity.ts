import { ViewColumn, ViewEntity } from "typeorm";

@ViewEntity({
  expression: `
    SELECT
      cb."creditBlockId" AS "id",
      cb."serialNumber" AS "serialNumber",
      cb."itmoSerial" AS "itmoSerial",
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
      COALESCE(cb."accountType"::text, 'Holding') AS "accountType",
      cb."cooperativeApproachId" AS "cooperativeApproachId",
      cb."authorizationPurpose"::text AS "authorizationPurpose",
      COALESCE(cb."omgeDeductedAtIssuance", FALSE) AS "omgeDeductedAtIssuance",
      COALESCE(cb."sopDeductedAtIssuance", FALSE) AS "sopDeductedAtIssuance",
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

  // Dec 6/CMA.4 Annex I para 5 ITMO identifier.
  @ViewColumn()
  itmoSerial: string;

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
  accountType: string;

  @ViewColumn()
  cooperativeApproachId: string;

  @ViewColumn()
  authorizationPurpose: string;

  @ViewColumn()
  omgeDeductedAtIssuance: boolean;

  @ViewColumn()
  sopDeductedAtIssuance: boolean;

  @ViewColumn()
  type: string;
}
