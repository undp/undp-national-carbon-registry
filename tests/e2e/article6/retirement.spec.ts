/**
 * E2E coverage for credit retirement via the two-phase
 * /retireRequest -> /performRetireAction flow on
 * /national/creditTransactionsManagement.
 *
 * Backs audit gaps #6 (Major), #9 (Major) and #10 (Major) from
 * docs/testing/e2e-coverage.md. Prior to this file the retirement
 * surface was only exercised by a bundle-scan smoke test
 * (itmo-lifecycle:189) and a single CASL rejection
 * (itmo-lifecycle:599). The arithmetic side-effects — overdraw
 * rejection, post-retirement re-retirement, and the six-way
 * retirement-type -> accountType mapping — were unasserted.
 *
 * Backend flow verified against:
 *   - credit.transactions.management.controller.ts:39-64 (2 routes:
 *     /retireRequest for phase 1, /performRetireAction for phase 2).
 *   - credit-transactions-management.service.ts:181-278 (createRetireRequest)
 *     and :280-397 (creditRetirementAction).
 *   - programme-ledger.service.ts:56-78 (mapRetirementTypeToAccountType)
 *     and :671-982 (addRetireRequest + retirementRequestAction).
 *
 * Infrastructure notes:
 *   - The ledger-replicator container is Exited in the current dev
 *     stack. phase 2 (/performRetireAction) depends on a row in the
 *     RDBMS credit_transactions_entity table, which is normally
 *     populated by the replicator via handleTransactionRecords
 *     (credit-transactions-management.service.ts:399-511 + called from
 *     ledger-replicator/process.event.service.ts:366). We bypass the
 *     replicator by inserting the pending transaction row directly
 *     via seedPendingRetirementTransactionDirect so the ACCEPT branch
 *     can reach the ledger update.
 *   - queryBalance filters out retired blocks (view WHERE ownerCompanyId
 *     != 0), so accountType assertions read the ledger credit_blocks
 *     table directly via readLedgerBlocksByProject / readLedgerCreditBlock.
 *
 * Parallel safety: every seeded block / tx uses uniqueSuffix().
 */
import { test, expect } from "./support/fixtures";
import { createApiClient } from "./support/api-client";
import {
  seedTransferrableBlock,
  seedPendingRetirementTransactionDirect,
  readLedgerCreditBlock,
  readLedgerBlocksByProject,
  approveRetireRequest,
  performRetireAction,
  uniqueSuffix,
  CreditRetirementType,
} from "./support/factories";

// Company IDs verified against /national/auth/login JWT claims:
//   palinda+dev@xeptagon.com -> companyId=1, PD Admin (apiPd fixture).
//   palinda+add@xeptagon.com -> companyId=6, DNA Admin (apiDna fixture).
// createRetireRequest (service :186-197) requires the caller to be a
// PROJECT_DEVELOPER Admin and to own the block. creditRetirementAction
// with action=ACCEPT (service :319-334) requires the caller to be a
// DESIGNATED_NATIONAL_AUTHORITY Admin/Root.
const PD_COMPANY_ID = 1;

// Wire strings from backend CreditRetirementTypeEnum (see
// backend/services/libs/shared/src/enum/credit.retirement.type.enum.ts).
// Kept in sync with RETIREMENT_TYPE_WIRE in factories.ts; declared here
// because the pending-tx RDBMS seed stores the wire string directly.
// USE_TOWARDS_NDC is MO-only (domestic); FIRST_TRANSFER_TOWARDS_NDC /
// FIRST_TRANSFER_FOR_OIMP are ITMO-only, gated by the block's ITMO
// authorization purpose — see credit.transaction.sub.types.enum.ts.
const RETIREMENT_TYPE_WIRE: Record<CreditRetirementType, string> = {
  CROSS_BORDER_TRANSACTIONS: "Cross-Border Transactions",
  VOLUNTARY_CANCELLATIONS: "Voluntary Cancellations",
  USE_TOWARDS_NDC: "Use Towards NDC",
  FIRST_TRANSFER_TOWARDS_NDC: "First Transfer Towards NDC",
  FIRST_TRANSFER_FOR_OIMP: "First Transfer For OIMP",
  OMGE_CANCELLATION: "OMGE Cancellation",
  SOP_ADAPTATION: "SOP Adaptation",
};

// Expected AccountType per mapRetirementTypeToAccountType
// (programme-ledger.service.ts:56-78). Values are the enum wire strings
// from backend/services/libs/shared/src/enum/account.type.enum.ts.
// CROSS_BORDER_TRANSACTIONS falls through to the default Holding branch
// because cross-border transfer routes credits to another Party rather
// than landing them in a Dec 2/CMA.3 para 29 cancellation bucket.
// USE_TOWARDS_NDC and FIRST_TRANSFER_TOWARDS_NDC share the same
// RetirementNDC bucket — the account type tracks what the credit was
// used for, not whether it crossed a border.
const EXPECTED_ACCOUNT_TYPE: Record<CreditRetirementType, string> = {
  CROSS_BORDER_TRANSACTIONS: "Holding",
  VOLUNTARY_CANCELLATIONS: "CancellationVoluntary",
  USE_TOWARDS_NDC: "RetirementNDC",
  FIRST_TRANSFER_TOWARDS_NDC: "RetirementNDC",
  FIRST_TRANSFER_FOR_OIMP: "RetirementOIMP",
  OMGE_CANCELLATION: "CancellationOMGE",
  SOP_ADAPTATION: "CancellationSOP",
};

test.describe("Credit retirement - /retireRequest + /performRetireAction", () => {
  // ------------------------------------------------------------------
  // Gap #10 Major — retirement type -> AccountType mapping.
  //
  // Parameterized: for each of the 6 CreditRetirementType values, seed
  // a 1000-credit Holding block, fire phase 1 (retireRequest) for 200
  // credits, inject the pending credit_transactions_entity row (normally
  // created by the replicator), fire phase 2 (performRetireAction
  // ACCEPT), then read the ledger and assert the newly-inserted
  // retirement block (the "split" branch of retirementRequestAction at
  // programme-ledger.service.ts:874-937) carries the mapped accountType.
  //
  // Uses a split (not full-retire) so we exercise the insertMap branch
  // that creates a new retirement block with the derived accountType
  // — this is the path used in production for partial retirements and
  // is the richer of the two branches.
  // ------------------------------------------------------------------
  test.describe("Mapping: each retirement type lands in its AccountType", () => {
    const types: CreditRetirementType[] = [
      "CROSS_BORDER_TRANSACTIONS",
      "VOLUNTARY_CANCELLATIONS",
      "USE_TOWARDS_NDC",
      "FIRST_TRANSFER_TOWARDS_NDC",
      "FIRST_TRANSFER_FOR_OIMP",
      "OMGE_CANCELLATION",
      "SOP_ADAPTATION",
    ];

    for (const retirementType of types) {
      test(`${retirementType} -> ${EXPECTED_ACCOUNT_TYPE[retirementType]}`, async ({
        apiPd,
        apiDna,
      }) => {
        // Arrange: a 1000-credit Holding block owned by the PD.
        const seeded = seedTransferrableBlock({
          ownerCompanyId: PD_COMPANY_ID,
          creditAmount: 1000,
          accountType: "Holding",
          authorizationPurpose: "UseTowardsNDC",
        });

        // Phase 1 — PD initiates retirement of 200 credits. The
        // cross-border type requires country + organizationName (see
        // CreditRetireRequestDto ValidateIf); we pass them always to
        // keep the loop uniform.
        const { retirementId } = await performRetireAction(apiPd, {
          blockId: seeded.creditBlockId,
          retirementType,
          amount: 200,
          country: "DE",
          organizationName: "Test Org",
        });
        expect(retirementId).toBeTruthy();

        // Replicator bypass: insert the pending credit_transactions_entity
        // row phase 2 needs to look up by transactionId. The row's
        // senderId must match the owner (service :307-317 loads the
        // sender company to check SUSPENDED state; failure on lookup
        // 500s).
        seedPendingRetirementTransactionDirect({
          transactionId: String(retirementId),
          creditBlockId: seeded.creditBlockId,
          projectRefId: seeded.projectRefId,
          senderCompanyId: PD_COMPANY_ID,
          amount: 200,
          retirementType: RETIREMENT_TYPE_WIRE[retirementType],
        });

        // Phase 2 — DNA ACCEPT. This drives the ledger update that
        // applies mapRetirementTypeToAccountType to the derived block.
        await approveRetireRequest(apiDna, String(retirementId));

        // Assert: read all ledger rows for this project. After a split,
        // there are two distinct creditBlockIds: the parent (balance
        // 800, accountType Holding) and the derived retirement block
        // (amount 200, accountType=<expected>). We find the retirement
        // block by ownerCompanyId=0 (the retire/split branch sets this
        // at programme-ledger.service.ts:913-914).
        const blocks = readLedgerBlocksByProject(seeded.projectRefId);
        const retirementBlock = blocks.find(
          (b) => Number(b.ownerCompanyId) === 0
        );
        expect(retirementBlock).toBeDefined();
        expect(retirementBlock!.accountType).toBe(
          EXPECTED_ACCOUNT_TYPE[retirementType]
        );
        expect(Number(retirementBlock!.creditAmount)).toBe(200);
      });
    }
  });

  // ------------------------------------------------------------------
  // Gap #6 Major — retirement overdraw. Service guards at:
  //   - createRetireRequest RDBMS check at service :230-241 (compares
  //     creditAmount - reservedCreditAmount against request amount).
  //   - addRetireRequest ledger check at programme-ledger.service.ts
  //     :710-721 (same comparison, but on the ledger-fresh block).
  //
  // Both throw HttpException. createRetireRequest's outer try/catch at
  // :275-277 wraps any HttpException as 400, so the client-visible
  // status is 400 regardless of which guard trips.
  // ------------------------------------------------------------------
  test("retire of 500 from a 100-credit block is rejected with 400", async ({
    apiPd,
  }) => {
    const seeded = seedTransferrableBlock({
      ownerCompanyId: PD_COMPANY_ID,
      creditAmount: 100,
      accountType: "Holding",
    });

    const res = await apiPd.post(
      "national/creditTransactionsManagement/retireRequest",
      {
        blockId: seeded.creditBlockId,
        amount: 500,
        retirementType: "Voluntary Cancellations",
      }
    );

    expect(res.ok()).toBe(false);
    expect(res.status()).toBe(400);

    // Lock the no-mutation invariant: the ledger block's
    // reservedCreditAmount must still be 0 after the rejected request.
    // (The overdraw guard runs before any ledger write, so this reads
    // the seeded state unchanged.)
    const ledgerBlock = readLedgerCreditBlock(seeded.creditBlockId);
    expect(ledgerBlock).not.toBeNull();
    expect(Number(ledgerBlock!.reservedCreditAmount)).toBe(0);
    expect(Number(ledgerBlock!.creditAmount)).toBe(100);
  });

  // ------------------------------------------------------------------
  // Gap #9 Major — retirement from a fully-retired block. Two retire
  // requests back-to-back: the first reserves the full balance (so the
  // ledger block's reservedCreditAmount equals creditAmount, i.e. 0
  // spendable credits remain). The second request must be rejected by
  // the ledger guard at programme-ledger.service.ts:710-721 because
  // (creditAmount - reservedCreditAmount) = 0 < 1.
  //
  // Note: we stop at phase 1 for the second request — no need to
  // approve. The overdraw guard rejects the *request* before any
  // reservation is recorded.
  // ------------------------------------------------------------------
  test("retire from a block with 0 spendable credits is rejected with 400", async ({
    apiPd,
  }) => {
    const seeded = seedTransferrableBlock({
      ownerCompanyId: PD_COMPANY_ID,
      creditAmount: 100,
      accountType: "Holding",
    });

    // Phase 1a: reserve the full 100.
    await performRetireAction(apiPd, {
      blockId: seeded.creditBlockId,
      retirementType: "VOLUNTARY_CANCELLATIONS",
      amount: 100,
      remarks: `first retire ${uniqueSuffix()}`,
    });

    // Phase 1b: try to retire 1 more credit. The RDBMS check at
    // createRetireRequest :230-241 sees the un-replicated state
    // (creditAmount=100, reservedCreditAmount=0) and waves this past;
    // the subsequent ledger check at addRetireRequest :710-721 reads
    // the updated ledger (reservedCreditAmount=100) and throws.
    // Either way the outer try/catch at service :275-277 returns 400.
    const res = await apiPd.post(
      "national/creditTransactionsManagement/retireRequest",
      {
        blockId: seeded.creditBlockId,
        amount: 1,
        retirementType: "Voluntary Cancellations",
      }
    );
    expect(res.ok()).toBe(false);
    expect(res.status()).toBe(400);
  });

  // ------------------------------------------------------------------
  // CASL matrix completion (audit gap #22 Minor): a PD belonging to
  // Company B must not be able to retire a block owned by Company A.
  // The fixtures only expose `apiPd` for Org 2 (companyId=1); for the
  // second PD we mint a raw client via createApiClient against
  // palinda+dev2@xeptagon.com (Org 3, companyId=3 — verified by the
  // credit-transfer.spec.ts header).
  //
  // createRetireRequest's service guard at
  // credit-transactions-management.service.ts:186-197 requires the
  // caller to own the block (PROJECT_DEVELOPER + matching companyId
  // on the block). The outer try/catch at :275-277 wraps any
  // HttpException as 400, so the client-visible status is 4xx
  // regardless of whether the rejection lands as 400 (service guard)
  // or 403 (CASL Read-Retirement).
  // ------------------------------------------------------------------
  test("PD-A cannot retire PD-B's block (CASL Retirement)", async () => {
    // Block owned by PD-A (companyId=1).
    const seeded = seedTransferrableBlock({
      ownerCompanyId: PD_COMPANY_ID,
      creditAmount: 1000,
      accountType: "Holding",
    });

    const apiPdB = await createApiClient({
      email: "palinda+dev2@xeptagon.com",
      password: "123",
    });
    try {
      const res = await apiPdB.post(
        "national/creditTransactionsManagement/retireRequest",
        {
          blockId: seeded.creditBlockId,
          amount: 50,
          retirementType: "Voluntary Cancellations",
        }
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBeGreaterThanOrEqual(400);
      expect(res.status()).toBeLessThan(500);
    } finally {
      await apiPdB.request.dispose();
    }
  });
});
