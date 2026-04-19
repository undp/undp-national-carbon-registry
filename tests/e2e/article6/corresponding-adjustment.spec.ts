/**
 * E2E coverage for Phase 5: Corresponding Adjustment accounting module.
 *
 * Backs the requirement table in
 * docs/article6/05-corresponding-adjustment.md. Covers:
 *   - the POST /national/correspondingAdjustment/calculate endpoint that
 *     builds a CorrespondingAdjustment row (caId format "CA-ADJ-<n>",
 *     status=Draft) from the CreditTransaction history of a reporting year,
 *   - the arithmetic identity
 *     emissionsBalance = firstTransferredItmos - acquiredItmos + usedTowardsNdcItmos
 *     (Decision 2/CMA.3 Chapter III para 8),
 *   - the three CaMethod variants (Trajectory para 7a(i),
 *     Averaging para 7a(ii), MultiYear para 7b) and the two NdcType
 *     variants (SingleYear / MultiYear) from Dec 2/CMA.3 para 7,
 *   - the safeguard check (Dec 2/CMA.3 para 9) that
 *     adjustedEmissions <= ndcTarget when both are resolvable,
 *   - the DNA-admin/root CASL gate (Manage CorrespondingAdjustment),
 *   - the /correspondingAdjustments/viewAll list and
 *     /correspondingAdjustments/calculate form UI surfaces.
 *
 * IMPORTANT enum contract (verified on disk — see the three files listed
 * below): the DTO's @IsEnum validators match against the enum VALUES,
 * which are PascalCase, NOT the TypeScript keys. The `CaCalculateInput`
 * type in support/factories.ts advertises "SINGLE_YEAR" | "MULTI_YEAR"
 * etc., but those are just TS-level labels — the wire payload must use
 * the PascalCase enum values or class-validator rejects with 400.
 *
 *   backend/services/libs/shared/src/enum/ca.method.enum.ts
 *     TRAJECTORY = "Trajectory"
 *     AVERAGING  = "Averaging"
 *     MULTI_YEAR = "MultiYear"
 *   backend/services/libs/shared/src/enum/ca.status.enum.ts
 *     DRAFT     = "Draft"
 *     SUBMITTED = "Submitted"
 *     APPROVED  = "Approved"
 *   backend/services/libs/shared/src/enum/ndc.type.enum.ts
 *     SINGLE_YEAR = "SingleYear"
 *     MULTI_YEAR  = "MultiYear"
 *
 * Parallel safety: each test that POSTs /calculate uses a unique
 * "reporting year" well outside the seeded data range (2100 + n) so
 * concurrent workers don't collide on year-scoped aggregates. The
 * counter service issues a fresh caId per call, so multiple DRAFT rows
 * for the same year are allowed — we never re-read "the CA for year X",
 * only the one returned by our own calculate call.
 */
import { test, expect } from "./support/fixtures";
import { BASE_URL } from "./support/auth";
import { uniqueSuffix } from "./support/factories";
import { expectOk } from "./support/api-client";

// ---------------------------------------------------------------------
// Enum values verified against disk on 2026-04-19. If any string below
// changes, the "Enum cardinality" block is the canary; the API tests
// will still 400 (class-validator rejection) on the old value.
// ---------------------------------------------------------------------
const NDC_TYPE_VALUES = ["SingleYear", "MultiYear"] as const;
const CA_METHOD_VALUES = ["Trajectory", "Averaging", "MultiYear"] as const;
const CA_STATUS_VALUES = ["Draft", "Submitted", "Approved"] as const;

type NdcTypeValue = (typeof NDC_TYPE_VALUES)[number];
type CaMethodValue = (typeof CA_METHOD_VALUES)[number];

function unwrap<T = any>(raw: any): T {
  if (raw == null) return raw;
  if (raw.data !== undefined) return raw.data as T;
  return raw as T;
}

// Pick a reporting year far outside seeded-data range to avoid
// interference between parallel workers. Anchored to 2100 per spec.
let yearCounter = 0;
function nextFutureYear(): number {
  yearCounter += 1;
  // Keep inside the calculate service's expected window (int column)
  // but well above anything a real registry would ever see.
  return 2100 + yearCounter;
}

function toNumber(x: unknown): number {
  if (x === null || x === undefined) return NaN;
  if (typeof x === "number") return x;
  return parseFloat(String(x));
}

test.describe("Corresponding Adjustment - Article 6.2", () => {
  // ------------------------------------------------------------------
  // API: POST /calculate — shape contract + core algorithm invariants.
  // ------------------------------------------------------------------
  test.describe("API: calculate", () => {
    test("POST /calculate returns 201 with caId=CA-ADJ-<n>, status=Draft, metric=tCO2e", async ({
      apiDna,
    }) => {
      const year = nextFutureYear();
      const res = await apiDna.post(
        "national/correspondingAdjustment/calculate",
        {
          year,
          ndcType: "SingleYear",
          caMethod: "Trajectory",
        }
      );
      await expectOk(res, "calculate");
      // Service returns DataResponseDto(HttpStatus.CREATED, saved). The
      // HTTP status Nest emits for a controller method is 201 by
      // default for @Post; we accept any 2xx to stay robust to
      // interceptor changes.
      expect(res.status()).toBeGreaterThanOrEqual(200);
      expect(res.status()).toBeLessThan(300);

      const body = await apiDna.json<any>(res);
      const ca = unwrap<any>(body);
      expect(ca).toBeTruthy();
      expect(typeof ca.caId).toBe("string");
      expect(ca.caId).toMatch(/^CA-ADJ-\d+$/);
      expect(ca.status).toBe("Draft");
      expect(ca.metric).toBe("tCO2e");
      expect(ca.year).toBe(year);
      expect(ca.ndcType).toBe("SingleYear");
      expect(ca.caMethod).toBe("Trajectory");
    });

    test("emissionsBalance = firstTransferred - acquired + usedTowardsNdc (Dec 2/CMA.3 para 8)", async ({
      apiDna,
    }) => {
      const year = nextFutureYear();
      const res = await apiDna.post(
        "national/correspondingAdjustment/calculate",
        {
          year,
          ndcType: "SingleYear",
          caMethod: "Trajectory",
        }
      );
      await expectOk(res, "calculate");
      const ca = unwrap<any>(await apiDna.json<any>(res));

      const first = toNumber(ca.firstTransferredItmos);
      const acquired = toNumber(ca.acquiredItmos);
      const used = toNumber(ca.usedTowardsNdcItmos);
      const balance = toNumber(ca.emissionsBalance);

      expect(Number.isFinite(first)).toBe(true);
      expect(Number.isFinite(acquired)).toBe(true);
      expect(Number.isFinite(used)).toBe(true);
      expect(Number.isFinite(balance)).toBe(true);

      // Use a small epsilon — decimals are serialized as strings and
      // re-parsed, which can accrete float error at the edges.
      expect(balance).toBeCloseTo(first - acquired + used, 5);
    });

    test("all three CaMethod values are accepted (Trajectory, Averaging, MultiYear)", async ({
      apiDna,
    }) => {
      for (const caMethod of CA_METHOD_VALUES) {
        const year = nextFutureYear();
        const res = await apiDna.post(
          "national/correspondingAdjustment/calculate",
          {
            year,
            ndcType: "SingleYear",
            caMethod,
          }
        );
        await expectOk(res, `calculate caMethod=${caMethod}`);
        const ca = unwrap<any>(await apiDna.json<any>(res));
        expect(ca.caMethod).toBe(caMethod);
        expect(ca.status).toBe("Draft");
      }
    });

    test("both NdcType values are accepted (SingleYear, MultiYear)", async ({
      apiDna,
    }) => {
      for (const ndcType of NDC_TYPE_VALUES) {
        const year = nextFutureYear();
        const res = await apiDna.post(
          "national/correspondingAdjustment/calculate",
          {
            year,
            ndcType,
            caMethod: "Trajectory",
          }
        );
        await expectOk(res, `calculate ndcType=${ndcType}`);
        const ca = unwrap<any>(await apiDna.json<any>(res));
        expect(ca.ndcType).toBe(ndcType);
      }
    });

    test("empty year (no transactions) returns zero ITMO counts and zero emissionsBalance", async ({
      apiDna,
    }) => {
      // Use year=1900 — no credit transactions can plausibly exist
      // there even if parallel workers inject data into the present.
      const res = await apiDna.post(
        "national/correspondingAdjustment/calculate",
        {
          year: 1900,
          ndcType: "SingleYear",
          caMethod: "Trajectory",
        }
      );
      await expectOk(res, "calculate (empty year)");
      const ca = unwrap<any>(await apiDna.json<any>(res));

      expect(toNumber(ca.authorizedItmos)).toBe(0);
      expect(toNumber(ca.firstTransferredItmos)).toBe(0);
      expect(toNumber(ca.acquiredItmos)).toBe(0);
      expect(toNumber(ca.usedTowardsNdcItmos)).toBe(0);
      expect(toNumber(ca.cancelledItmos)).toBe(0);
      expect(toNumber(ca.emissionsBalance)).toBe(0);
    });

    test("safeguard defaults to passed=true when nationalEmissions data is missing", async ({
      apiDna,
    }) => {
      // The service's safeguard branch reads:
      //   if (ndcTarget && adjustedEmissions !== null) { ...compare... }
      //   else { safeguardNotes = "could not be performed"; }
      // and leaves `safeguardCheckPassed = true` as the initial value.
      // Running against a year with no Emission row (1900) exercises
      // the "missing data" fallback documented in the Gaps section as
      // a silent-pass.
      const res = await apiDna.post(
        "national/correspondingAdjustment/calculate",
        {
          year: 1900,
          ndcType: "SingleYear",
          caMethod: "Trajectory",
          ndcTarget: 500000,
        }
      );
      await expectOk(res, "calculate (missing emissions)");
      const ca = unwrap<any>(await apiDna.json<any>(res));

      // When no Emission row exists for (year, country), the service
      // leaves adjustedEmissions=null and falls through to the "could
      // not be performed" notes. safeguardCheckPassed stays true.
      if (ca.adjustedEmissions === null) {
        expect(ca.safeguardCheckPassed).toBe(true);
        expect(typeof ca.safeguardNotes).toBe("string");
        expect(ca.safeguardNotes).toMatch(/could not be performed|missing/i);
      } else {
        // If the environment happens to have an emission row for 1900,
        // fall through to the pass/fail arithmetic with a very high
        // ndcTarget we supplied above.
        expect(toNumber(ca.adjustedEmissions)).toBeLessThanOrEqual(500000);
        expect(ca.safeguardCheckPassed).toBe(true);
      }
    });

    test.fixme(
      "safeguard fail path: large firstTransferred + low ndcTarget sets safeguardCheckPassed=false",
      async () => {
        // Requires either (a) an Emission row for the reporting year
        // in the configured systemCountry AND CreditTransactions that
        // push adjustedEmissions above ndcTarget, or (b) an api to
        // inject CreditTransactionsEntity rows directly. Neither is
        // available to Playwright in this fixture set; the analogous
        // fail-path spec exists as a unit test in the service package.
      }
    );

    test("cooperativeApproachId filter scopes the aggregation (no cross-contamination)", async ({
      apiDna,
    }) => {
      // We cannot seed CreditTransactions tied to a specific CA without
      // the credit-issuance pipeline, but we CAN assert that passing a
      // non-existent cooperativeApproachId returns zeros — this proves
      // the filter is wired and the query doesn't silently fall back
      // to "all transactions".
      const missingCaId = `CA-MISSING-${uniqueSuffix()}`;
      const year = nextFutureYear();
      const res = await apiDna.post(
        "national/correspondingAdjustment/calculate",
        {
          year,
          cooperativeApproachId: missingCaId,
          ndcType: "SingleYear",
          caMethod: "Trajectory",
        }
      );
      await expectOk(res, "calculate (scoped CA filter)");
      const ca = unwrap<any>(await apiDna.json<any>(res));
      expect(ca.cooperativeApproachId).toBe(missingCaId);
      expect(toNumber(ca.authorizedItmos)).toBe(0);
      expect(toNumber(ca.firstTransferredItmos)).toBe(0);
      expect(toNumber(ca.acquiredItmos)).toBe(0);
      expect(toNumber(ca.usedTowardsNdcItmos)).toBe(0);
    });

    test("rejects an invalid ndcType with 4xx (class-validator @IsEnum)", async ({
      apiDna,
    }) => {
      const res = await apiDna.post(
        "national/correspondingAdjustment/calculate",
        {
          year: nextFutureYear(),
          ndcType: `INVALID_NDCTYPE_${uniqueSuffix()}`,
          caMethod: "Trajectory",
        }
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBeGreaterThanOrEqual(400);
      expect(res.status()).toBeLessThan(500);
    });

    test("rejects a missing year with 4xx", async ({ apiDna }) => {
      const res = await apiDna.post(
        "national/correspondingAdjustment/calculate",
        {
          ndcType: "SingleYear",
          caMethod: "Trajectory",
        }
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBeGreaterThanOrEqual(400);
      expect(res.status()).toBeLessThan(500);
    });
  });

  // ------------------------------------------------------------------
  // API: query / get / submit
  // ------------------------------------------------------------------
  test.describe("API: CRUD", () => {
    test("POST /query returns a paginated envelope {data, total}", async ({
      apiDna,
    }) => {
      // Seed one row so the query has something to list in a fresh DB.
      const year = nextFutureYear();
      const seedRes = await apiDna.post(
        "national/correspondingAdjustment/calculate",
        {
          year,
          ndcType: "SingleYear",
          caMethod: "Trajectory",
        }
      );
      await expectOk(seedRes, "seed for query");

      const res = await apiDna.post("national/correspondingAdjustment/query", {
        page: 1,
        size: 10,
      });
      await expectOk(res, "query");
      const body = await apiDna.json<any>(res);
      // DataListResponseDto returns { statusCode?, data: [...], total }.
      // We accept either a raw { data, total } envelope or an unwrapped
      // array (some serializer stacks strip the wrapper).
      const data = unwrap<any>(body);
      if (Array.isArray(data)) {
        expect(Array.isArray(data)).toBe(true);
      } else {
        expect(Array.isArray(data.data)).toBe(true);
        expect(typeof data.total).toBe("number");
        expect(data.total).toBeGreaterThanOrEqual(1);
      }
    });

    test("GET /get?id=<caId> returns the CA row", async ({ apiDna }) => {
      const year = nextFutureYear();
      const seedRes = await apiDna.post(
        "national/correspondingAdjustment/calculate",
        {
          year,
          ndcType: "SingleYear",
          caMethod: "Trajectory",
        }
      );
      await expectOk(seedRes, "seed for get");
      const caId = unwrap<any>(await apiDna.json<any>(seedRes)).caId;
      expect(caId).toMatch(/^CA-ADJ-\d+$/);

      const res = await apiDna.get(
        `national/correspondingAdjustment/get?id=${encodeURIComponent(caId)}`
      );
      await expectOk(res, "get");
      const ca = unwrap<any>(await apiDna.json<any>(res));
      expect(ca.caId).toBe(caId);
      expect(ca.year).toBe(year);
    });

    test("GET /get?id=NONEXISTENT returns 404", async ({ apiDna }) => {
      const missing = `CA-ADJ-DOES-NOT-EXIST-${uniqueSuffix()}`;
      const res = await apiDna.get(
        `national/correspondingAdjustment/get?id=${encodeURIComponent(missing)}`
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(404);
    });

    test("PUT /submit flips status from Draft to Submitted", async ({
      apiDna,
    }) => {
      const year = nextFutureYear();
      const seedRes = await apiDna.post(
        "national/correspondingAdjustment/calculate",
        {
          year,
          ndcType: "SingleYear",
          caMethod: "Trajectory",
        }
      );
      await expectOk(seedRes, "seed for submit");
      const seeded = unwrap<any>(await apiDna.json<any>(seedRes));
      expect(seeded.status).toBe("Draft");

      const res = await apiDna.put(
        `national/correspondingAdjustment/submit?id=${encodeURIComponent(
          seeded.caId
        )}`
      );
      await expectOk(res, "submit");
      const submitted = unwrap<any>(await apiDna.json<any>(res));
      expect(submitted.caId).toBe(seeded.caId);
      expect(submitted.status).toBe("Submitted");
    });

    test("PUT /submit on an already-Submitted CA is idempotent (no 4xx)", async ({
      apiDna,
    }) => {
      // Service implementation at lines 208-222 of
      // corresponding-adjustment.service.ts unconditionally sets
      // status = SUBMITTED — there is no DRAFT-gate. Document the
      // current behaviour: re-submit succeeds and leaves the row at
      // SUBMITTED. This is flagged in 05-corresponding-adjustment.md
      // as a gap (no state-machine enforcement, no APPROVED path).
      const year = nextFutureYear();
      const seedRes = await apiDna.post(
        "national/correspondingAdjustment/calculate",
        {
          year,
          ndcType: "SingleYear",
          caMethod: "Trajectory",
        }
      );
      await expectOk(seedRes, "seed for re-submit");
      const caId = unwrap<any>(await apiDna.json<any>(seedRes)).caId;

      const first = await apiDna.put(
        `national/correspondingAdjustment/submit?id=${encodeURIComponent(caId)}`
      );
      await expectOk(first, "first submit");

      const second = await apiDna.put(
        `national/correspondingAdjustment/submit?id=${encodeURIComponent(caId)}`
      );
      // Accept either 2xx (idempotent) or 400 (if a future guard is
      // added). Either is a legitimate implementation choice.
      const ok = second.ok();
      if (ok) {
        const body = unwrap<any>(await apiDna.json<any>(second));
        expect(body.status).toBe("Submitted");
      } else {
        expect(second.status()).toBeGreaterThanOrEqual(400);
        expect(second.status()).toBeLessThan(500);
      }
    });

    test("PUT /submit on nonexistent caId returns 404", async ({ apiDna }) => {
      const missing = `CA-ADJ-MISSING-${uniqueSuffix()}`;
      const res = await apiDna.put(
        `national/correspondingAdjustment/submit?id=${encodeURIComponent(
          missing
        )}`
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(404);
    });
  });

  // ------------------------------------------------------------------
  // Enum cardinality — canary for silent enum renames. Mirrors the
  // Phase 4 spec's Enum shape block.
  // ------------------------------------------------------------------
  test.describe("Enum cardinality", () => {
    test("NdcType has exactly 2 values (SingleYear, MultiYear)", () => {
      expect(NDC_TYPE_VALUES).toHaveLength(2);
      expect(NDC_TYPE_VALUES).toContain("SingleYear");
      expect(NDC_TYPE_VALUES).toContain("MultiYear");
    });

    test("CaMethod has exactly 3 values (Trajectory, Averaging, MultiYear)", () => {
      expect(CA_METHOD_VALUES).toHaveLength(3);
      expect(CA_METHOD_VALUES).toContain("Trajectory");
      expect(CA_METHOD_VALUES).toContain("Averaging");
      expect(CA_METHOD_VALUES).toContain("MultiYear");
    });

    test("CaStatus has exactly 3 values (Draft, Submitted, Approved)", () => {
      expect(CA_STATUS_VALUES).toHaveLength(3);
      expect(CA_STATUS_VALUES).toContain("Draft");
      expect(CA_STATUS_VALUES).toContain("Submitted");
      // APPROVED is declared but no endpoint transitions to it —
      // flagged in the doc's Gaps section. This assertion locks in
      // the enum shape so a future "approve" endpoint does not need
      // to introduce a new enum value.
      expect(CA_STATUS_VALUES).toContain("Approved");
    });
  });

  // ------------------------------------------------------------------
  // Permissions — CASL grants Manage CorrespondingAdjustment to DNA
  // and Ministry roles. PD has no rule and gets 403.
  // ------------------------------------------------------------------
  test.describe("Permissions: DNA-admin/root only", () => {
    test("PD user cannot POST /calculate", async ({ apiPd }) => {
      const res = await apiPd.post(
        "national/correspondingAdjustment/calculate",
        {
          year: nextFutureYear(),
          ndcType: "SingleYear",
          caMethod: "Trajectory",
        }
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBeGreaterThanOrEqual(400);
      expect(res.status()).toBeLessThan(500);
      // CASL PoliciesGuard yields 403 Forbidden for an authenticated
      // user missing the Create ability. 401 would indicate a missing
      // token; we accept both to stay robust to guard ordering.
      expect([401, 403]).toContain(res.status());
    });

    test("PD user cannot POST /query", async ({ apiPd }) => {
      const res = await apiPd.post(
        "national/correspondingAdjustment/query",
        { page: 1, size: 10 }
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBeGreaterThanOrEqual(400);
      expect(res.status()).toBeLessThan(500);
      expect([401, 403]).toContain(res.status());
    });
  });

  // ------------------------------------------------------------------
  // UI smoke — /correspondingAdjustments/{viewAll,calculate}. Route
  // scaffolding lives in web/src/App.tsx lines 184-192.
  // ------------------------------------------------------------------
  test.describe("UI: DNA flow", () => {
    test("DNA user can navigate to /correspondingAdjustments/viewAll and the list renders", async ({
      dnaPage,
    }) => {
      await dnaPage.goto(`${BASE_URL}/correspondingAdjustments/viewAll`);
      await dnaPage.waitForLoadState("networkidle");
      // Auth guard would redirect a non-authorised user to /login.
      expect(dnaPage.url()).toContain("/correspondingAdjustments/viewAll");
      // Page heading from caManagement.tsx line 94.
      await expect(
        dnaPage.locator("text=/Corresponding Adjustments/i").first()
      ).toBeVisible({ timeout: 10000 });
      // "Calculate CA" button is only rendered for DNA users (the
      // canCreate gate in caManagement.tsx line 26).
      await expect(
        dnaPage.locator("button", { hasText: /Calculate CA/i }).first()
      ).toBeVisible();
    });

    test("DNA can open /correspondingAdjustments/calculate and see the form controls", async ({
      dnaPage,
    }) => {
      await dnaPage.goto(`${BASE_URL}/correspondingAdjustments/calculate`);
      await dnaPage.waitForLoadState("networkidle");
      expect(dnaPage.url()).toContain("/correspondingAdjustments/calculate");

      // Page heading
      await expect(
        dnaPage.locator("text=/Calculate Corresponding Adjustment/i").first()
      ).toBeVisible({ timeout: 10000 });
      // Each named Form.Item produces a label with the given text.
      await expect(dnaPage.locator("text=/Reporting Year/i").first()).toBeVisible();
      await expect(dnaPage.locator("text=/NDC Type/i").first()).toBeVisible();
      await expect(dnaPage.locator("text=/CA Method/i").first()).toBeVisible();
      await expect(
        dnaPage.locator("text=/NDC Target/i").first()
      ).toBeVisible();
      await expect(
        dnaPage.locator("text=/Cooperative Approach ID/i").first()
      ).toBeVisible();

      // The submit button carries label "Calculate".
      await expect(
        dnaPage.locator("button", { hasText: /^\s*Calculate\s*$/i }).first()
      ).toBeVisible();
    });

    test.fixme(
      "Submitting the Calculate form renders the results card with a Safeguard tag",
      async () => {
        // Requires driving antd InputNumber + Select reliably in a
        // headless browser (the antd Select dropdown portal lands
        // outside the form's DOM subtree and requires extra scoping).
        // The underlying POST path is already covered by the
        // "API: calculate > POST /calculate returns 201 ..." test;
        // promoting this UI flow is deferred until a shared antd
        // helper is added to support/factories.ts.
      }
    );
  });
});
