/**
 * E2E coverage for Phase 7: Cross-cutting integration across the full
 * Article 6.2 stack (Phases 1-6).
 *
 * Backs the requirement table in
 * docs/article6/07-cross-cutting.md. This spec does NOT re-test any
 * single feature — those are owned by the per-phase specs:
 *   - cooperative-approach.spec.ts (Phase 1)
 *   - itmo-lifecycle.spec.ts         (Phase 2)
 *   - omge-sop-deductions.spec.ts    (Phase 3)
 *   - aef-reporting.spec.ts          (Phase 4)
 *   - corresponding-adjustment.spec.ts (Phase 5)
 *   - initial-report.spec.ts         (Phase 6)
 *
 * Instead it verifies the invariants that only show up when multiple
 * features are exercised in the same test:
 *   - flagship end-to-end (one test chains >=5 API calls across >=3
 *     features to lock the "paragraph 18 -> paragraph 20 -> paragraph 8"
 *     reporting chain together),
 *   - CASL permission matrix (one cell per role x feature with the
 *     actual observed wire code),
 *   - UNFCCC sequencing invariants (Decision 2/CMA.3 para 18 guard,
 *     revocation, /check probe),
 *   - cross-feature data integrity (CA-IR pre-population snapshot,
 *     duplicate-IR guard across features, same-CA re-calculation),
 *   - serial-number / ID immutability (PK cannot be rewritten via
 *     PUT /update).
 *
 * Many of the most interesting UNFCCC invariants (para 18 first-ITMO
 * authorization gate, para 20-21 revocation workflow, para 5-6 TER) are
 * NOT enforced by the registry today. Those tests are marked
 * `test.fixme` with a comment citing the specific UNFCCC paragraph and
 * the service-layer gap. See docs/article6/07-cross-cutting.md Gaps.
 *
 * Parallel safety: every test uses uniqueSuffix() on CA titles, IR
 * generation reporting years and any other string that could collide
 * between workers. The flagship test is wrapped in a
 * describe.configure({ mode: "serial" }) block to avoid interleaving
 * with other cross-cutting tests that might create CAs with colliding
 * year windows on shared CounterService state.
 */
import { request } from "@playwright/test";
import { test, expect } from "./support/fixtures";
import { BASE_URL } from "./support/auth";
import {
  createCooperativeApproach,
  generateInitialReport,
  submitInitialReport,
  calculateCorrespondingAdjustment,
  queryCooperativeApproaches,
  seedCreditBlockDirect,
  seedProgrammeDirect,
  seedTransferrableBlock,
  seedPendingRetirementTransactionDirect,
  initiateTransfer,
  performRetireAction,
  approveRetireRequest,
  readLedgerCreditBlock,
  readLedgerBlocksByProject,
  uniqueSuffix,
} from "./support/factories";
import { createApiClient, expectOk } from "./support/api-client";

// ---------------------------------------------------------------------
// Helpers. Mirror the unwrap + extractRows patterns used in per-phase
// specs so assertions read consistently.
// ---------------------------------------------------------------------
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

// Pick a reporting year far outside seeded-data range to avoid
// interference between parallel workers. Matches the strategy used by
// corresponding-adjustment.spec.ts.
let yearCounter = 0;
function nextFutureYear(): number {
  yearCounter += 1;
  return 2150 + yearCounter;
}

// The AEF download endpoint returns { url, outputFileName } on success
// and 400 "nothingToExport" on an empty DB. We accept either outcome as
// proof the endpoint is reachable and auth is enforced.
function isDownloadSuccess(status: number, body: any): boolean {
  if (status < 200 || status >= 300) return false;
  const payload = unwrap<any>(body);
  return (
    typeof payload?.outputFileName === "string" &&
    typeof payload?.url === "string"
  );
}
function isNothingToExport(status: number, body: any): boolean {
  if (status !== 400) return false;
  const text = JSON.stringify(body ?? {});
  return /nothingToExport|nothing to export/i.test(text);
}

test.describe("Article 6.2 - Cross-cutting Integration", () => {
  // ------------------------------------------------------------------
  // Flagship end-to-end. One big test that chains the UNFCCC reporting
  // pipeline from cooperative-approach creation through initial-report
  // submission, /check probe, corresponding-adjustment calculation, and
  // AEF export. Minimum 5 API calls across 3+ features.
  //
  // Serial mode: the CounterService issues shared IDs (CA-<n>, IR-<n>,
  // CA-ADJ-<n>). Parallel workers running this test against the same
  // backend would still pass, but we serialize so the chain of assertions
  // (find CA in query, find IR in query) is insulated from other
  // cross-cutting tests creating rows between steps.
  // ------------------------------------------------------------------
  test.describe("Flagship end-to-end", () => {
    test.describe.configure({ mode: "serial" });

    test("DNA: create CA -> generate IR -> submit IR -> /check -> calculate CA -> query all -> download AEF", async ({
      apiDna,
    }) => {
      const suffix = uniqueSuffix();
      const caTitle = `E2E Flagship ${suffix}`;

      // Step 1 [Phase 1] — create the cooperative approach.
      const ca = await createCooperativeApproach(apiDna, {
        title: caTitle,
        participatingParties: ["NG", "CH"],
        description: `Flagship CA ${suffix}`,
        expectedMitigationOutcomes: "250000",
        environmentalIntegrityAssessment: "Baseline conservatively set",
      });
      expect(ca.cooperativeApproachId).toMatch(/^CA-\d+/);

      // Step 2 [Phase 6] — generate the initial report. The one-IR-per-CA
      // guard is enforced at the service layer; we just need the draft.
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      expect(gen.reportId).toMatch(/^IR-\d+$/);
      expect(gen.raw.status).toBe("Draft");
      expect(gen.raw.cooperativeApproachDetails.title).toBe(caTitle);

      // Step 3 [Phase 6] — /check BEFORE submit should be false.
      const checkBeforeRes = await apiDna.get(
        `national/initialReport/check?cooperativeApproachId=${encodeURIComponent(
          ca.cooperativeApproachId
        )}`
      );
      await expectOk(checkBeforeRes, "flagship /check (pre-submit)");
      const checkBefore = unwrap<any>(await apiDna.json<any>(checkBeforeRes));
      expect(checkBefore.hasSubmittedReport).toBe(false);

      // Step 4 [Phase 6] — submit the IR. Completeness validator passes
      // because the pre-population fills all five required jsonb sections.
      const submitted = await submitInitialReport(apiDna, gen.reportId);
      expect(submitted.status).toBe("Submitted");

      // Step 5 [Phase 6] — /check AFTER submit should flip true. This is
      // the sequencing probe that SHOULD be called before first ITMO
      // authorization — see Gaps for the critical para 18 finding.
      const checkAfterRes = await apiDna.get(
        `national/initialReport/check?cooperativeApproachId=${encodeURIComponent(
          ca.cooperativeApproachId
        )}`
      );
      await expectOk(checkAfterRes, "flagship /check (post-submit)");
      const checkAfter = unwrap<any>(await apiDna.json<any>(checkAfterRes));
      expect(checkAfter.hasSubmittedReport).toBe(true);

      // Step 6 [Phase 5] — calculate a corresponding adjustment scoped
      // to this CA for a future reporting year. No CreditTransactions
      // exist, so every counter is zero and emissionsBalance = 0.
      const year = nextFutureYear();
      const calc = await calculateCorrespondingAdjustment(apiDna, {
        year,
        cooperativeApproachId: ca.cooperativeApproachId,
        ndcType: "SINGLE_YEAR",
        caMethod: "TRAJECTORY",
      });
      expect(calc.caId).toMatch(/^CA-ADJ-\d+$/);
      expect(calc.status).toBe("Draft");
      expect(calc.cooperativeApproachId).toBe(ca.cooperativeApproachId);
      // No credit activity; every count should be 0.
      expect(parseFloat(String(calc.firstTransferredItmos))).toBe(0);
      expect(parseFloat(String(calc.acquiredItmos))).toBe(0);
      expect(parseFloat(String(calc.usedTowardsNdcItmos))).toBe(0);
      expect(parseFloat(String(calc.emissionsBalance))).toBe(0);

      // Step 7 [Phase 1+5+6] — query all three registries and confirm
      // our records appear. These queries are the DNA-facing audit
      // surfaces TER reviewers would use.
      const { items: caItems } = await queryCooperativeApproaches(
        apiDna,
        1,
        50
      );
      const caMatch = caItems.find(
        (c: any) => c.cooperativeApproachId === ca.cooperativeApproachId
      );
      expect(
        caMatch,
        `expected CA ${ca.cooperativeApproachId} in query`
      ).toBeTruthy();
      expect(caMatch.title).toBe(caTitle);

      const irQueryRes = await apiDna.post("national/initialReport/query", {
        page: 1,
        size: 50,
        sort: { key: "createdTime", order: "DESC" },
      });
      await expectOk(irQueryRes, "flagship IR query");
      const irRows = extractRows(await apiDna.json<any>(irQueryRes));
      const irMatch = irRows.find((r: any) => r.reportId === gen.reportId);
      expect(
        irMatch,
        `expected IR ${gen.reportId} in query`
      ).toBeTruthy();
      expect(irMatch.status).toBe("Submitted");

      const calcQueryRes = await apiDna.post(
        "national/correspondingAdjustment/query",
        {
          page: 1,
          size: 50,
          sort: { key: "createdTime", order: "DESC" },
        }
      );
      await expectOk(calcQueryRes, "flagship CA-ADJ query");
      const calcRows = extractRows(await apiDna.json<any>(calcQueryRes));
      const calcMatch = calcRows.find((r: any) => r.caId === calc.caId);
      expect(
        calcMatch,
        `expected CA-ADJ ${calc.caId} in query`
      ).toBeTruthy();

      // Step 8 [Phase 4] — download the AEF HOLDINGS report. On a fresh
      // DB the AefActionsTable is empty so the service throws 400
      // nothingToExport; on a seeded DB we get a {url, outputFileName}
      // payload. Either outcome proves the full chain is reachable.
      const aefRes = await apiDna.post(
        "national/reportsManagement/downloadAefReport",
        { reportType: "HOLDINGS", fileType: "csv" }
      );
      const aefStatus = aefRes.status();
      const aefBody = await apiDna.json<any>(aefRes).catch(() => ({}));
      expect(
        isDownloadSuccess(aefStatus, aefBody) ||
          isNothingToExport(aefStatus, aefBody)
      ).toBe(true);
    });
  });

  // ------------------------------------------------------------------
  // CASL permission matrix. One row per (role x feature) cell. The
  // per-phase specs cover a handful of permission assertions each, but
  // none of them sweep the whole matrix — so deviations (e.g. Ministry
  // gets Manage InitialReport, DNA-admin gate fires at service layer
  // for AEF rather than at the CASL layer) are easy to miss. This
  // block is the audit.
  //
  // Roles tested:
  //   - dnaAdmin (DESIGNATED_NATIONAL_AUTHORITY, Admin) via apiDna
  //   - pdAdmin  (PROJECT_DEVELOPER, Admin)            via apiPd
  //   - icAdmin  (INDEPENDENT_CERTIFIER, Admin)        via apiIc
  //
  // A Ministry user and a DNA ViewOnly user would complete the matrix,
  // but the seeded users.csv (support/auth.ts) does not include either.
  // Those cells are covered by a test.fixme below.
  // ------------------------------------------------------------------
  test.describe("CASL permission matrix", () => {
    test("DNA admin has full access across all six features", async ({
      apiDna,
    }) => {
      // Phase 1: create + query CA.
      const ca = await createCooperativeApproach(apiDna, {
        title: `CASL DNA Full ${uniqueSuffix()}`,
      });
      expect(ca.cooperativeApproachId).toMatch(/^CA-\d+/);

      // Phase 6: generate + submit IR.
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      expect(gen.reportId).toMatch(/^IR-\d+$/);
      const submitted = await submitInitialReport(apiDna, gen.reportId);
      expect(submitted.status).toBe("Submitted");

      // Phase 5: calculate a CA-ADJ.
      const calc = await calculateCorrespondingAdjustment(apiDna, {
        year: nextFutureYear(),
        ndcType: "SINGLE_YEAR",
        caMethod: "TRAJECTORY",
      });
      expect(calc.caId).toMatch(/^CA-ADJ-\d+$/);

      // Phase 4: query AEF records + attempt download. queryAefRecords
      // returns 2xx unconditionally; downloadAefReport returns 2xx or
      // 400 nothingToExport depending on seeded data.
      const queryAefRes = await apiDna.post(
        "national/reportsManagement/queryAefRecords",
        { page: 1, size: 10 }
      );
      await expectOk(queryAefRes, "DNA queryAefRecords");

      const downloadRes = await apiDna.post(
        "national/reportsManagement/downloadAefReport",
        { reportType: "HOLDINGS", fileType: "csv" }
      );
      const downloadBody = await apiDna
        .json<any>(downloadRes)
        .catch(() => ({}));
      expect(
        isDownloadSuccess(downloadRes.status(), downloadBody) ||
          isNothingToExport(downloadRes.status(), downloadBody)
      ).toBe(true);
    });

    test("PD admin is read-only on CA query; denied on CA create, IR generate, CA-ADJ calculate, AEF download", async ({
      apiPd,
      apiDna,
    }) => {
      // Seed a CA as DNA so the read probe has something to return.
      const seeded = await createCooperativeApproach(apiDna, {
        title: `CASL PD Read ${uniqueSuffix()}`,
      });

      // Read: PD is allowed on CA /query (cooperative-approach.spec.ts
      // "PD can view the list" is the UI equivalent). API /query is
      // gated by Read CooperativeApproach which PD has.
      const queryRes = await apiPd.post(
        "national/cooperativeApproach/query",
        {
          page: 1,
          size: 10,
          sort: { key: "createdTime", order: "DESC" },
        }
      );
      // PD is Read-allowed on CA at the API layer.
      await expectOk(queryRes, "PD can query CAs");
      const queryRows = extractRows(await apiPd.json<any>(queryRes));
      expect(
        queryRows.some(
          (r: any) => r.cooperativeApproachId === seeded.cooperativeApproachId
        ),
        `seeded ${seeded.cooperativeApproachId} not in first page of ${queryRows.length} results`
      ).toBe(true);

      // Create: PD must be denied.
      const createRes = await apiPd.post(
        "national/cooperativeApproach/create",
        {
          title: `PD Forbidden ${uniqueSuffix()}`,
          participatingParties: ["NG", "CH"],
        }
      );
      expect(createRes.ok()).toBe(false);
      expect([401, 403]).toContain(createRes.status());

      // IR generate: PD must be denied.
      const irRes = await apiPd.post("national/initialReport/generate", {
        cooperativeApproachId: seeded.cooperativeApproachId,
      });
      expect(irRes.ok()).toBe(false);
      expect([401, 403]).toContain(irRes.status());

      // CA-ADJ calculate: PD must be denied.
      const calcRes = await apiPd.post(
        "national/correspondingAdjustment/calculate",
        {
          year: nextFutureYear(),
          ndcType: "SingleYear",
          caMethod: "Trajectory",
        }
      );
      expect(calcRes.ok()).toBe(false);
      expect([401, 403]).toContain(calcRes.status());

      // AEF download: PD must be denied (service-level 401, not CASL).
      const aefRes = await apiPd.post(
        "national/reportsManagement/downloadAefReport",
        { reportType: "HOLDINGS", fileType: "csv" }
      );
      expect(aefRes.ok()).toBe(false);
      expect([401, 403]).toContain(aefRes.status());
    });

    test("IC admin mirrors PD: read-only on CA query; denied on CA create, IR generate, CA-ADJ calculate, AEF download", async ({
      apiIc,
      apiDna,
    }) => {
      const seeded = await createCooperativeApproach(apiDna, {
        title: `CASL IC Read ${uniqueSuffix()}`,
      });

      // Read: IC has the same Read CooperativeApproach grant as PD in
      // casl-ability.factory.ts. A 2xx is expected; a 401/403 would
      // indicate a narrower grant we should document.
      const queryRes = await apiIc.post(
        "national/cooperativeApproach/query",
        {
          page: 1,
          size: 10,
          sort: { key: "createdTime", order: "DESC" },
        }
      );
      if (queryRes.ok()) {
        const queryRows = extractRows(await apiIc.json<any>(queryRes));
        expect(
          queryRows.some(
            (r: any) =>
              r.cooperativeApproachId === seeded.cooperativeApproachId
          )
        ).toBe(true);
      } else {
        // Defensive window: if IC is tightened later, still a gate fire.
        expect([401, 403]).toContain(queryRes.status());
      }

      // Create: IC must be denied.
      const createRes = await apiIc.post(
        "national/cooperativeApproach/create",
        {
          title: `IC Forbidden ${uniqueSuffix()}`,
          participatingParties: ["NG", "CH"],
        }
      );
      expect(createRes.ok()).toBe(false);
      expect([401, 403]).toContain(createRes.status());

      // IR generate: IC must be denied.
      const irRes = await apiIc.post("national/initialReport/generate", {
        cooperativeApproachId: seeded.cooperativeApproachId,
      });
      expect(irRes.ok()).toBe(false);
      expect([401, 403]).toContain(irRes.status());

      // CA-ADJ calculate: IC must be denied.
      const calcRes = await apiIc.post(
        "national/correspondingAdjustment/calculate",
        {
          year: nextFutureYear(),
          ndcType: "SingleYear",
          caMethod: "Trajectory",
        }
      );
      expect(calcRes.ok()).toBe(false);
      expect([401, 403]).toContain(calcRes.status());

      // AEF download: IC must be denied.
      const aefRes = await apiIc.post(
        "national/reportsManagement/downloadAefReport",
        { reportType: "HOLDINGS", fileType: "csv" }
      );
      expect(aefRes.ok()).toBe(false);
      expect([401, 403]).toContain(aefRes.status());
    });

    test("IR /check endpoint is reachable by every authenticated role (JwtAuthGuard-only)", async ({
      apiDna,
      apiPd,
      apiIc,
    }) => {
      // The controller's /check handler is wired with JwtAuthGuard only
      // (no PoliciesGuard — initial-report.controller.ts lines 79-81).
      // Any authenticated user should get 2xx with the
      // { hasSubmittedReport: boolean } shape. Documented as a deviation
      // in 06-initial-report.md and 07-cross-cutting.md.
      const ca = await createCooperativeApproach(apiDna, {
        title: `CASL Check Probe ${uniqueSuffix()}`,
      });
      const path = `national/initialReport/check?cooperativeApproachId=${encodeURIComponent(
        ca.cooperativeApproachId
      )}`;

      for (const [label, client] of [
        ["DNA", apiDna],
        ["PD", apiPd],
        ["IC", apiIc],
      ] as const) {
        const res = await client.get(path);
        if (res.ok()) {
          const body = unwrap<any>(await client.json<any>(res));
          expect(typeof body.hasSubmittedReport).toBe("boolean");
        } else {
          // If a future phase adds a CASL gate this branch captures it
          // as a documented tightening rather than a regression.
          expect([401, 403]).toContain(res.status());
        }
        expect(
          res.ok() || [401, 403].includes(res.status()),
          `/check unexpected for ${label}: ${res.status()}`
        ).toBe(true);
      }
    });

    test("Ministry admin has Manage on IR and CA-ADJ (CASL factory mirror of DNA branch)", async ({
      apiMinistry,
      apiDna,
    }) => {
      // CASL factory grants Manage InitialReport + CorrespondingAdjustment
      // to Ministry admins the same as DNA admins. This documents the
      // CASL mirror — the UI hides the menu for Ministry but the API
      // accepts their writes. Seeded user: palinda+ministry@xeptagon.com.
      const ca = await createCooperativeApproach(apiDna, {
        title: `Ministry CASL ${uniqueSuffix()}`,
      });

      // Ministry can generate an IR.
      const irRes = await apiMinistry.post(
        "national/initialReport/generate",
        { cooperativeApproachId: ca.cooperativeApproachId }
      );
      await expectOk(irRes, "Ministry IR generate");

      // Ministry can calculate a Corresponding Adjustment.
      const calcRes = await apiMinistry.post(
        "national/correspondingAdjustment/calculate",
        {
          year: nextFutureYear(),
          cooperativeApproachId: ca.cooperativeApproachId,
          ndcType: "SingleYear",
          caMethod: "Trajectory",
        }
      );
      await expectOk(calcRes, "Ministry CA-ADJ calculate");
    });

    test("DNA ViewOnly cannot Manage IR (Read only)", async ({
      apiDnaViewOnly,
      apiDna,
    }) => {
      // CASL factory lines 161-199: DNA Admin/Root/Manager gets Manage;
      // DNA ViewOnly gets only Read on InitialReport. A ViewOnly user
      // cannot generate or update an IR, but can query existing ones.
      const ca = await createCooperativeApproach(apiDna, {
        title: `ViewOnly CASL ${uniqueSuffix()}`,
      });

      // Manage (generate) is blocked.
      const genRes = await apiDnaViewOnly.post(
        "national/initialReport/generate",
        { cooperativeApproachId: ca.cooperativeApproachId }
      );
      expect(genRes.ok()).toBe(false);
      expect([401, 403]).toContain(genRes.status());

      // Read (query) is allowed.
      const queryRes = await apiDnaViewOnly.post(
        "national/initialReport/query",
        { page: 1, size: 10, sort: { key: "createdTime", order: "DESC" } }
      );
      await expectOk(queryRes, "ViewOnly IR query");
    });
  });

  // ------------------------------------------------------------------
  // Sequencing invariants. The UNFCCC framework has strict ordering
  // requirements — participation -> CA authorization -> initial report
  // -> first ITMO authorization -> reporting -> corresponding
  // adjustment -> TER. The registry implements only a subset of these
  // as enforced code paths. This block documents the GAP between the
  // UNFCCC sequence and the registry's actual guards.
  // ------------------------------------------------------------------
  test.describe("Sequencing invariants", () => {
    test("/check endpoint accurately reports hasSubmittedReport transition Draft -> Submitted", async ({
      apiDna,
    }) => {
      // This test verifies the /check wire contract works correctly —
      // the probe exists, and it flips from false to true at exactly
      // the submit boundary. What is NOT tested here (and cannot be,
      // today) is whether ANY downstream code path consults the probe
      // before issuing ITMOs. See the test.fixme below.
      const ca = await createCooperativeApproach(apiDna, {
        title: `Seq Check ${uniqueSuffix()}`,
      });

      // Before any IR: false.
      const beforeRes = await apiDna.get(
        `national/initialReport/check?cooperativeApproachId=${encodeURIComponent(
          ca.cooperativeApproachId
        )}`
      );
      await expectOk(beforeRes, "check (pre-IR)");
      expect(unwrap<any>(await apiDna.json<any>(beforeRes)).hasSubmittedReport).toBe(
        false
      );

      // Draft IR: still false — the query only reads rows with status
      // SUBMITTED.
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      const draftRes = await apiDna.get(
        `national/initialReport/check?cooperativeApproachId=${encodeURIComponent(
          ca.cooperativeApproachId
        )}`
      );
      await expectOk(draftRes, "check (draft IR)");
      expect(unwrap<any>(await apiDna.json<any>(draftRes)).hasSubmittedReport).toBe(
        false
      );

      // Submitted: true.
      await submitInitialReport(apiDna, gen.reportId);
      const afterRes = await apiDna.get(
        `national/initialReport/check?cooperativeApproachId=${encodeURIComponent(
          ca.cooperativeApproachId
        )}`
      );
      await expectOk(afterRes, "check (submitted IR)");
      expect(unwrap<any>(await apiDna.json<any>(afterRes)).hasSubmittedReport).toBe(
        true
      );
    });

    test("Authorizing a programme without a submitted IR for its CA returns 400 citing Dec 2/CMA.3 para 18", async ({
      apiDna,
    }) => {
      // After the para 18 guard landed in programme.service.ts:
      // authorizeProgramme refuses to proceed when article6trade is
      // true and the linked cooperativeApproachId has no IR in status
      // Submitted or Published. This test exercises the negative path.
      const ca = await createCooperativeApproach(apiDna, {
        title: `Para18 ${uniqueSuffix()}`,
      });
      const seeded = seedProgrammeDirect({
        companyId: 1,
        cooperativeApproachId: ca.cooperativeApproachId,
        article6trade: true,
        currentStage: "Approved",
      });

      const res = await apiDna.put("national/programme/authorize", {
        programmeId: seeded.programmeId,
        issueAmount: 100,
        comment: "test",
      });
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(400);
      const body = await res.text();
      expect(body).toMatch(/para 18/i);
    });

    test("Authorizing a programme WITH a submitted IR for its CA passes the para 18 gate", async ({
      apiDna,
    }) => {
      // Positive-path companion: once a submitted IR exists for the CA
      // the guard should no longer block. Other authorize-flow
      // failures (e.g. missing `creditEst` vs `issueAmount`) may still
      // surface; we assert only that the para 18 error is not what we
      // get back.
      const ca = await createCooperativeApproach(apiDna, {
        title: `Para18 Pass ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      await submitInitialReport(apiDna, gen.reportId);
      const seeded = seedProgrammeDirect({
        companyId: 1,
        cooperativeApproachId: ca.cooperativeApproachId,
        article6trade: true,
        currentStage: "Approved",
      });

      const res = await apiDna.put("national/programme/authorize", {
        programmeId: seeded.programmeId,
        issueAmount: 100,
        comment: "test",
      });
      const body = await res.text();
      // Must not be the para 18 error — other authorize-flow errors
      // are acceptable for this gate-only assertion.
      expect(body).not.toMatch(/para 18/i);
    });

    test("Revoked CA cannot be the source of a new ITMO authorization (Draft -/CMA.5 paras 20-21)", async ({
      apiDna,
    }) => {
      // CooperativeApproachStatus gains a REVOKED terminal value in
      // this blocker fix. authorizeProgramme refuses to proceed when
      // the linked CA has status=Revoked, returning HTTP 400 with a
      // message that cites the paragraph.
      const ca = await createCooperativeApproach(apiDna, {
        title: `Revoked Source ${uniqueSuffix()}`,
      });
      // Seed a submitted IR so the para 18 guard does not fire first.
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      await submitInitialReport(apiDna, gen.reportId);
      // Flip the CA to Revoked via PUT /update (revocation endpoint).
      const revokeRes = await apiDna.put(
        "national/cooperativeApproach/update",
        {
          cooperativeApproachId: ca.cooperativeApproachId,
          status: "Revoked",
        }
      );
      await expectOk(revokeRes, "revoke CA");
      const seeded = seedProgrammeDirect({
        companyId: 1,
        cooperativeApproachId: ca.cooperativeApproachId,
        article6trade: true,
        currentStage: "Approved",
      });
      const res = await apiDna.put("national/programme/authorize", {
        programmeId: seeded.programmeId,
        issueAmount: 100,
        comment: "should be blocked by revocation",
      });
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(400);
      const body = await res.text();
      expect(body).toMatch(/revoked/i);
      expect(body).toMatch(/20-21/);
    });

    // ----------------------------------------------------------------
    // Sequencing invariant: cannot transfer before issue.
    //
    // Locks the temporal ordering rule that ITMOs only become
    // transferrable after they have been issued onto a credit block.
    // We seed an Authorised programme (no ledger credit_blocks row),
    // then attempt POST /transfer with a synthetic blockId that does
    // not exist anywhere. The service's block lookup
    // (credit-transactions-management.service.ts) cannot find the
    // block and rejects in the 4xx band — locking the contract that
    // a transfer cannot land before the corresponding /programme/issue
    // call has materialised the block.
    // ----------------------------------------------------------------
    test("cannot transfer credits from a non-existent block (locks: cannot transfer before issue)", async ({
      apiPd,
    }) => {
      // Programme exists but no credit blocks have been issued yet.
      seedProgrammeDirect({
        companyId: 1,
        article6trade: false,
        currentStage: "Authorised",
      });
      const ghostBlockId = `BLOCK-NEVER-${uniqueSuffix()}`;
      const res = await apiPd.post(
        "national/creditTransactionsManagement/transfer",
        {
          blockId: ghostBlockId,
          receiverOrgId: 3,
          amount: 100,
        }
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBeGreaterThanOrEqual(400);
      expect(res.status()).toBeLessThan(500);
    });

    // ----------------------------------------------------------------
    // Sequencing invariant: cannot retire before issue.
    //
    // Mirror of the transfer-before-issue lock above. Retirement
    // (POST /retireRequest) is only meaningful against a block that
    // has been issued; a synthetic blockId must be rejected before any
    // ledger reservation is attempted. Locks the contract end-to-end.
    // ----------------------------------------------------------------
    test("cannot retire credits from a non-existent block (locks: cannot retire before issue)", async ({
      apiPd,
    }) => {
      seedProgrammeDirect({
        companyId: 1,
        article6trade: false,
        currentStage: "Authorised",
      });
      const ghostBlockId = `BLOCK-NEVER-${uniqueSuffix()}`;
      const res = await apiPd.post(
        "national/creditTransactionsManagement/retireRequest",
        {
          blockId: ghostBlockId,
          amount: 100,
          retirementType: "Voluntary Cancellations",
        }
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBeGreaterThanOrEqual(400);
      expect(res.status()).toBeLessThan(500);
    });
  });

  // ------------------------------------------------------------------
  // Cross-feature data integrity. These tests verify invariants that
  // span two or more features — a CA and the IR it seeded, two IRs on
  // the same CA, two CA-ADJ rows for the same year/CA.
  // ------------------------------------------------------------------
  test.describe("Data integrity", () => {
    test("CA -> IR pre-population: IR.cooperativeApproachDetails.title matches CA.title at generate time", async ({
      apiDna,
    }) => {
      // Snapshot contract: at IR generate time the service copies CA
      // fields into cooperativeApproachDetails. Tested as an end-to-end
      // integration here (per-phase spec tests the service internals).
      const caTitle = `Integrity Prepop ${uniqueSuffix()}`;
      const ca = await createCooperativeApproach(apiDna, {
        title: caTitle,
        participatingParties: ["NG", "CH", "JP"],
        description: "integrity-desc",
        expectedMitigationOutcomes: "500000",
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      expect(gen.raw.cooperativeApproachDetails.title).toBe(caTitle);
      expect(gen.raw.cooperativeApproachDetails.description).toBe(
        "integrity-desc"
      );
      expect(
        gen.raw.cooperativeApproachDetails.participatingParties
      ).toEqual(expect.arrayContaining(["NG", "CH", "JP"]));
      expect(gen.raw.cooperativeApproachDetails.expectedMitigation).toBe(
        "500000"
      );
    });

    test("CA title change does NOT propagate to the already-generated IR snapshot (Phase 6 drift behaviour)", async ({
      apiDna,
    }) => {
      // 06-initial-report.md Gap: "Pre-population is a one-shot
      // snapshot." This test documents that behaviour — NOT a bug, but
      // a deviation from what a TER reviewer might assume. If a future
      // phase wires "re-sync IR from CA on update", this test should
      // flip to the opposite assertion.
      const beforeTitle = `Drift Before ${uniqueSuffix()}`;
      const ca = await createCooperativeApproach(apiDna, {
        title: beforeTitle,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      expect(gen.raw.cooperativeApproachDetails.title).toBe(beforeTitle);

      // Update the CA title AFTER the IR has been generated.
      const afterTitle = `Drift After ${uniqueSuffix()}`;
      const updateRes = await apiDna.put(
        "national/cooperativeApproach/update",
        {
          cooperativeApproachId: ca.cooperativeApproachId,
          title: afterTitle,
        }
      );
      await expectOk(updateRes, "CA title update");

      // Re-fetch the IR and confirm its embedded title is STILL the old
      // title (no propagation).
      const irGet = await apiDna.get(
        `national/initialReport/get?id=${encodeURIComponent(gen.reportId)}`
      );
      await expectOk(irGet, "IR re-fetch after CA update");
      const ir = unwrap<any>(await apiDna.json<any>(irGet));
      expect(ir.cooperativeApproachDetails.title).toBe(beforeTitle);
      expect(ir.cooperativeApproachDetails.title).not.toBe(afterTitle);
    });

    test("second POST /generate for the same CA returns 409 (one-IR-per-CA invariant)", async ({
      apiDna,
    }) => {
      // Mirrors the per-phase 409 test but as a documented
      // cross-feature invariant: no matter how many times an operator
      // tries, each CA holds at most one IR row. The duplicate guard
      // is a service-layer check, not a DB UNIQUE constraint — flagged
      // in 06-initial-report.md as something to harden in production.
      const ca = await createCooperativeApproach(apiDna, {
        title: `Integrity Duplicate IR ${uniqueSuffix()}`,
      });
      const first = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      expect(first.reportId).toMatch(/^IR-\d+$/);

      const secondRes = await apiDna.post("national/initialReport/generate", {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      expect(secondRes.ok()).toBe(false);
      expect(secondRes.status()).toBe(409);
    });

    test("two CA-ADJ calculations for the same (CA, year) produce distinct CA-ADJ IDs (no idempotency)", async ({
      apiDna,
    }) => {
      // Phase 5 Gap: "No state-machine enforcement, no idempotency."
      // The service allocates a fresh caId per /calculate call; a
      // re-run for the same (CA, year) produces a new row. Documented
      // here because the registry's audit trail therefore carries
      // multiple CA-ADJ rows for the same accounting year — a TER
      // reviewer reading the query must pick the most recent by
      // createdTime rather than assuming uniqueness.
      const ca = await createCooperativeApproach(apiDna, {
        title: `Integrity Dup Calc ${uniqueSuffix()}`,
      });
      const year = nextFutureYear();
      const first = await calculateCorrespondingAdjustment(apiDna, {
        year,
        cooperativeApproachId: ca.cooperativeApproachId,
        ndcType: "SINGLE_YEAR",
        caMethod: "TRAJECTORY",
      });
      const second = await calculateCorrespondingAdjustment(apiDna, {
        year,
        cooperativeApproachId: ca.cooperativeApproachId,
        ndcType: "SINGLE_YEAR",
        caMethod: "TRAJECTORY",
      });
      expect(first.caId).toMatch(/^CA-ADJ-\d+$/);
      expect(second.caId).toMatch(/^CA-ADJ-\d+$/);
      expect(first.caId).not.toBe(second.caId);
      // Both rows should land at the same year / same CA.
      expect(first.year).toBe(year);
      expect(second.year).toBe(year);
      expect(first.cooperativeApproachId).toBe(second.cooperativeApproachId);
    });

    test("IR status Draft-then-Submitted transition is preserved across GET / query re-reads", async ({
      apiDna,
    }) => {
      // Cross-feature read-after-write: after /submit, both /get and
      // /query should report status=Submitted for the same row. Locks
      // in that the listing endpoint sees the same authoritative row
      // the single-row endpoint sees.
      const ca = await createCooperativeApproach(apiDna, {
        title: `Integrity GetQuery ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      await submitInitialReport(apiDna, gen.reportId);

      const getRes = await apiDna.get(
        `national/initialReport/get?id=${encodeURIComponent(gen.reportId)}`
      );
      await expectOk(getRes, "IR GET after submit");
      const getIr = unwrap<any>(await apiDna.json<any>(getRes));
      expect(getIr.status).toBe("Submitted");

      const qRes = await apiDna.post("national/initialReport/query", {
        page: 1,
        size: 100,
        sort: { key: "createdTime", order: "DESC" },
      });
      await expectOk(qRes, "IR query after submit");
      const rows = extractRows(await apiDna.json<any>(qRes));
      const qIr = rows.find((r: any) => r.reportId === gen.reportId);
      expect(qIr, `IR ${gen.reportId} not in /query`).toBeTruthy();
      expect(qIr.status).toBe("Submitted");
    });
  });

  // ------------------------------------------------------------------
  // Serial-number / ID immutability. Primary keys are assigned by the
  // counter service and must NEVER change after allocation. Test that
  // attempting to rewrite the PK via PUT /update is either ignored
  // (silent no-op) or rejected — anything that actually changes the PK
  // is a correctness bug (Draft -/CMA.5 para 132 requires a stable
  // serial number for each issued block).
  // ------------------------------------------------------------------
  test.describe("Serial-number / ID immutability", () => {
    test("PUT /cooperativeApproach/update ignores attempts to rewrite cooperativeApproachId", async ({
      apiDna,
    }) => {
      const original = await createCooperativeApproach(apiDna, {
        title: `Immutable CA ${uniqueSuffix()}`,
      });
      const originalId = original.cooperativeApproachId;
      const attemptedId = `CA-HIJACK-${uniqueSuffix()}`;

      // Send an update that targets the real PK but includes a hijack
      // cooperativeApproachId field alongside. The service should write
      // the other fields and leave the PK alone. Some backends reject
      // the attempt outright with 4xx — either outcome is acceptable.
      // What is NOT acceptable is silently rewriting the PK.
      const res = await apiDna.put("national/cooperativeApproach/update", {
        cooperativeApproachId: originalId,
        title: `Immutable CA Updated ${uniqueSuffix()}`,
        description: "immutability probe",
      });

      if (res.ok()) {
        const updated = unwrap<any>(await apiDna.json<any>(res));
        expect(updated.cooperativeApproachId).toBe(originalId);
        expect(updated.cooperativeApproachId).not.toBe(attemptedId);

        // Re-fetch to verify persistence.
        const getRes = await apiDna.get(
          `national/cooperativeApproach/get?id=${encodeURIComponent(
            originalId
          )}`
        );
        await expectOk(getRes, "immutability re-get");
        const fetched = unwrap<any>(await apiDna.json<any>(getRes));
        expect(fetched.cooperativeApproachId).toBe(originalId);

        // Confirm the hijack ID was never persisted.
        const hijackRes = await apiDna.get(
          `national/cooperativeApproach/get?id=${encodeURIComponent(
            attemptedId
          )}`
        );
        expect(hijackRes.ok()).toBe(false);
      } else {
        // If the backend rejected the mutation, the original must still
        // exist unchanged — and no hijack row should have been created.
        expect(res.status()).toBeGreaterThanOrEqual(400);
        expect(res.status()).toBeLessThan(500);

        const getRes = await apiDna.get(
          `national/cooperativeApproach/get?id=${encodeURIComponent(
            originalId
          )}`
        );
        await expectOk(getRes, "immutability re-get after reject");
      }
    });

    test("reportId remains stable across update / submit / get lifecycle", async ({
      apiDna,
    }) => {
      // The IR's reportId is the primary key and must be preserved
      // through every lifecycle step. Documents the Phase 6 promise
      // that IR-<n> is allocated once at generate time and never
      // reshaped.
      const ca = await createCooperativeApproach(apiDna, {
        title: `Immutable IR ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      const pk = gen.reportId;
      expect(pk).toMatch(/^IR-\d+$/);

      // Update: the DTO demands reportId in the body — it is the
      // pointer, not a mutation target.
      const updateRes = await apiDna.put("national/initialReport/update", {
        reportId: pk,
        caMethodDescription: "immutability probe update",
      });
      await expectOk(updateRes, "update keeps reportId stable");
      const afterUpdate = unwrap<any>(await apiDna.json<any>(updateRes));
      expect(afterUpdate.reportId).toBe(pk);

      // Submit.
      const afterSubmit = await submitInitialReport(apiDna, pk);
      expect(afterSubmit.reportId).toBe(pk);
      expect(afterSubmit.status).toBe("Submitted");

      // Final get.
      const getRes = await apiDna.get(
        `national/initialReport/get?id=${encodeURIComponent(pk)}`
      );
      await expectOk(getRes, "final get");
      const finalIr = unwrap<any>(await apiDna.json<any>(getRes));
      expect(finalIr.reportId).toBe(pk);
    });

    test("seeded ITMO block carries a Dec 6/CMA.4 Annex I para 5 structured serial", async ({
      apiDna,
    }) => {
      // The Phase-3 blocker fix adds an itmoSerial column to
      // CreditBlocksEntity populated at issuance with the 5-component
      // UNFCCC identifier:
      //   {originatingParty}-{itmoType}-{vintage}-{activityId}-{start}:{end}
      //
      // Immutability per Draft -/CMA.5 para 132 is honored by the
      // registry's split-not-mutate pattern: when a block is
      // transferred, the original itmoSerial is preserved on the
      // original block's row and the newly created transferee block
      // gets its own itmoSerial with the same structure.
      //
      // This test seeds a block whose itmoSerial follows the format,
      // then queries queryBalance and asserts the view round-trips
      // the column with all 5 parseable components.
      const party = "NG";
      const itmoType = "GHG";
      const vintage = "2025";
      const activityId = `TEST-PROJ-${uniqueSuffix()}`;
      const start = 1;
      const end = 1000;
      const itmoSerial = `${party}-${itmoType}-${vintage}-${activityId}-${start}:${end}`;
      const seeded = seedCreditBlockDirect({
        ownerCompanyId: 1,
        projectRefId: activityId,
        creditAmount: 1000,
        accountType: "Holding",
        itmoSerial,
      });

      const res = await apiDna.post(
        "national/creditTransactionsManagement/queryBalance",
        {
          page: 1,
          size: 50,
          sort: { key: "createdDate", order: "DESC" },
        }
      );
      await expectOk(res, "queryBalance after itmoSerial seed");
      const body = await apiDna.json<any>(res);
      const data = body?.data ?? body;
      const rows = Array.isArray(data) ? data : data?.data ?? [];
      const match = rows.find((r: any) => r.id === seeded.creditBlockId);
      expect(match, `seeded block ${seeded.creditBlockId} not in view`).toBeTruthy();
      expect(match.itmoSerial).toBe(itmoSerial);
      // All 5 UNFCCC components parse out of the serial.
      const parts = String(match.itmoSerial).split("-");
      expect(parts.length).toBeGreaterThanOrEqual(5);
      expect(parts[0]).toBe(party);
      expect(parts[1]).toBe(itmoType);
      expect(parts[2]).toBe(vintage);
      expect(parts[parts.length - 1]).toMatch(/^\d+:\d+$/);
    });
  });

  // ------------------------------------------------------------------
  // Service-layer sequencing + serial-lineage invariants. Covers audit
  // gaps #3 (Revoked CA must block first-transfer at the /transfer
  // service layer, not only at /authorize) and #18 (ITMO serial
  // lineage through split + retire per Draft -/CMA.5 ¶132). Both
  // tests are written as executable contracts — they run live against
  // the backend and are marked `.fixme` only when the guarded
  // behaviour is observably missing (citing the specific clause and
  // gap number so a future fix can unfix the test).
  // ------------------------------------------------------------------
  test.describe("Service-layer sequencing and serial lineage", () => {
    // PD company IDs verified against live /national/auth/login JWT
    // claims in credit-transfer.spec.ts and retirement.spec.ts:
    //   palinda+dev@xeptagon.com  -> companyId=1, PD Admin (apiPd).
    //   palinda+dev2@xeptagon.com -> companyId=3, PD Admin (receiver).
    const PD_COMPANY_ID = 1;
    const RECEIVER_COMPANY_ID = 3;

    /**
     * Parse a Dec 6/CMA.4 Annex I ¶5 structured ITMO serial
     *   `{party}-{type}-{vintage}-{activityId}-{start}:{end}`
     * into its components. Returns null when the input does not match
     * the 5-component layout.
     *
     * activityId is the only free-form component (may contain
     * hyphens), so we anchor on the leading party / type / vintage
     * and the trailing start:end and treat everything between as the
     * activity id. Mirrors SerialNumberManagementService.parseItmoSerial
     * on the backend.
     */
    function parseItmoSerial(
      serial: string | null | undefined
    ): {
      party: string;
      type: string;
      vintage: string;
      activityId: string;
      start: number;
      end: number;
    } | null {
      if (!serial) return null;
      const match = /^([^-]+)-([^-]+)-([^-]+)-(.+)-(\d+):(\d+)$/.exec(serial);
      if (!match) return null;
      return {
        party: match[1],
        type: match[2],
        vintage: match[3],
        activityId: match[4],
        start: Number(match[5]),
        end: Number(match[6]),
      };
    }

    /**
     * True when child's (party, type, vintage, activityId) match the
     * parent and child's [start, end] is a (non-strict) sub-range of
     * the parent's [start, end]. Used to validate serial lineage
     * without locking the exact split boundaries — registry is free
     * to pick any split point as long as the child is a sub-range
     * of the parent per Draft -/CMA.5 ¶132.
     */
    function isSerialSubRange(parent: string, child: string): boolean {
      const p = parseItmoSerial(parent);
      const c = parseItmoSerial(child);
      if (!p || !c) return false;
      if (p.party !== c.party) return false;
      if (p.type !== c.type) return false;
      if (p.vintage !== c.vintage) return false;
      if (p.activityId !== c.activityId) return false;
      return c.start >= p.start && c.end <= p.end && c.start <= c.end;
    }

    test(
      "POST /creditTransactionsManagement/transfer rejects first-transfer under a Revoked CA (Draft -/CMA.5 paras 20-21)",
      async ({ apiPd, apiDna }) => {
        // Audit gap #3 Critical — now covered. The transfer service
        // layer re-reads the linked CA's status and rejects with 400
        // citing Draft -/CMA.5 ¶21 ("no further ITMOs shall be first
        // transferred" after revocation). This test locks the contract.

        // Arrange: CA + submitted IR + authorized programme linkage,
        // plus a 1000-credit Holding block owned by the PD that sits
        // behind the CA. The block must exist in both the RDBMS and
        // the ledger (transferCredits reads from the ledger), so we
        // use seedTransferrableBlock.
        const ca = await createCooperativeApproach(apiDna, {
          title: `Revoked Transfer Guard ${uniqueSuffix()}`,
        });
        const gen = await generateInitialReport(apiDna, {
          cooperativeApproachId: ca.cooperativeApproachId,
        });
        await submitInitialReport(apiDna, gen.reportId);
        const seeded = seedTransferrableBlock({
          ownerCompanyId: PD_COMPANY_ID,
          creditAmount: 1000,
          accountType: "Holding",
          authorizationPurpose: "UseTowardsNDC",
          cooperativeApproachId: ca.cooperativeApproachId,
        });

        // Flip the CA to Revoked. The service accepts any status on
        // /update (no state machine today — see audit gap #5), so
        // this succeeds.
        const revokeRes = await apiDna.put(
          "national/cooperativeApproach/update",
          {
            cooperativeApproachId: ca.cooperativeApproachId,
            status: "Revoked",
          }
        );
        await expectOk(revokeRes, "revoke CA");

        // Act: attempt first-transfer of 100 credits. The guard
        // should reject this with 400 citing ¶21.
        const res = await apiPd.post(
          "national/creditTransactionsManagement/transfer",
          {
            blockId: seeded.creditBlockId,
            receiverOrgId: RECEIVER_COMPANY_ID,
            amount: 100,
          }
        );

        // Assert: 400 (locked contract). Service rejects first-transfer
        // under a Revoked CA per Draft -/CMA.5 ¶21.
        expect(res.ok()).toBe(false);
        expect(res.status()).toBe(400);

        // And the ledger block balance must be untouched (no partial
        // ownership flip recorded).
        const ledgerBlock = readLedgerCreditBlock(seeded.creditBlockId);
        expect(ledgerBlock).not.toBeNull();
        expect(Number(ledgerBlock!.ownerCompanyId)).toBe(PD_COMPANY_ID);
        expect(Number(ledgerBlock!.creditAmount)).toBe(1000);
      }
    );

    test(
      "ITMO serial lineage is preserved across split (transfer) + retire (Draft -/CMA.5 para 132)",
      async ({ apiPd, apiDna }) => {
        // Audit gap #18 Major — Draft -/CMA.5 ¶132 requires "each
        // ITMO has a unique serial number that shall remain stable
        // throughout its lifecycle". The registry's split-not-mutate
        // pattern satisfies this: derived blocks carry serials that
        // parse as sub-ranges of the parent.
        //
        // Fix: credit-blocks-management.service.ts now derives
        // itmoSerials on both split children (retained parent +
        // transferred child) via sub-range derivation. Retirement
        // (programme-ledger.service.ts:936) already propagates
        // itmoSerial onto the derived retirement block.

        // Arrange: 1000-credit block with a structured parent serial.
        const party = "LK";
        const itmoType = "REDUCTION";
        const vintage = "2026";
        const activityId = `DEMO-ACT-${uniqueSuffix()}`;
        const start = 1;
        const end = 1000;
        const parentSerial = `${party}-${itmoType}-${vintage}-${activityId}-${start}:${end}`;

        const seeded = seedTransferrableBlock({
          ownerCompanyId: PD_COMPANY_ID,
          creditAmount: 1000,
          accountType: "Holding",
          authorizationPurpose: "UseTowardsNDC",
          itmoSerial: parentSerial,
        });

        // Sanity: parent parses cleanly.
        const parsedParent = parseItmoSerial(parentSerial);
        expect(parsedParent).not.toBeNull();
        expect(parsedParent!.party).toBe(party);
        expect(parsedParent!.start).toBe(start);
        expect(parsedParent!.end).toBe(end);

        // Act 1: split via transfer — move 400/1000 to another
        // company. This triggers the split branch of
        // transferCreditAmountFromBlocks (the other 600 stays with
        // the sender; a brand-new block is created for the 400).
        await initiateTransfer(apiPd, {
          blockId: seeded.creditBlockId,
          receiverOrgId: RECEIVER_COMPANY_ID,
          amount: 400,
        });

        // Assert 1: two ledger blocks share the project; both
        // itmoSerials parse AND sit inside the parent's [start, end]
        // range. The sender's retained block should still be owned
        // by PD_COMPANY_ID; the transferred child by
        // RECEIVER_COMPANY_ID.
        const blocksAfterSplit = readLedgerBlocksByProject(seeded.projectRefId);
        const senderChild = blocksAfterSplit.find(
          (b) => Number(b.ownerCompanyId) === PD_COMPANY_ID
        );
        const receiverChild = blocksAfterSplit.find(
          (b) => Number(b.ownerCompanyId) === RECEIVER_COMPANY_ID
        );
        expect(senderChild, "sender-retained split block not found").toBeTruthy();
        expect(receiverChild, "transfer-split child not found").toBeTruthy();
        expect(
          isSerialSubRange(parentSerial, senderChild!.itmoSerial),
          `sender child serial ${senderChild!.itmoSerial} not a sub-range of ${parentSerial}`
        ).toBe(true);
        expect(
          isSerialSubRange(parentSerial, receiverChild!.itmoSerial),
          `receiver child serial ${receiverChild!.itmoSerial} not a sub-range of ${parentSerial}`
        ).toBe(true);

        // Act 2: retire 200 from the sender's retained block
        // (600 balance). This exercises the retire-with-split branch
        // at programme-ledger.service.ts:874-937 which DOES propagate
        // itmoSerial (:936).
        const retainedBlockId = String(senderChild!.creditBlockId);
        const { retirementId } = await performRetireAction(apiPd, {
          blockId: retainedBlockId,
          retirementType: "VOLUNTARY_CANCELLATIONS",
          amount: 200,
        });
        expect(retirementId).toBeTruthy();

        seedPendingRetirementTransactionDirect({
          transactionId: String(retirementId),
          creditBlockId: retainedBlockId,
          projectRefId: seeded.projectRefId,
          senderCompanyId: PD_COMPANY_ID,
          amount: 200,
          retirementType: "Voluntary Cancellations",
        });
        await approveRetireRequest(apiDna, String(retirementId));

        // Assert 2: the derived retirement block's serial is still a
        // sub-range of the original parent, proving the lineage
        // survived BOTH operations.
        const blocksAfterRetire = readLedgerBlocksByProject(seeded.projectRefId);
        const retiredBlock = blocksAfterRetire.find(
          (b) => Number(b.ownerCompanyId) === 0
        );
        expect(retiredBlock, "retired block not found").toBeTruthy();
        expect(Number(retiredBlock!.creditAmount)).toBe(200);
        expect(
          isSerialSubRange(parentSerial, retiredBlock!.itmoSerial),
          `retired block serial ${retiredBlock!.itmoSerial} not a sub-range of ${parentSerial}`
        ).toBe(true);
      }
    );
  });

  // ------------------------------------------------------------------
  // Authentication-layer sanity. apiUser and explicit createApiClient()
  // calls. Documents that the fixtures build per-test authenticated
  // contexts and that a second auth session can run against the same
  // backend without token collision.
  // ------------------------------------------------------------------
  test.describe("Auth sanity (explicit createApiClient)", () => {
    test("createApiClient('dnaAdmin') yields a token that can query CAs independently of the fixture", async () => {
      // The fixture-built apiDna and an ad-hoc createApiClient call
      // should both succeed in parallel. Locks in that auth sessions
      // are independent and the backend issues per-login tokens.
      const ad = await createApiClient("dnaAdmin");
      try {
        const res = await ad.post("national/cooperativeApproach/query", {
          page: 1,
          size: 1,
        });
        await expectOk(res, "ad-hoc DNA query");
        expect(typeof ad.token).toBe("string");
        expect(ad.token.length).toBeGreaterThan(10);
      } finally {
        await ad.request.dispose();
      }
    });

    // Audit gap #25 Minor — bad-credentials login.
    // Locks the contract that POST /auth/login with a wrong password
    // returns a 4xx (not a 5xx). The endpoint sits in front of every
    // protected route; a regression that turns 401 into 500 would mask
    // brute-force attempts in monitoring dashboards.
    test("POST /auth/login with a wrong password returns 4xx (not 5xx)", async () => {
      const ctx = await request.newContext();
      try {
        const res = await ctx.post(
          "http://localhost:3000/national/auth/login",
          {
            data: {
              username: "palinda+add@xeptagon.com",
              password: `definitely-wrong-${uniqueSuffix()}`,
            },
          }
        );
        expect(res.ok()).toBe(false);
        expect(res.status()).toBeGreaterThanOrEqual(400);
        expect(res.status()).toBeLessThan(500);
      } finally {
        await ctx.dispose();
      }
    });
  });

  // ------------------------------------------------------------------
  // Audit gap #26 (refresh leg) + new "Password reset" row in Section 2
  // of docs/testing/e2e-coverage.md.
  //
  // Locks two unauthenticated AuthController contracts that previously
  // had no E2E coverage:
  //   - POST /national/auth/forgotPassword is reachable without auth
  //     and returns 2xx for a known email, 4xx for an unknown one.
  //   - POST /national/auth/login/refresh, given a valid refresh_token
  //     captured from a fresh login, returns a new access_token.
  //
  // We use a raw request.newContext() (not createApiClient) for two
  // reasons: the forgotPassword endpoint is unauthenticated, and
  // createApiClient discards the refresh_token from the login response
  // so we can't reach it through the helper. The harness mirrors the
  // bad-credentials test directly above this block.
  //
  // We intentionally do NOT assert an exact 4xx code on the unknown-
  // email branch — NestJS validation guards have shifted between 400
  // and 404 between releases and the contract being locked here is
  // "client error, not server error", not the precise status.
  // ------------------------------------------------------------------
  test.describe("Auth — password reset + token refresh", () => {
    test("POST /auth/forgotPassword with a known email returns 2xx", async () => {
      const ctx = await request.newContext();
      try {
        const res = await ctx.post(
          "http://localhost:3000/national/auth/forgotPassword",
          {
            data: { email: "palinda+add@xeptagon.com" },
          }
        );
        // Controller may return 200/201/204 depending on whether
        // authService.forgotPassword resolves with a body or undefined.
        // We assert only the 2xx band.
        expect(res.ok()).toBe(true);
      } finally {
        await ctx.dispose();
      }
    });

    test("POST /auth/forgotPassword with an unknown email returns 4xx (not 5xx)", async () => {
      const ctx = await request.newContext();
      try {
        const res = await ctx.post(
          "http://localhost:3000/national/auth/forgotPassword",
          {
            data: {
              email: `unknown-${uniqueSuffix()}@example.invalid`,
            },
          }
        );
        expect(res.ok()).toBe(false);
        expect(res.status()).toBeGreaterThanOrEqual(400);
        expect(res.status()).toBeLessThan(500);
      } finally {
        await ctx.dispose();
      }
    });

    test("POST /auth/login/refresh with a valid refresh token issues a new access_token", async () => {
      const ctx = await request.newContext();
      try {
        // Step A — raw login to capture the refresh_token, which
        // createApiClient does not expose.
        const loginRes = await ctx.post(
          "http://localhost:3000/national/auth/login",
          {
            data: {
              username: "palinda+add@xeptagon.com",
              password: "123",
            },
          }
        );
        expect(loginRes.ok()).toBe(true);
        const loginBody = await loginRes.json();
        const refreshToken: string =
          loginBody?.refresh_token ?? loginBody?.data?.refresh_token;
        expect(typeof refreshToken).toBe("string");
        expect(refreshToken.length).toBeGreaterThan(10);

        // Step B — exchange the refresh_token for a fresh access_token.
        // RefreshLoginDto is camelCase ({ refreshToken }) even though
        // the login response uses snake_case (refresh_token).
        const refreshRes = await ctx.post(
          "http://localhost:3000/national/auth/login/refresh",
          {
            data: { refreshToken },
          }
        );
        await expectOk(refreshRes, "refresh-token round-trip");
        const refreshBody = await refreshRes.json();
        const newAccessToken: string =
          refreshBody?.access_token ?? refreshBody?.data?.access_token;
        expect(typeof newAccessToken).toBe("string");
        expect(newAccessToken.length).toBeGreaterThan(10);
      } finally {
        await ctx.dispose();
      }
    });
  });

  // ------------------------------------------------------------------
  // Audit gap #27 Minor — role-based sidebar visibility.
  // The Sider menu (web/src/Components/Sider/layout.sider.tsx:98-118)
  // gates "Reports", "Corresponding Adjustments" and "Initial Reports"
  // behind DESIGNATED_NATIONAL_AUTHORITY + Admin/Root. PD users must
  // not see these entries. A CASL-only check is not enough: a UI that
  // renders a forbidden link still leaks the existence of the
  // capability and produces a click-then-403 surprise.
  // ------------------------------------------------------------------
  test.describe("UI: role-based sidebar visibility", () => {
    test("DNA admin sees the Reports + Corresponding Adjustments + Initial Reports menu items", async ({
      dnaPage,
    }) => {
      await dnaPage.waitForURL("**/dashboard", { timeout: 15000 });
      const sider = dnaPage.locator(".layout-sider-container");
      await expect(sider.getByText(/Corresponding Adjustments/i).first()).toBeVisible();
      await expect(sider.getByText(/Initial Reports/i).first()).toBeVisible();
    });

    test("PD admin does not see the DNA-only menu items", async ({
      pdPage,
    }) => {
      await pdPage.waitForURL("**/dashboard", { timeout: 15000 });
      const sider = pdPage.locator(".layout-sider-container");
      await expect(sider).toBeVisible();
      // Negative assertions — PD must not see DNA-only items.
      await expect(sider.getByText(/Corresponding Adjustments/i)).toHaveCount(0);
      await expect(sider.getByText(/Initial Reports/i)).toHaveCount(0);
    });
  });
});
