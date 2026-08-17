import { ViewColumn, ViewEntity } from "typeorm";
import { CreditTransactionSubTypesEnum } from "../enum/credit.transaction.sub.types.enum";
import { CreditTransactionStatusEnum } from "../enum/credit.transaction.status.enum";

@ViewEntity({
  expression: `
      SELECT
        ct."id" AS "id",
        ct."serialNumber" AS "serialNumber",
        ct."amount" AS "creditAmount",
        ct."createTime" AS "createdDate",
        ct."subType" AS "subType",
        ct."status" AS "status",
        ct."projectRefId" AS "projectId",
        country."name" AS "country",
        ct."data"->>'entityName' AS "entityName",
        ct."data"->>'remarks' AS "remarks",
        p."title" AS "projectName",
        p."companyId" AS "projectOwnerId",
        ct."senderId" AS "senderId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo",
        rb."itmoSerial" AS "itmoSerial",
        rb."itmoAuthorizationRecord" AS "itmoAuthorizationRecord"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN country ON ct."data"->>'country' = country."alpha2"
      LEFT JOIN credit_blocks_entity rb ON ct."creditBlockId" = rb."creditBlockId"
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
  subType: CreditTransactionSubTypesEnum;

  @ViewColumn()
  status: CreditTransactionStatusEnum;

  @ViewColumn()
  projectId: string;

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

  // Destination counterparty country, resolved server-side for ITMO
  // Use-Towards-NDC / Use-For-OIMP retirements from the block's
  // ITMO-authorized cooperative approach.
  @ViewColumn()
  country?: string;

  // Authorized entity name, populated only for Use-For-OIMP
  // retirements.
  @ViewColumn()
  entityName?: string;

  @ViewColumn()
  remarks?: string;

  // Joined from credit_blocks_entity via creditBlockId. On a partial
  // retirement the transaction's creditBlockId points at the retained
  // parent block (see programme-ledger.service.ts), whose serialNumber
  // is what "serialNumber" above already reflects — so this stays
  // consistent with the displayed serial. Null for MO blocks.
  @ViewColumn()
  itmoSerial?: string;

  // Non-null ⇒ the retired block was ITMO authorized.
  @ViewColumn()
  itmoAuthorizationRecord?: string;
}
