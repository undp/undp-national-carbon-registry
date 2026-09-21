// Maps 1:1 to CreditBlockIssuancesViewEntity (backend/services/libs/shared/
// src/view-entities/credit.block.issuances.view.entity.ts), the response
// shape of POST /national/creditTransactionsManagement/queryIssuances.
// History is fetched separately (per row, on demand) from POST
// .../creditBlockHistory, keyed by a blockId derived from `serialNumber`.
export interface CreditIssuanceInterface {
  id: string;
  serialNumber: string;
  creditAmount: number;
  issuanceDate: string; // epoch ms, as a string
  projectId: string;
  projectName: string;
  projectOwnerId: number;
  organizationId: number;
  organizationName: string;
  organizationLogo: string | null;
  // Derived client-side from serialNumber's trailing segment — see
  // vintageFromSerial in creditIssuanceTable.tsx.
  vintage?: string;
}
