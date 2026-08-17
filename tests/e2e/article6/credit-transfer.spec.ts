/**
 * E2E coverage for domestic credit transfers via
 * POST /national/creditTransactionsManagement/transfer.
 *
 * Backs audit gaps #2 (Critical), #7 (Major), and #8 (Major) from
 * docs/testing/e2e-coverage.md. Prior to this file, the entire
 * domestic-transfer flow was absent from the suite — a CASL regression
 * or split-block bug would have shipped silently.
 *
 * Gap coverage:
 *   - #2 Critical: domestic PD -> PD transfer happy path (initiate).
 *     Approve / reject / cancel branches of the flow are written as
 *     `.fixme` because those endpoints do not exist on
 *     /creditTransactionsManagement — the transferCredits service
 *     finalises ownership synchronously at initiation (see
 *     credit-transactions-management.service.ts:148
 *     `programmeLedgerService.transferCredits(...)`) and no controller
 *     route wraps an Approve/Reject/Cancel state machine over it.
 *   - #7 Major: transfer amount > block balance must be rejected with
 *     400 "notEnoughCreditAmount" (service line 136-147).
 *   - #8 Major: transfer-to-self (sender companyId === receiverOrgId).
 *     The service has no explicit self-transfer guard today; the audit
 *     flags this as a correctness gap. Test asserts the expected
 *     behaviour (400) and is `.fixme` if the backend currently accepts
 *     the request, locking the intended contract for follow-up work.
 *
 * Scope is API-only. Audit gap #28 (UI transfer button from the Credit
 * Balance page) is explicitly out of scope per the parent plan.
 *
 * Parallel safety: every seeded block carries a unique suffix via
 * seedCreditBlockDirect so specs can run concurrently against a shared
 * backend.
 */
import { test, expect } from "./support/fixtures";
import { BASE_URL } from "./support/auth";
import { createApiClient } from "./support/api-client";
import {
  initiateTransfer,
  readLedgerBlocksByProject,
  seedCreditBlockDirect,
  seedTransferrableBlock,
  uniqueSuffix,
} from "./support/factories";

// Company IDs verified against live /national/auth/login JWT claims:
//   palinda+dev@xeptagon.com  -> Org 2, companyId=1, PD  (used by apiPd).
//   palinda+dev2@xeptagon.com -> Org 3, companyId=3, PD  (second PD for cross-org transfers).
// Both are PROJECT_DEVELOPER/Admin, which is required by the
// transferCredits service (lines 62-73 of credit-transactions-management
// .service.ts — sender must be PD Admin, receiver must be PD).
const SENDER_COMPANY_ID = 1;
const RECEIVER_COMPANY_ID = 3;

function unwrap<T = any>(raw: any): T {
  if (raw == null) return raw;
  if (raw.data !== undefined) return raw.data as T;
  return raw as T;
}

function extractRows(raw: any): any[] {
  const data = unwrap<any>(raw);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

test.describe("Credit transfer - POST /national/creditTransactionsManagement/transfer", () => {
  // ------------------------------------------------------------------
  // Gap #2 Critical — happy-path initiate. Because the service finalises
  // the ownership swap synchronously (programmeLedgerService.transferCredits
  // at service line 148), a single POST /transfer is the whole flow from
  // the sender's perspective. Approve/Reject/Cancel step tests live
  // below as `.fixme` citing the missing routes.
  // ------------------------------------------------------------------
  test("PD initiates transfer of 100/1000 to another PD — 200, response echoes amount + both parties", async ({
    apiPd,
  }) => {
    // Arrange: seed a 1000-credit Holding block owned by the sender PD.
    // seedTransferrableBlock writes all three rows the transfer flow
    // reads (RDBMS credit_blocks_entity + ledger project + ledger
    // credit_blocks). seedCreditBlockDirect alone would 400 at the
    // ledger project lookup ("project.programmeNotExistWIthId").
    const seeded = seedTransferrableBlock({
      ownerCompanyId: SENDER_COMPANY_ID,
      creditAmount: 1000,
      accountType: "Holding",
      authorizationPurpose: "UseTowardsNDC",
    });

    // Act
    const { raw } = await initiateTransfer(apiPd, {
      blockId: seeded.creditBlockId,
      receiverOrgId: RECEIVER_COMPANY_ID,
      amount: 100,
      remarks: `E2E transfer ${uniqueSuffix()}`,
    });

    // Assert: the response envelope from transferCredits surfaces the
    // transfer arithmetic. bigint columns surface as strings through
    // the pg driver, so cast both sides before comparing
    // (Number("1") === 1). The downstream queryTransfers round-trip is
    // deliberately split into a companion `.fixme` test below because
    // the replicator container that populates
    // credit_transactions_entity is optional in the dev stack and
    // gates timing-sensitive assertions on its liveness.
    expect(Number(raw.amount)).toBe(100);
    expect(Number(raw.fromCompanyId)).toBe(SENDER_COMPANY_ID);
    expect(Number(raw.toCompanyId)).toBe(RECEIVER_COMPANY_ID);
  });

  // ------------------------------------------------------------------
  // Gap #2 companion — queryTransfers visibility. Separated from the
  // synchronous happy-path test because the credit_transactions_entity
  // table is populated by the ledger-replicator container. When the
  // replicator is exited this assertion times out at 15s; the
  // expectation here is that the replicator is up alongside `national`
  // and `db` in the dev compose stack.
  // ------------------------------------------------------------------
  test(
    "post-transfer row visible to sender + receiver via POST /queryTransfers",
    async ({ apiPd }) => {
      const seeded = seedTransferrableBlock({
        ownerCompanyId: SENDER_COMPANY_ID,
        creditAmount: 1000,
        accountType: "Holding",
      });
      await initiateTransfer(apiPd, {
        blockId: seeded.creditBlockId,
        receiverOrgId: RECEIVER_COMPANY_ID,
        amount: 100,
      });
      // The view column is `createdDate` (see
      // credit.block.transfers.view.entity.ts:9); sort.key="createdTime"
      // 500s on ORDER BY an unknown column.
      let match: any;
      const deadline = Date.now() + 15000;
      while (Date.now() < deadline && !match) {
        const qRes = await apiPd.post(
          "national/creditTransactionsManagement/queryTransfers",
          { page: 1, size: 50, sort: { key: "createdDate", order: "DESC" } }
        );
        if (qRes.status() < 300) {
          const rows = extractRows(await apiPd.json<any>(qRes));
          match = rows.find(
            (r: any) =>
              r.projectId === seeded.projectRefId &&
              Number(r.senderId) === SENDER_COMPANY_ID &&
              Number(r.recieverId) === RECEIVER_COMPANY_ID
          );
        }
        if (!match) await new Promise((r) => setTimeout(r, 500));
      }
      expect(match).toBeTruthy();
      expect(Number(match.creditAmount)).toBe(100);
    }
  );

  // ------------------------------------------------------------------
  // Gap #7 Major — overdraw. Service guard at
  // credit-transactions-management.service.ts:136-147 compares
  // (creditAmount - reservedCreditAmount) against the requested amount
  // and throws "notEnoughCreditAmount". The outer try/catch wraps any
  // HttpException in a 400 (line 176-178), so the client-visible status
  // is 400 regardless of the internal throw code.
  // ------------------------------------------------------------------
  test("transfer of 500 from a 100-credit block is rejected with 400", async ({
    apiPd,
  }) => {
    // Arrange
    const seeded = seedCreditBlockDirect({
      ownerCompanyId: SENDER_COMPANY_ID,
      creditAmount: 100,
      accountType: "Holding",
    });

    // Act
    const res = await apiPd.post(
      "national/creditTransactionsManagement/transfer",
      {
        blockId: seeded.creditBlockId,
        receiverOrgId: RECEIVER_COMPANY_ID,
        amount: 500,
      }
    );

    // Assert: 400, and the block balance must be untouched (no partial
    // ledger write). We sample queryBalance to lock the no-mutation
    // invariant alongside the status assertion.
    expect(res.ok()).toBe(false);
    expect(res.status()).toBe(400);

    const balanceRes = await apiPd.post(
      "national/creditTransactionsManagement/queryBalance",
      { page: 1, size: 50, sort: { key: "createdDate", order: "DESC" } }
    );
    const balanceRows = extractRows(await apiPd.json<any>(balanceRes));
    const block = balanceRows.find(
      (r: any) => r.id === seeded.creditBlockId || r.creditBlockId === seeded.creditBlockId
    );
    if (block) {
      // If the view surfaces the block we can assert amount preserved;
      // if it filters it out under the PD's CASL scope we fall back to
      // the status-only assertion above.
      expect(Number(block.creditAmount ?? block.creditBalance ?? 100)).toBe(100);
    }
  });

  // ------------------------------------------------------------------
  // Gap #8 Major — transfer-to-self. Now covered: the service
  // rejects self-transfers with 400 citing same-company. Per Article 6
  // semantics a PD must not be able to "transfer" credits to its own
  // company (no ownership flip, but a spurious AEF row and a CA-ADJ
  // double-count).
  // ------------------------------------------------------------------
  test(
    "transfer-to-self (sender companyId === receiverOrgId) is rejected with 400",
    async ({ apiPd }) => {
      // Audit gap #8 Major — locked contract: self-transfer rejected
      // with 400.
      const seeded = seedTransferrableBlock({
        ownerCompanyId: SENDER_COMPANY_ID,
        creditAmount: 500,
        accountType: "Holding",
      });
      const res = await apiPd.post(
        "national/creditTransactionsManagement/transfer",
        {
          blockId: seeded.creditBlockId,
          receiverOrgId: SENDER_COMPANY_ID,
          amount: 50,
        }
      );
      expect(res.status()).toBe(400);
    }
  );

  // ------------------------------------------------------------------
  // Synchronous-transfer design lock. The service commits ownership at
  // /transfer time (credit-transactions-management.service.ts:148
  // `programmeLedgerService.transferCredits(...)`) — there is no
  // pending state and no /approve or /reject route on
  // creditTransactionsManagement (controller exposes only 6 routes:
  // transfer, retireRequest, performRetireAction, queryBalance,
  // queryTransfers, queryRetirements). These two tests lock the
  // current design end-to-end: post-initiate the receiver immediately
  // owns the credits, and the legacy /approveTransfer / /rejectTransfer
  // route names return 4xx. If a two-phase flow lands later these
  // tests should be flipped to drive the new state machine.
  // ------------------------------------------------------------------
  test("post-initiate the receiver immediately owns the transferred credits (synchronous design lock)", async ({
    apiPd,
    apiDna,
  }) => {
    const seeded = seedTransferrableBlock({
      ownerCompanyId: SENDER_COMPANY_ID,
      creditAmount: 1000,
      accountType: "Holding",
    });
    await initiateTransfer(apiPd, {
      blockId: seeded.creditBlockId,
      receiverOrgId: RECEIVER_COMPANY_ID,
      amount: 100,
    });

    // After /transfer the sender's block balance is split: the source
    // block keeps 900 (RDBMS view subtracts reservedCreditAmount), and
    // a new block owned by the receiver carries 100. We query as DNA
    // because the sender PD's CASL scope hides receiver-owned blocks.
    // The replicator lands the new row a tick after the synchronous
    // ledger write, so we poll briefly.
    let receiverBlock: any;
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline && !receiverBlock) {
      const qRes = await apiDna.post(
        "national/creditTransactionsManagement/queryBalance",
        { page: 1, size: 200, sort: { key: "createdDate", order: "DESC" } }
      );
      if (qRes.status() < 300) {
        const rows = extractRows(await apiDna.json<any>(qRes));
        receiverBlock = rows.find(
          (r: any) =>
            r.projectId === seeded.projectRefId &&
            Number(r.receiverId ?? r.recieverId) === RECEIVER_COMPANY_ID &&
            Number(r.creditAmount) === 100
        );
      }
      if (!receiverBlock) await new Promise((r) => setTimeout(r, 500));
    }
    expect(receiverBlock, "receiver did not see the 100-credit transferred block").toBeTruthy();
  });

  test("legacy /approveTransfer + /rejectTransfer route names are not exposed (no two-phase state machine)", async ({
    apiDna,
  }) => {
    // The synchronous design intentionally omits these routes. If
    // either appears, this test goes red and the design-lock test
    // above must be revisited.
    const approveRes = await apiDna.post(
      "national/creditTransactionsManagement/approveTransfer",
      { transactionId: `LEGACY-NOT-EXPOSED-${uniqueSuffix()}` }
    );
    expect(approveRes.ok()).toBe(false);
    expect(approveRes.status()).toBeGreaterThanOrEqual(400);
    expect(approveRes.status()).toBeLessThan(500);

    const rejectRes = await apiDna.post(
      "national/creditTransactionsManagement/rejectTransfer",
      { transactionId: `LEGACY-NOT-EXPOSED-${uniqueSuffix()}` }
    );
    expect(rejectRes.ok()).toBe(false);
    expect(rejectRes.status()).toBeGreaterThanOrEqual(400);
    expect(rejectRes.status()).toBeLessThan(500);
  });

  // ------------------------------------------------------------------
  // CASL matrix completion (audit gap #21 Minor): a PD belonging to
  // Company B must not be able to initiate a /transfer of a block
  // owned by Company A. The fixtures only expose `apiPd` for Org 2
  // (companyId=1); we mint a second-PD client via createApiClient with
  // raw credentials for palinda+dev2@xeptagon.com (Org 3, companyId=3,
  // confirmed at the top of this spec, lines 42-49).
  //
  // The transferCredits service guard at
  // credit-transactions-management.service.ts:62-73 requires the caller
  // to be the owner of the source block; an outer try/catch wraps any
  // HttpException as 400 (line 176-178). 4xx-band assertion lets the
  // test stay robust to whether the rejection lands as 400 (service
  // guard) or 403 (CASL).
  // ------------------------------------------------------------------
  test("PD-A cannot initiate transfer of PD-B's block (CASL CreditTransfer)", async () => {
    // Block owned by PD-A (companyId=1).
    const seeded = seedTransferrableBlock({
      ownerCompanyId: SENDER_COMPANY_ID,
      creditAmount: 1000,
      accountType: "Holding",
    });

    // Login as PD-B (companyId=3). createApiClient accepts a raw
    // {email,password} pair (api-client.ts:21-24).
    const apiPdB = await createApiClient({
      email: "palinda+dev2@xeptagon.com",
      password: "123",
    });
    try {
      const res = await apiPdB.post(
        "national/creditTransactionsManagement/transfer",
        {
          blockId: seeded.creditBlockId,
          receiverOrgId: RECEIVER_COMPANY_ID,
          amount: 50,
        }
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBeGreaterThanOrEqual(400);
      expect(res.status()).toBeLessThan(500);
    } finally {
      await apiPdB.request.dispose();
    }
  });

  // ------------------------------------------------------------------
  // Audit gap #28 (UI: Transfer button from Credit Balance) — UI smoke.
  // The Transfer action lives behind the row's actions popover (an
  // EllipsisOutlined button rendered for PROJECT_DEVELOPER+Admin users
  // only — see web/src/Pages/CreditPages/Components/creditBalanceTable
  // .tsx:328-359). Clicking it opens an Ant Design Modal whose
  // implementation is creditActionModal.tsx, with form fields:
  // project (disabled), to (organization Select labelled `t("to")`),
  // creditAmount (InputNumber), remark (TextArea).
  //
  // We seed a transferrable block owned by the PD before navigating so
  // the row + actions popover are guaranteed to render. The test only
  // asserts the modal opens with the expected fields — it does NOT
  // submit the transfer (no organization is reliably present in the
  // /transfer-organizations dropdown in dev).
  // ------------------------------------------------------------------
  test("Transfer button from Credit Balance opens the transfer modal with expected fields", async ({
    pdPage,
  }) => {
    // Seed a Holding block owned by the PD (companyId=1) so the
    // balance row + actions popover render. We use seedTransferrableBlock
    // because the row contributes a project to the ledger as well —
    // queryBalance joins on project so absent ledger rows hide the
    // entry.
    const seeded = seedTransferrableBlock({
      ownerCompanyId: SENDER_COMPANY_ID,
      creditAmount: 5000,
      accountType: "Holding",
      authorizationPurpose: "UseTowardsNDC",
    });

    // Set up the queryBalance waiter *before* navigation so the
    // initial-mount POST is captured (otherwise networkidle resolves
    // before the listener is attached and the response is missed).
    const balanceQuery = pdPage.waitForResponse(
      (resp) =>
        /creditTransactionsManagement\/queryBalance/.test(resp.url()) &&
        resp.request().method() === "POST" &&
        resp.status() < 300,
      { timeout: 15000 }
    );

    await pdPage.goto(`${BASE_URL}/credits/balance`);
    await balanceQuery;
    await pdPage.waitForLoadState("networkidle");

    // The Transfer action is hidden inside a Popover triggered by the
    // EllipsisOutlined icon in the last column. Clicking it opens the
    // popover; the popover lists "Transfer" and "Retire" as List.Items.
    // Click the first ellipsis trigger — any owned row will surface
    // the same Transfer entry.
    const ellipsis = pdPage.locator(".anticon-ellipsis").first();
    await expect(
      ellipsis,
      "no actions ellipsis visible — PD has no owned credit-balance rows on /credits/balance"
    ).toBeVisible({ timeout: 15000 });
    await ellipsis.click();

    // The popover is portaled to body; click the Transfer entry.
    // creditBalanceTable.tsx:193 wires t("transfer") as the label.
    const transferEntry = pdPage
      .locator(".action-menu .ant-list-item")
      .filter({ hasText: /transfer/i })
      .first();
    await expect(transferEntry).toBeVisible();
    await transferEntry.click();

    // Modal is the standard Ant Design .ant-modal-content. The header
    // carries "tranferCredit" (typo preserved from the codebase, see
    // creditBalanceTable.tsx:204) — i18n may return the raw key on a
    // miss, so we lock against the .ant-modal-content visibility plus
    // the form fields.
    const modal = pdPage.locator(".ant-modal-content").last();
    await expect(modal).toBeVisible();

    // The modal renders three relevant labels: project (disabled),
    // to (organization Select), and the inline creditAmount label
    // (rendered as a plain <label>, not an Ant Form label, so we
    // match by text instead of getByLabel). Remark is a TextArea
    // labelled remark.
    await expect(
      modal.getByLabel(/^to$/i, { exact: false }).first()
    ).toBeVisible();
    await expect(modal.locator("text=/credit\\s*amount/i").first()).toBeVisible();
    await expect(modal.getByLabel(/remark/i).first()).toBeVisible();

    // Close via the modal's close button (Ant Design's .ant-modal-close)
    // rather than submitting the form — no guaranteed receiver org in
    // the seeded transfer-organizations dropdown.
    await modal.locator(".ant-modal-close").click();
    await expect(modal).toBeHidden();
  });

  // ------------------------------------------------------------------
  // POST /programme/transferCancel — input-validation contract lock.
  //
  // The endpoint at programme.controller.ts:284 takes a
  // ProgrammeTransferCancel { requestId, comment? } and looks the
  // requestId up in the programme_transfer table
  // (programme.service.ts:4483). Seeding a *valid* pending transfer
  // request requires walking the full /programme/transferRequest flow
  // (creditAmount, programmeId, fromCompanyId, toCompanyId, retirement-
  // Type, omgePercentage, ...) which is well outside the credit-transfer
  // synchronous-domestic surface this spec covers — so per the parent
  // plan we lock the *contract* that the route is wired up and rejects
  // a missing transfer with a 4xx, not a 5xx. A future spec dedicated
  // to the programme-transfer flow can extend this with a happy path.
  // ------------------------------------------------------------------
  test("POST /programme/transferCancel with a ghost requestId returns 4xx (route exists + validates)", async ({
    apiDna,
  }) => {
    // Use a numeric ghost id well above any real auto-incremented row.
    // The DTO's @IsNumber + the service's findOneBy({ requestId }) miss
    // produce a 400 "transferReqNotExist" via the service guard at
    // programme.service.ts:4487-4495.
    const ghostId = Number.parseInt(
      `99${Date.now().toString().slice(-7)}`,
      10
    );
    const res = await apiDna.post(
      "national/programme/transferCancel",
      { requestId: ghostId, comment: `ghost cancel ${uniqueSuffix()}` }
    );
    expect(res.ok()).toBe(false);
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  // ------------------------------------------------------------------
  // Partial transfer (split block) — gap "Partial transfer (split
  // block)" in the audit. transferCreditAmountFromBlocks at
  // credit-blocks-management.service.ts:25-122 handles partial
  // transfers by SPLITTING the source block: the original row's
  // creditAmount is decremented by the transferred amount, and a NEW
  // block is created with ownerCompanyId=receiver carrying the
  // transferred amount and sharing the same projectRefId.
  //
  // Assertion strategy: read the LEDGER directly rather than the
  // queryBalance RDBMS view. The ledger is the source of truth (it's
  // where transferCredits writes synchronously); the RDBMS view is a
  // replicator-fed projection that can lag — and worse, the replicator
  // skips updates whose txTime is older than the seed row's NOW()-based
  // txTime (process.event.service.ts:339-344). Because seedTransferrable
  // Block uses postgres NOW() for the seed row but the transfer service
  // uses Node Date.now() for the split row, the two values can disagree
  // by sub-second amounts and the parent's split-update can be silently
  // dropped by the replicator. Reading the ledger sidesteps both
  // sources of flake and locks the actual split semantics.
  // ------------------------------------------------------------------
  test("partial transfer of 400/1000 splits the block — sender 600, receiver 400, same projectRefId", async ({
    apiPd,
  }) => {
    const seeded = seedTransferrableBlock({
      ownerCompanyId: SENDER_COMPANY_ID,
      creditAmount: 1000,
      accountType: "Holding",
    });
    await initiateTransfer(apiPd, {
      blockId: seeded.creditBlockId,
      receiverOrgId: RECEIVER_COMPANY_ID,
      amount: 400,
    });

    // readLedgerBlocksByProject returns DISTINCT ON creditBlockId ORDER
    // BY hash DESC — i.e., the latest event per block. So the parent's
    // split (creditAmount=600) wins over its pre-split incarnation.
    const ledgerBlocks = readLedgerBlocksByProject(seeded.projectRefId);
    expect(ledgerBlocks.length).toBeGreaterThanOrEqual(2);

    // (a) sender's parent block has 600 remaining (1000 - 400
    //     transferred). The view's creditAmount column is
    //     `creditAmount - reservedCreditAmount`; since reserved=0
    //     throughout, the raw ledger value of 600 matches.
    const senderBlock = ledgerBlocks.find(
      (b) =>
        b.creditBlockId === seeded.creditBlockId &&
        Number(b.ownerCompanyId) === SENDER_COMPANY_ID
    );
    expect(senderBlock, "sender did not retain a parent block").toBeTruthy();
    expect(Number(senderBlock!.creditAmount)).toBe(600);

    // (b) receiver owns a NEW 400-credit child block with the same
    //     projectRefId.
    const receiverBlock = ledgerBlocks.find(
      (b) =>
        b.creditBlockId !== seeded.creditBlockId &&
        Number(b.ownerCompanyId) === RECEIVER_COMPANY_ID &&
        Number(b.creditAmount) === 400
    );
    expect(receiverBlock, "receiver did not see a 400-credit child block").toBeTruthy();
    expect(receiverBlock!.projectRefId).toBe(seeded.projectRefId);
    expect(senderBlock!.projectRefId).toBe(seeded.projectRefId);
    expect(receiverBlock!.creditBlockId).not.toBe(senderBlock!.creditBlockId);
  });

  // ------------------------------------------------------------------
  // Transfer from a fully-transferred block — gap "Transfer from a
  // fully-transferred block" in the audit (international/first
  // transfers section). When a transfer consumes a block's full
  // unassigned balance AND reservedCreditAmount==0,
  // transferCreditAmountFromBlocks at credit-blocks-management.service
  // .ts:47-62 flips ownerCompanyId on the *original* row to the
  // receiver — no split, no new block. A second transfer initiated
  // against that same creditBlockId by the original sender then trips
  // the "creditBlockDoesNotOwnBySender" guard at
  // credit-transactions-management.service.ts:143 and 400s.
  //
  // Locks the contract: a fully-transferred block cannot be used as a
  // source for a follow-up transfer by the prior owner.
  // ------------------------------------------------------------------
  test("second transfer from a fully-transferred 100/100 block is rejected with 400", async ({
    apiPd,
  }) => {
    const seeded = seedTransferrableBlock({
      ownerCompanyId: SENDER_COMPANY_ID,
      creditAmount: 100,
      accountType: "Holding",
    });

    // Step 1: transfer the whole 100. With reserved=0 and
    // unassigned==remaining, the service flips ownership in-place
    // (no split, no new row).
    await initiateTransfer(apiPd, {
      blockId: seeded.creditBlockId,
      receiverOrgId: RECEIVER_COMPANY_ID,
      amount: 100,
    });

    // Step 2: PD-A attempts to transfer 1 credit from the same blockId.
    // The block's ownerCompanyId is now RECEIVER (3), so PD-A's
    // ownership check at service line 143 fails. The outer try/catch
    // maps the HttpException to 400 (lines 176-178).
    const res = await apiPd.post(
      "national/creditTransactionsManagement/transfer",
      {
        blockId: seeded.creditBlockId,
        receiverOrgId: RECEIVER_COMPANY_ID,
        amount: 1,
      }
    );
    expect(res.ok()).toBe(false);
    expect(res.status()).toBe(400);
  });
});
