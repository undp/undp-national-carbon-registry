import { ViewColumn, ViewEntity } from "typeorm";

@ViewEntity({
  expression: `
    SELECT
      cb."creditBlockId" AS "id",
      cb."serialNumber" AS "serialNumber",
      cb."itmoSerial" AS "itmoSerial",
      (cb."creditAmount" - cb."reservedCreditAmount") AS "creditAmount",
      cb."reservedCreditAmount" AS "reservedCredits",
      cb."createTime" AS "createdDate",
      cb."txTime" AS "updatedTime",
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
      END AS "type",
      cb."accountType"::text AS "accountType",
      cb."itmoAuthorizationRecord" AS "itmoAuthorizationRecord",
      itmoauth."data"->>'cooperativeApproachId' AS "itmoCooperativeApproachId",
      itmoauth."data"->>'authorizationPurpose' AS "itmoAuthorizationPurpose"
    FROM credit_blocks_entity cb
    LEFT JOIN project_entity p ON cb."projectRefId" = p."refId"
    LEFT JOIN company r ON cb."ownerCompanyId" = r."companyId"
    LEFT JOIN company s ON cb."previousOwnerCompanyId" = s."companyId"
    LEFT JOIN credit_transactions_entity itmoauth ON cb."itmoAuthorizationRecord" = itmoauth."id"
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
  reservedCredits: number;

  @ViewColumn()
  createdDate: number;

  @ViewColumn()
  updatedTime: number;

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

  @ViewColumn()
  accountType: string;

  // Non-null ⇒ the block is ITMO authorized (id of the authorizing
  // transaction record).
  @ViewColumn()
  itmoAuthorizationRecord: string;

  // Resolved from the ITMO authorization record's data — the
  // cooperative approach the block was authorized under, and the
  // authorization purpose (NDC / OIMP / Other). Both null for MO
  // blocks. Drives which retirement subtypes the frontend offers.
  @ViewColumn()
  itmoCooperativeApproachId: string;

  @ViewColumn()
  itmoAuthorizationPurpose: string;
}
