import { ViewColumn, ViewEntity } from "typeorm";

// Per-organization credit interactions feed (POST
// /national/creditTransactionsManagement/orgCreditBlocks). One row per
// interaction *from a single organization's perspective*, keyed on
// "organizationId" so it filters cleanly by the org whose profile is being
// viewed:
//   - Issued         : credits issued to the org    (organizationId = recieverId)
//   - Received       : a transfer the org received  (organizationId = recieverId)
//   - Transferred    : a transfer the org sent out  (organizationId = senderId)
//   - Retired        : credits the org retired      (organizationId = senderId)
//   - ITMO Authorized: MOs the org had authorized as ITMOs
//                                                   (organizationId = senderId)
// A single transfer transaction therefore surfaces twice - once as
// "Transferred" under its sender and once as "Received" under its receiver -
// so the same "id" repeats across perspective rows (the frontend keys rows on
// currentStatus + id). An ITMO authorization, by contrast, surfaces exactly
// once: it never changes hands (senderId = recieverId = the owning org), it
// only re-characterises the units the org already holds.
// "senderName"/"receiverName" are always the transaction's own sender/receiver
// companies regardless of perspective; the perspective is conveyed by
// "currentStatus" + "organizationId". ITMO Authorized rows leave
// "receiverName"/"receiverLogo" NULL rather than joining recieverId (=
// senderId) - it isn't a real recipient, and populating it would render as
// a transfer to itself.
//
// itmoAuthorizationRecord is joined from the block the transaction points at
// and drives the MO/ITMO credit-type column (non-null => ITMO, the same test
// every other credit table uses). Note this reflects the units' *current*
// character: a block authorized in whole after issuance makes its earlier
// "Issued" row read as ITMO too. Only the presence test is taken from this
// join - the block's itmoSerial is NOT, because the block keeps being
// re-split by later retirements/transfers so a joined serial drifts away from
// what a given action actually covered (see
// CreditTransactionsManagementService.enrichOrgTransactionRowsWithItmoSerial,
// which derives it from each row's own frozen serialNumber instead).
@ViewEntity({
  expression: `
      SELECT
        ct."id" AS "id",
        'Issued' AS "currentStatus",
        ct."recieverId" AS "organizationId",
        ct."serialNumber" AS "serialNumber",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        p."companyId" AS "projectOwnerId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo",
        r."name" AS "receiverName",
        r."logo" AS "receiverLogo",
        ct."createTime" AS "updatedDate",
        ct."amount" AS "creditAmount",
        cb."itmoAuthorizationRecord" AS "itmoAuthorizationRecord"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      LEFT JOIN credit_blocks_entity cb ON ct."creditBlockId" = cb."creditBlockId"
      WHERE ct."type" = 'Issued'

      UNION ALL

      SELECT
        ct."id" AS "id",
        'Received' AS "currentStatus",
        ct."recieverId" AS "organizationId",
        ct."serialNumber" AS "serialNumber",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        p."companyId" AS "projectOwnerId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo",
        r."name" AS "receiverName",
        r."logo" AS "receiverLogo",
        ct."createTime" AS "updatedDate",
        ct."amount" AS "creditAmount",
        cb."itmoAuthorizationRecord" AS "itmoAuthorizationRecord"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      LEFT JOIN credit_blocks_entity cb ON ct."creditBlockId" = cb."creditBlockId"
      WHERE ct."type" = 'Transfered'

      UNION ALL

      SELECT
        ct."id" AS "id",
        'Transferred' AS "currentStatus",
        ct."senderId" AS "organizationId",
        ct."serialNumber" AS "serialNumber",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        p."companyId" AS "projectOwnerId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo",
        r."name" AS "receiverName",
        r."logo" AS "receiverLogo",
        ct."createTime" AS "updatedDate",
        ct."amount" AS "creditAmount",
        cb."itmoAuthorizationRecord" AS "itmoAuthorizationRecord"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      LEFT JOIN credit_blocks_entity cb ON ct."creditBlockId" = cb."creditBlockId"
      WHERE ct."type" = 'Transfered'

      UNION ALL

      SELECT
        ct."id" AS "id",
        'Retired' AS "currentStatus",
        ct."senderId" AS "organizationId",
        ct."serialNumber" AS "serialNumber",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        p."companyId" AS "projectOwnerId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo",
        r."name" AS "receiverName",
        r."logo" AS "receiverLogo",
        ct."createTime" AS "updatedDate",
        ct."amount" AS "creditAmount",
        cb."itmoAuthorizationRecord" AS "itmoAuthorizationRecord"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN company r ON ct."recieverId" = r."companyId"
      LEFT JOIN credit_blocks_entity cb ON ct."creditBlockId" = cb."creditBlockId"
      WHERE ct."type" = 'Retired'
      AND ct.status = 'Completed'

      UNION ALL

      SELECT
        ct."id" AS "id",
        'ITMO Authorized' AS "currentStatus",
        ct."senderId" AS "organizationId",
        ct."serialNumber" AS "serialNumber",
        ct."projectRefId" AS "projectId",
        p."title" AS "projectName",
        p."companyId" AS "projectOwnerId",
        s."name" AS "senderName",
        s."logo" AS "senderLogo",
        NULL AS "receiverName",
        NULL AS "receiverLogo",
        ct."createTime" AS "updatedDate",
        ct."amount" AS "creditAmount",
        cb."itmoAuthorizationRecord" AS "itmoAuthorizationRecord"
      FROM "credit_transactions_entity" ct
      LEFT JOIN project_entity p ON ct."projectRefId" = p."refId"
      LEFT JOIN company s ON ct."senderId" = s."companyId"
      LEFT JOIN credit_blocks_entity cb ON ct."creditBlockId" = cb."creditBlockId"
      WHERE ct."type" = 'ItmoAuthorized'
      AND ct.status = 'Completed'
    `,
})
export class CreditBlockOrgTransactionsViewEntity {
  @ViewColumn()
  id: string;

  // Issued | Received | Transferred | Retired | ITMO Authorized
  @ViewColumn()
  currentStatus: string;

  // The organization whose perspective this row belongs to.
  @ViewColumn()
  organizationId: number;

  @ViewColumn()
  serialNumber: string;

  @ViewColumn()
  projectId: string;

  @ViewColumn()
  projectName: string;

  @ViewColumn()
  projectOwnerId: number;

  @ViewColumn()
  senderName: string;

  @ViewColumn()
  senderLogo: string;

  @ViewColumn()
  receiverName: string;

  @ViewColumn()
  receiverLogo: string;

  @ViewColumn()
  updatedDate: number;

  @ViewColumn()
  creditAmount: number;

  // Non-null => these units are ITMOs. Drives the MO/ITMO credit type
  // column; the matching ITMO serial is derived server-side rather than
  // joined (see the note above the view expression).
  @ViewColumn()
  itmoAuthorizationRecord: string;
}
