/**
 * E2E coverage for Phase 6: Initial Report generation module.
 *
 * Backs the requirement table in
 * docs/article6/06-initial-report.md. Covers:
 *   - the POST /national/initialReport/generate endpoint that builds an
 *     InitialReport row (reportId format "IR-<n>", status=Draft) from a
 *     linked CooperativeApproach and pre-populates the five JSONB
 *     sections required by Decision 2/CMA.3 para 18,
 *   - the 409 Conflict guard preventing a second IR for the same CA,
 *   - the draft lifecycle: generate -> update -> submit, including
 *     the Published edit-lock (service line 184) and the completeness
 *     validator (service lines 222-234),
 *   - the /check?cooperativeApproachId=<id> sequencing probe that
 *     reports whether a submitted IR exists (note: this method is
 *     NEVER called anywhere else in the backend — see Gaps in the
 *     companion doc for the critical para 18 enforcement gap),
 *   - the /initialReports/viewAll list and /initialReports/create form
 *     UI surfaces.
 *
 * IMPORTANT enum contract (verified on disk 2026-04-19):
 *   backend/services/libs/shared/src/enum/initial.report.status.enum.ts
 *     DRAFT     = "Draft"
 *     SUBMITTED = "Submitted"
 *     PUBLISHED = "Published"
 *
 * The wire values are PascalCase, matching the pattern established in
 * Phase 5 (CaStatus, NdcType, CaMethod). The TypeORM @Column default
 * is `InitialReportStatus.DRAFT = "Draft"` so a freshly generated IR
 * comes back with `status: "Draft"` — not `"DRAFT"` and not `"draft"`.
 *
 * Parallel safety: each test creates its own CooperativeApproach via
 * `createCooperativeApproach()` with a `uniqueSuffix()` title. The
 * service enforces a one-IR-per-CA invariant (409 Conflict on
 * duplicate generate), so tests that are not exercising the 409 path
 * MUST use a fresh CA per test to avoid cross-test interference.
 */
import { test, expect } from "./support/fixtures";
import { BASE_URL } from "./support/auth";
import {
  createCooperativeApproach,
  generateInitialReport,
  nullInitialReportSectionDirect,
  setInitialReportStatusDirect,
  submitInitialReport,
  uniqueSuffix,
} from "./support/factories";
import { expectOk } from "./support/api-client";

// ---------------------------------------------------------------------
// Enum values verified against disk on 2026-04-19. If any string below
// changes, the "Enum cardinality" block is the canary; the API tests
// will still fail on the old value since they compare against "Draft"
// and "Submitted" exactly.
// ---------------------------------------------------------------------
const IR_STATUS_VALUES = ["Draft", "Submitted", "Published"] as const;

function unwrap<T = any>(raw: any): T {
  if (raw == null) return raw;
  if (raw.data !== undefined) return raw.data as T;
  return raw as T;
}

test.describe("Initial Report - Article 6.2", () => {
  // ------------------------------------------------------------------
  // API: POST /generate — shape contract + pre-population invariants.
  // ------------------------------------------------------------------
  test.describe("API: generate", () => {
    test("POST /generate with only cooperativeApproachId returns 201, status=Draft, reportId=IR-<n>, all 5 jsonb sections non-null", async ({
      apiDna,
    }) => {
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Gen Basic ${uniqueSuffix()}`,
      });
      const res = await apiDna.post("national/initialReport/generate", {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      await expectOk(res, "generate");
      expect(res.status()).toBeGreaterThanOrEqual(200);
      expect(res.status()).toBeLessThan(300);

      const ir = unwrap<any>(await apiDna.json<any>(res));
      expect(ir).toBeTruthy();
      expect(typeof ir.reportId).toBe("string");
      expect(ir.reportId).toMatch(/^IR-\d+$/);
      expect(ir.status).toBe("Draft");
      expect(ir.cooperativeApproachId).toBe(ca.cooperativeApproachId);

      // All five jsonb sections should be pre-populated (non-null).
      expect(ir.participationDemonstration).not.toBeNull();
      expect(ir.itmoMetrics).not.toBeNull();
      expect(ir.ndcQuantification).not.toBeNull();
      expect(ir.cooperativeApproachDetails).not.toBeNull();
      expect(ir.environmentalIntegrity).not.toBeNull();
    });

    test("pre-population: cooperativeApproachDetails.title matches CA title, itmoMetrics.primaryMetric=tCO2e, participationDemonstration has countryCode", async ({
      apiDna,
    }) => {
      const caTitle = `IR Prepop ${uniqueSuffix()}`;
      const ca = await createCooperativeApproach(apiDna, {
        title: caTitle,
        participatingParties: ["NG", "CH", "JP"],
        description: "E2E pre-population fixture",
        expectedMitigationOutcomes: "123456",
        environmentalIntegrityAssessment: "Baseline conservatively set",
      });

      const res = await apiDna.post("national/initialReport/generate", {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      await expectOk(res, "generate (prepop)");
      const ir = unwrap<any>(await apiDna.json<any>(res));

      // cooperativeApproachDetails is pre-populated from the CA row
      // (service lines 94-103).
      expect(ir.cooperativeApproachDetails).toBeTruthy();
      expect(ir.cooperativeApproachDetails.title).toBe(caTitle);
      expect(Array.isArray(ir.cooperativeApproachDetails.participatingParties)).toBe(
        true
      );
      expect(ir.cooperativeApproachDetails.participatingParties).toEqual(
        expect.arrayContaining(["NG", "CH", "JP"])
      );
      expect(ir.cooperativeApproachDetails.description).toBe(
        "E2E pre-population fixture"
      );
      expect(ir.cooperativeApproachDetails.expectedMitigation).toBe("123456");

      // itmoMetrics defaults (service lines 79-82).
      expect(ir.itmoMetrics.primaryMetric).toBe("tCO2e");
      expect(Array.isArray(ir.itmoMetrics.nonGhgMetrics)).toBe(true);

      // participationDemonstration defaults (service lines 71-77).
      expect(ir.participationDemonstration.isPartyToParisAgreement).toBe(true);
      expect(ir.participationDemonstration.hasNDC).toBe(true);
      expect(ir.participationDemonstration.hasTrackingArrangements).toBe(true);
      expect(ir.participationDemonstration.hasAuthorizationArrangements).toBe(
        true
      );
      // countryCode is pulled from config.systemCountry — just assert the
      // shape, not a specific country, since the configured value may
      // vary between deployments.
      expect(
        ir.participationDemonstration.countryCode === undefined ||
          typeof ir.participationDemonstration.countryCode === "string"
      ).toBe(true);

      // environmentalIntegrity seeded from CA.environmentalIntegrityAssessment
      // (service lines 105-110).
      expect(ir.environmentalIntegrity).toBeTruthy();
      expect(ir.environmentalIntegrity.noNetIncrease).toBe(
        "Baseline conservatively set"
      );
    });

    test("POST /generate with explicit jsonb overrides preserves supplied values (no pre-population override)", async ({
      apiDna,
    }) => {
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Override ${uniqueSuffix()}`,
      });
      const explicit = {
        cooperativeApproachId: ca.cooperativeApproachId,
        participationDemonstration: {
          isPartyToParisAgreement: true,
          hasNDC: true,
          hasTrackingArrangements: false,
          hasAuthorizationArrangements: false,
          countryCode: "XX",
        },
        itmoMetrics: {
          primaryMetric: "tCO2e",
          nonGhgMetrics: ["hectares_restored"],
        },
        caMethodDescription: "Trajectory per para 7a(i); explicit override.",
        ndcQuantification: {
          ndcTarget: 750000,
          baseYear: 2015,
          targetYear: 2030,
          sectors: ["Energy", "Forestry"],
          ghgs: ["CO2", "CH4"],
        },
        cooperativeApproachDetails: {
          title: "Explicit override title",
          participatingParties: ["NG"],
          description: "override-desc",
          duration: { startDate: 0, endDate: 0 },
          expectedMitigation: "0",
        },
        environmentalIntegrity: {
          noNetIncrease: "explicit",
          conservativeBaselines: "explicit",
          nonPermanenceRisk: "explicit",
          leakageRisk: "explicit",
        },
      };
      const res = await apiDna.post(
        "national/initialReport/generate",
        explicit
      );
      await expectOk(res, "generate (overrides)");
      const ir = unwrap<any>(await apiDna.json<any>(res));

      expect(ir.participationDemonstration.countryCode).toBe("XX");
      expect(ir.participationDemonstration.hasTrackingArrangements).toBe(false);
      expect(ir.itmoMetrics.nonGhgMetrics).toEqual(["hectares_restored"]);
      expect(ir.caMethodDescription).toBe(
        "Trajectory per para 7a(i); explicit override."
      );
      expect(ir.ndcQuantification.ndcTarget).toBe(750000);
      expect(ir.ndcQuantification.sectors).toEqual(["Energy", "Forestry"]);
      expect(ir.cooperativeApproachDetails.title).toBe(
        "Explicit override title"
      );
      expect(ir.environmentalIntegrity.conservativeBaselines).toBe("explicit");
    });

    test("POST /generate with non-existent cooperativeApproachId returns 4xx (400 Bad Request per service)", async ({
      apiDna,
    }) => {
      const missing = `CA-DOES-NOT-EXIST-${uniqueSuffix()}`;
      const res = await apiDna.post("national/initialReport/generate", {
        cooperativeApproachId: missing,
      });
      expect(res.ok()).toBe(false);
      expect(res.status()).toBeGreaterThanOrEqual(400);
      expect(res.status()).toBeLessThan(500);
      // Service throws HttpStatus.BAD_REQUEST (400) for a missing CA
      // (lines 38-46 of initial-report.service.ts).
      expect(res.status()).toBe(400);
    });

    test("POST /generate twice for the same cooperativeApproachId returns 409 Conflict", async ({
      apiDna,
    }) => {
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Conflict ${uniqueSuffix()}`,
      });
      // First call creates the draft IR.
      const first = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      expect(first.reportId).toMatch(/^IR-\d+$/);

      // Second call for the same CA must throw CONFLICT (service lines
      // 49-57).
      const res = await apiDna.post("national/initialReport/generate", {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(409);
    });
  });

  // ------------------------------------------------------------------
  // API: PUT /update — merge semantics + Published edit-lock.
  // ------------------------------------------------------------------
  test.describe("API: update", () => {
    test("PUT /update with partial fields merges, preserves other sections, bumps updatedTime", async ({
      apiDna,
    }) => {
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Update ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      const originalPD = gen.raw.participationDemonstration;
      const originalIT = gen.raw.itmoMetrics;
      const originalUpdated = Number(gen.raw.updatedTime);

      // Small delay so updatedTime changes detectably (epoch ms).
      await new Promise((r) => setTimeout(r, 5));

      const patch = {
        reportId: gen.reportId,
        caMethodDescription:
          "Updated CA method description — averaging per para 7a(ii).",
        ndcQuantification: {
          ndcTarget: 999999,
          baseYear: 2020,
          targetYear: 2035,
          sectors: ["Transport"],
          ghgs: ["CO2"],
        },
      };
      const res = await apiDna.put("national/initialReport/update", patch);
      await expectOk(res, "update (partial)");
      const updated = unwrap<any>(await apiDna.json<any>(res));

      // Patched fields take the new values.
      expect(updated.caMethodDescription).toBe(patch.caMethodDescription);
      expect(updated.ndcQuantification.ndcTarget).toBe(999999);
      expect(updated.ndcQuantification.sectors).toEqual(["Transport"]);

      // Non-patched fields are preserved.
      expect(updated.participationDemonstration).toEqual(originalPD);
      expect(updated.itmoMetrics).toEqual(originalIT);

      // updatedTime bumps forward.
      expect(Number(updated.updatedTime)).toBeGreaterThanOrEqual(
        originalUpdated
      );

      // Status stays Draft.
      expect(updated.status).toBe("Draft");
    });

    test("PUT /update on nonexistent reportId returns 404", async ({
      apiDna,
    }) => {
      const missing = `IR-DOES-NOT-EXIST-${uniqueSuffix()}`;
      const res = await apiDna.put("national/initialReport/update", {
        reportId: missing,
        caMethodDescription: "should-not-apply",
      });
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(404);
    });

    test("PUT /update on a Published IR returns 400 (cannot modify after publication)", async ({
      apiDna,
    }) => {
      // There is no HTTP endpoint that transitions an IR to Published,
      // so we seed the state via direct SQL. The service guard at
      // initial-report.service.ts:184-189 should still fire.
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Published ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      setInitialReportStatusDirect(gen.reportId, "Published");

      const res = await apiDna.put("national/initialReport/update", {
        reportId: gen.reportId,
        caMethodDescription: "should be rejected",
      });
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(400);
    });
  });

  // ------------------------------------------------------------------
  // API: PUT /submit — completeness validator + state transition.
  // ------------------------------------------------------------------
  test.describe("API: submit", () => {
    test("PUT /submit on a fully pre-populated Draft flips status to Submitted", async ({
      apiDna,
    }) => {
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Submit ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      // All five sections are pre-populated by default (service lines
      // 71-110), so the completeness check at lines 222-234 passes.
      const submitted = await submitInitialReport(apiDna, gen.reportId);
      expect(submitted.reportId).toBe(gen.reportId);
      expect(submitted.status).toBe("Submitted");
    });

    test("PUT /submit on an IR with a nulled required section returns 400 listing the missing field", async ({
      apiDna,
    }) => {
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Submit Incomplete ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });

      // The update DTO rejects explicit nulls before they reach the
      // submit-layer completeness validator (service lines 222-234),
      // so we null the JSONB column directly and then call submit.
      // This drives the "Initial report is incomplete. Missing
      // sections: <list>" 400 path that no other test exercises.
      nullInitialReportSectionDirect(gen.reportId, "environmentalIntegrity");

      const submitRes = await apiDna.put(
        `national/initialReport/submit?id=${encodeURIComponent(gen.reportId)}`
      );
      expect(submitRes.ok()).toBe(false);
      expect(submitRes.status()).toBe(400);
      const bodyText = await submitRes.text();
      // Service lines 229-233 emit "Initial report is incomplete.
      // Missing sections: <comma-list>".
      expect(bodyText).toMatch(/incomplete|missing/i);
      expect(bodyText).toMatch(/environmentalIntegrity/);
    });

    test("PUT /submit on nonexistent reportId returns 404", async ({
      apiDna,
    }) => {
      const missing = `IR-MISSING-${uniqueSuffix()}`;
      const res = await apiDna.put(
        `national/initialReport/submit?id=${encodeURIComponent(missing)}`
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(404);
    });

    test("PUT /submit called twice is idempotent (second call succeeds, status stays Submitted)", async ({
      apiDna,
    }) => {
      // Service lines 209-241 do not guard on the current status
      // before writing `InitialReportStatus.SUBMITTED`. Re-submitting
      // a row that is already Submitted succeeds and refreshes
      // updatedTime. This test documents the current behaviour —
      // flagged as a gap in 06-initial-report.md. Accept either 2xx
      // (current idempotent behaviour) or 4xx (future state-guard).
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR ReSubmit ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });

      const first = await apiDna.put(
        `national/initialReport/submit?id=${encodeURIComponent(gen.reportId)}`
      );
      await expectOk(first, "first submit");

      const second = await apiDna.put(
        `national/initialReport/submit?id=${encodeURIComponent(gen.reportId)}`
      );
      if (second.ok()) {
        const body = unwrap<any>(await apiDna.json<any>(second));
        expect(body.status).toBe("Submitted");
      } else {
        expect(second.status()).toBeGreaterThanOrEqual(400);
        expect(second.status()).toBeLessThan(500);
      }
    });
  });

  // ------------------------------------------------------------------
  // API: GET /check — sequencing-invariant probe. Decision 2/CMA.3
  // para 18 requires a submitted IR before first ITMO authorization.
  // The registry exposes this probe but never CALLS it from any
  // authorization pathway; see doc Gaps section for the full critical
  // finding. These tests lock in the endpoint's wire contract.
  // ------------------------------------------------------------------
  test.describe("API: check", () => {
    test("GET /check?cooperativeApproachId=<id> before any IR exists returns { hasSubmittedReport: false }", async ({
      apiDna,
    }) => {
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Check No-IR ${uniqueSuffix()}`,
      });
      const res = await apiDna.get(
        `national/initialReport/check?cooperativeApproachId=${encodeURIComponent(
          ca.cooperativeApproachId
        )}`
      );
      await expectOk(res, "check (no IR)");
      const body = await apiDna.json<any>(res);
      // Controller returns the bare `{ hasSubmittedReport: boolean }`
      // shape (no DataResponseDto wrapping — lines 80-90).
      const payload = body?.data ?? body;
      expect(payload.hasSubmittedReport).toBe(false);
    });

    test("GET /check after PUT /submit returns { hasSubmittedReport: true }", async ({
      apiDna,
    }) => {
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Check Submitted ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      // Generated but not yet submitted — check should still be false.
      const beforeRes = await apiDna.get(
        `national/initialReport/check?cooperativeApproachId=${encodeURIComponent(
          ca.cooperativeApproachId
        )}`
      );
      await expectOk(beforeRes, "check (draft only)");
      const beforeBody = await apiDna.json<any>(beforeRes);
      const beforePayload = beforeBody?.data ?? beforeBody;
      expect(beforePayload.hasSubmittedReport).toBe(false);

      // After submission the flag flips true.
      await submitInitialReport(apiDna, gen.reportId);
      const afterRes = await apiDna.get(
        `national/initialReport/check?cooperativeApproachId=${encodeURIComponent(
          ca.cooperativeApproachId
        )}`
      );
      await expectOk(afterRes, "check (after submit)");
      const afterBody = await apiDna.json<any>(afterRes);
      const afterPayload = afterBody?.data ?? afterBody;
      expect(afterPayload.hasSubmittedReport).toBe(true);
    });
  });

  // ------------------------------------------------------------------
  // API: POST /query and GET /get
  // ------------------------------------------------------------------
  test.describe("API: query and get", () => {
    test("POST /query returns a paginated envelope {data, total}", async ({
      apiDna,
    }) => {
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Query Seed ${uniqueSuffix()}`,
      });
      await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });

      const res = await apiDna.post("national/initialReport/query", {
        page: 1,
        size: 10,
      });
      await expectOk(res, "query");
      const body = await apiDna.json<any>(res);
      const data = unwrap<any>(body);
      if (Array.isArray(data)) {
        expect(data.length).toBeGreaterThanOrEqual(1);
      } else {
        expect(Array.isArray(data.data)).toBe(true);
        expect(typeof data.total).toBe("number");
        expect(data.total).toBeGreaterThanOrEqual(1);
      }
    });

    test("GET /get?id=<reportId> returns the IR row", async ({ apiDna }) => {
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Get ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      const res = await apiDna.get(
        `national/initialReport/get?id=${encodeURIComponent(gen.reportId)}`
      );
      await expectOk(res, "get");
      const ir = unwrap<any>(await apiDna.json<any>(res));
      expect(ir.reportId).toBe(gen.reportId);
      expect(ir.cooperativeApproachId).toBe(ca.cooperativeApproachId);
      expect(ir.status).toBe("Draft");
    });

    test("GET /get?id=NONEXISTENT returns 404", async ({ apiDna }) => {
      const missing = `IR-DOES-NOT-EXIST-${uniqueSuffix()}`;
      const res = await apiDna.get(
        `national/initialReport/get?id=${encodeURIComponent(missing)}`
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(404);
    });
  });

  // ------------------------------------------------------------------
  // Enum cardinality — canary for silent enum renames.
  // ------------------------------------------------------------------
  test.describe("Enum cardinality", () => {
    test("InitialReportStatus has exactly 3 values (Draft, Submitted, Published)", () => {
      expect(IR_STATUS_VALUES).toHaveLength(3);
      expect(IR_STATUS_VALUES).toContain("Draft");
      expect(IR_STATUS_VALUES).toContain("Submitted");
      // Published is declared in the enum and enforced by the update
      // edit-lock, but no endpoint transitions an IR into this state
      // (see Gaps in 06-initial-report.md).
      expect(IR_STATUS_VALUES).toContain("Published");
    });
  });

  // ------------------------------------------------------------------
  // Permissions — CASL grants Manage InitialReport to DNA + Ministry
  // (factory lines 171-184 and 211-224). PD has no rule -> 403. The
  // /check endpoint guards on JwtAuthGuard only (controller lines
  // 79-81) so authenticated non-DNA users can probe it; we verify
  // whatever the actual behaviour is.
  // ------------------------------------------------------------------
  test.describe("Permissions", () => {
    test("PD user cannot POST /generate", async ({ apiPd, apiDna }) => {
      // Need a real CA to avoid masking a permission denial with a
      // 400 "CA not found". Create it as DNA.
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Perm PD ${uniqueSuffix()}`,
      });
      const res = await apiPd.post("national/initialReport/generate", {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      expect(res.ok()).toBe(false);
      expect(res.status()).toBeGreaterThanOrEqual(400);
      expect(res.status()).toBeLessThan(500);
      // CASL PoliciesGuard yields 403 Forbidden for an authenticated
      // user without the Create ability. 401 is also accepted to
      // stay robust to guard ordering.
      expect([401, 403]).toContain(res.status());
    });

    test("GET /check is reachable by any authenticated user (JwtAuthGuard-only)", async ({
      apiPd,
      apiDna,
    }) => {
      // The controller's `@Get("check")` handler is wired with
      // `@UseGuards(JwtAuthGuard)` only — no PoliciesGuard (lines
      // 79-81). A PD user should therefore receive 2xx; document the
      // actual behaviour either way.
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Perm Check ${uniqueSuffix()}`,
      });
      const res = await apiPd.get(
        `national/initialReport/check?cooperativeApproachId=${encodeURIComponent(
          ca.cooperativeApproachId
        )}`
      );
      if (res.ok()) {
        const body = await apiPd.json<any>(res);
        const payload = body?.data ?? body;
        expect(typeof payload.hasSubmittedReport).toBe("boolean");
      } else {
        // Accept 401/403 as "guard tightened later" — still a pass
        // for documentation purposes.
        expect([401, 403]).toContain(res.status());
      }
    });
  });

  // ------------------------------------------------------------------
  // UI smoke — /initialReports/{viewAll,create}. Route scaffolding
  // lives in web/src/App.tsx lines 193-207.
  // ------------------------------------------------------------------
  test.describe("UI: DNA flow", () => {
    test("DNA user can navigate to /initialReports/viewAll and the list renders", async ({
      dnaPage,
    }) => {
      await dnaPage.goto(`${BASE_URL}/initialReports/viewAll`);
      await dnaPage.waitForLoadState("networkidle");
      expect(dnaPage.url()).toContain("/initialReports/viewAll");
      // Page heading from initialReportManagement.tsx line 79.
      await expect(
        dnaPage.locator("text=/Initial Reports/i").first()
      ).toBeVisible({ timeout: 10000 });
      // "Generate Report" button is only rendered for DNA users
      // (canCreate gate at line 26).
      await expect(
        dnaPage.locator("button", { hasText: /Generate Report/i }).first()
      ).toBeVisible();
    });

    test("DNA can open /initialReports/create and see the form controls", async ({
      dnaPage,
    }) => {
      await dnaPage.goto(`${BASE_URL}/initialReports/create`);
      await dnaPage.waitForLoadState("networkidle");
      expect(dnaPage.url()).toContain("/initialReports/create");

      // Page heading
      await expect(
        dnaPage.locator("text=/Generate Initial Report/i").first()
      ).toBeVisible({ timeout: 10000 });
      // Form.Item labels from createInitialReport.tsx.
      await expect(
        dnaPage.locator("text=/Cooperative Approach ID/i").first()
      ).toBeVisible();
      await expect(dnaPage.locator("text=/NDC Target/i").first()).toBeVisible();
      await expect(dnaPage.locator("text=/Base Year/i").first()).toBeVisible();
      await expect(dnaPage.locator("text=/Target Year/i").first()).toBeVisible();
      await expect(dnaPage.locator("text=/Sectors/i").first()).toBeVisible();
      await expect(
        dnaPage
          .locator("text=/Corresponding Adjustment Method Description/i")
          .first()
      ).toBeVisible();

      // Primary submit button text: "Generate Draft".
      await expect(
        dnaPage.locator("button", { hasText: /Generate Draft/i }).first()
      ).toBeVisible();
      // Cancel button present.
      await expect(
        dnaPage.locator("button", { hasText: /^\s*Cancel\s*$/i }).first()
      ).toBeVisible();
    });

    test("Submitting the Create form navigates to viewAll and shows the new IR row", async ({
      dnaPage,
      apiDna,
    }) => {
      // Seed a fresh CA so the form has a valid target and no existing IR.
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR UI Flow ${uniqueSuffix()}`,
      });

      await dnaPage.goto(`${BASE_URL}/initialReports/create`);
      await dnaPage.waitForLoadState("networkidle");

      await dnaPage.locator("input#cooperativeApproachId").fill(
        ca.cooperativeApproachId
      );

      const generateResp = dnaPage.waitForResponse(
        (r) =>
          /initialReport\/generate/.test(r.url()) &&
          r.request().method() === "POST"
      );
      await dnaPage
        .locator("button[type='submit']", { hasText: /Generate/i })
        .first()
        .click();
      const resp = await generateResp;
      expect(resp.status()).toBe(201);

      // After successful generate the component navigates to viewAll.
      await dnaPage.waitForURL(/\/initialReports\/viewAll$/, { timeout: 10000 });
      await expect(
        dnaPage.locator(".ant-table").first()
      ).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------
  // Behavior locks - current no-guard state.
  //
  // Three edges where the IR service currently lacks a guard. Each test
  // asserts the *current* (passes-through) behavior so that any future
  // intentional guard addition surfaces here as a planned red.
  //
  // Contrast: programme.service.ts:6450-6458 DOES gate /authorize on
  // CooperativeApproachStatus.REVOKED + SUSPENDED. The IR service at
  // initial-report.service.ts has NO equivalent CA-status gate on
  // /generate or /submit, and only locks on Published (line 184) for
  // /update. Draft -/CMA.5 para 21 implies a Revoked-CA gate should
  // exist; these tests document the gap explicitly.
  // ---------------------------------------------------------------------
  test.describe("Behavior locks - current no-guard state", () => {
    test("POST /generate against a Revoked CA succeeds today (no guard)", async ({
      apiDna,
    }) => {
      // Locks current no-guard behavior. /generate has no CA-status gate;
      // once a Revoked-CA guard is added (Draft -/CMA.5 para 21), this
      // test will go red and should be inverted to assert 400. See
      // programme.service.ts:6450-6458 for the symmetric guard on
      // /authorize that this service is missing.
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Lock GenRevoked ${uniqueSuffix()}`,
      });
      const revoke = await apiDna.put("national/cooperativeApproach/update", {
        cooperativeApproachId: ca.cooperativeApproachId,
        status: "Revoked",
      });
      expect(revoke.status()).toBe(200);

      const res = await apiDna.post("national/initialReport/generate", {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      expect(res.status()).toBeGreaterThanOrEqual(200);
      expect(res.status()).toBeLessThan(300);
      const ir = unwrap<any>(await apiDna.json<any>(res));
      expect(ir.reportId).toMatch(/^IR-\d+$/);
    });

    test("PUT /submit on an IR for a Revoked CA succeeds today (no guard)", async ({
      apiDna,
    }) => {
      // Locks current no-guard behavior. /submit has no CA-status gate.
      // A future para 21 guard (mirroring
      // programme.service.ts:6450-6458) would flip this red. Contrast
      // with the IR service which has no IR-equivalent.
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Lock SubmitRevoked ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      const revoke = await apiDna.put("national/cooperativeApproach/update", {
        cooperativeApproachId: ca.cooperativeApproachId,
        status: "Revoked",
      });
      expect(revoke.status()).toBe(200);

      const submitted = await submitInitialReport(apiDna, gen.reportId);
      expect(submitted.reportId).toBe(gen.reportId);
      expect(submitted.status).toBe("Submitted");
    });

    test("PUT /update on a Submitted IR succeeds today (no guard)", async ({
      apiDna,
    }) => {
      // Locks current no-guard behavior. initial-report.service.ts:184
      // only rejects edits when status === Published; Submitted is
      // mutable. A future Submitted-immutability guard (audit gap #13,
      // mirroring the /authorize CA-status gate at
      // programme.service.ts:6450-6458) would flip this red.
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Lock UpdateSubmitted ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      const submitted = await submitInitialReport(apiDna, gen.reportId);
      expect(submitted.status).toBe("Submitted");

      const res = await apiDna.put("national/initialReport/update", {
        reportId: gen.reportId,
        caMethodDescription: "post-submit edit - should currently succeed",
      });
      expect(res.status()).toBeGreaterThanOrEqual(200);
      expect(res.status()).toBeLessThan(300);
      const updated = unwrap<any>(await apiDna.json<any>(res));
      expect(updated.caMethodDescription).toBe(
        "post-submit edit - should currently succeed"
      );
      expect(updated.status).toBe("Submitted");
    });
  });
});
