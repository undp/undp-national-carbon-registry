/**
 * E2E coverage for Phase 1: Cooperative Approach (Article 6.2).
 *
 * Backs the requirement table in
 * docs/article6/01-cooperative-approach.md. Covers the REST surface
 * (POST /create, POST /query, GET /get, PUT /update), the DNA-facing UI
 * flow (list, add, details, status change), and the PD read-only
 * permission boundary.
 *
 * Parallel safety: every mutating test derives a unique title via
 * uniqueSuffix() so specs do not collide when Playwright runs workers
 * against a shared backend.
 */
import { test, expect } from "./support/fixtures";
import { BASE_URL, login } from "./support/auth";
import { ApiClient } from "./support/api-client";
import {
  createCooperativeApproach,
  generateInitialReport,
  queryCooperativeApproaches,
  submitInitialReport,
  uniqueSuffix,
} from "./support/factories";

// Helper: extract entity payload whether the API wraps it in
// `{ data: {...} }` or returns the entity directly. Used throughout
// because the response envelope differs between controllers.
function unwrap<T = any>(raw: any): T {
  if (raw == null) return raw;
  if (raw.data !== undefined) return raw.data as T;
  return raw as T;
}

test.describe("Cooperative Approach - Article 6.2", () => {
  // ------------------------------------------------------------------
  // API: CRUD happy paths + validation + 404s
  // ------------------------------------------------------------------
  test.describe("API: CRUD", () => {
    test("POST /create with minimal required fields returns CA-<n> in DRAFT", async ({
      apiDna,
    }) => {
      const title = `CA Create Minimal ${uniqueSuffix()}`;
      const res = await apiDna.post("national/cooperativeApproach/create", {
        title,
        participatingParties: ["GH", "CH"],
      });
      expect(res.status()).toBe(201);
      const body = await apiDna.json<any>(res);
      const entity = unwrap(body);
      expect(entity.cooperativeApproachId).toMatch(/^CA-\d+/);
      expect(entity.title).toBe(title);
      // Backend forces DRAFT on create even if caller tries otherwise.
      expect(entity.status).toBe("Draft");
      expect(Array.isArray(entity.participatingParties)).toBe(true);
      // Host party (systemCountryCode=NG in the e2e stack) is derived
      // server-side and always unioned into participatingParties.
      expect(entity.participatingParties).toEqual(
        expect.arrayContaining(["GH", "CH", "NG"])
      );
      expect(entity.hostParty).toBe("NG");
      expect(Number(entity.createdTime)).toBeGreaterThan(0);
    });

    test("POST /create missing participatingParties is rejected by validation", async ({
      apiDna,
    }) => {
      // CooperativeApproachCreateDto enforces @IsArray, @ArrayMinSize(1)
      // on participatingParties. Omitting the field should surface a
      // 400 via the global ValidationPipe. The assertion is defensive:
      // we accept any 4xx so the test survives pipe configuration
      // drift, but flag anything outside that range as a regression.
      const res = await apiDna.post("national/cooperativeApproach/create", {
        title: `CA Invalid ${uniqueSuffix()}`,
        // participatingParties intentionally omitted
      });
      expect(res.ok()).toBe(false);
      expect(res.status()).toBeGreaterThanOrEqual(400);
      expect(res.status()).toBeLessThan(500);
    });

    test("GET /get returns the entity for an existing id", async ({
      apiDna,
    }) => {
      const created = await createCooperativeApproach(apiDna, {
        title: `CA Get ${uniqueSuffix()}`,
      });
      const res = await apiDna.get(
        `national/cooperativeApproach/get?id=${encodeURIComponent(
          created.cooperativeApproachId
        )}`
      );
      expect(res.status()).toBe(200);
      const entity = unwrap(await apiDna.json<any>(res));
      expect(entity.cooperativeApproachId).toBe(created.cooperativeApproachId);
      expect(entity.title).toBe(created.title);
    });

    test("GET /get returns 404 for a non-existent id", async ({ apiDna }) => {
      const res = await apiDna.get(
        "national/cooperativeApproach/get?id=CA-NONEXISTENT-999"
      );
      expect(res.status()).toBe(404);
    });

    test("POST /query returns paginated items with total >= 1 after creation", async ({
      apiDna,
    }) => {
      await createCooperativeApproach(apiDna, {
        title: `CA Query Seed ${uniqueSuffix()}`,
      });
      const { items, total } = await queryCooperativeApproaches(apiDna, 1, 10);
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThanOrEqual(1);
      expect(total).toBeGreaterThanOrEqual(1);
      for (const it of items) {
        expect(it.cooperativeApproachId).toMatch(/^CA-\d+/);
      }
    });

    test("PUT /update changes title + description and bumps updatedTime", async ({
      apiDna,
    }) => {
      const created = await createCooperativeApproach(apiDna, {
        title: `CA Update Before ${uniqueSuffix()}`,
        description: "before",
      });
      const originalUpdatedTime = Number(created.raw.updatedTime ?? 0);
      // Ensure any monotonic clock granularity gap is crossed before
      // we PUT; bigint epoch ms can otherwise read identical on fast
      // backends.
      await new Promise((r) => setTimeout(r, 20));

      const newTitle = `CA Update After ${uniqueSuffix()}`;
      const res = await apiDna.put("national/cooperativeApproach/update", {
        cooperativeApproachId: created.cooperativeApproachId,
        title: newTitle,
        description: "after",
      });
      expect(res.status()).toBe(200);
      const entity = unwrap(await apiDna.json<any>(res));
      expect(entity.title).toBe(newTitle);
      expect(entity.description).toBe("after");
      expect(Number(entity.updatedTime)).toBeGreaterThanOrEqual(
        originalUpdatedTime
      );
    });

    test("PUT /update with a non-existent id returns 404", async ({
      apiDna,
    }) => {
      const res = await apiDna.put("national/cooperativeApproach/update", {
        cooperativeApproachId: "CA-DOES-NOT-EXIST-9999",
        title: "irrelevant",
      });
      // Service raises HttpException with HttpStatus.NOT_FOUND; we
      // accept the broader 4xx window defensively per spec guidance.
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(404);
    });

    test("status lifecycle DRAFT -> ACTIVE -> SUSPENDED -> COMPLETED", async ({
      apiDna,
    }) => {
      const created = await createCooperativeApproach(apiDna, {
        title: `CA Lifecycle ${uniqueSuffix()}`,
      });
      const id = created.cooperativeApproachId;

      // Initial status must be Draft (enforced server-side at create).
      expect(created.raw.status).toBe("Draft");

      for (const next of ["Active", "Suspended", "Completed"] as const) {
        const res = await apiDna.put("national/cooperativeApproach/update", {
          cooperativeApproachId: id,
          status: next,
        });
        expect(res.status()).toBe(200);
        const entity = unwrap(await apiDna.json<any>(res));
        expect(entity.status).toBe(next);
      }

      const finalRes = await apiDna.get(
        `national/cooperativeApproach/get?id=${encodeURIComponent(id)}`
      );
      expect(finalRes.status()).toBe(200);
      const finalEntity = unwrap(await apiDna.json<any>(finalRes));
      expect(finalEntity.status).toBe("Completed");
    });

    // Audit gap #11 — the new Revoked terminal state (Draft -/CMA.5 paras
    // 20-21) was added in the Phase 6 compliance fix but never exercised
    // as a direct Draft -> Revoked transition. Locks the happy path for
    // an immediate revocation of a freshly-created CA.
    test("status Draft -> Revoked direct transition persists", async ({
      apiDna,
    }) => {
      const created = await createCooperativeApproach(apiDna, {
        title: `CA Draft Revoked ${uniqueSuffix()}`,
      });
      const id = created.cooperativeApproachId;
      expect(created.raw.status).toBe("Draft");

      const res = await apiDna.put("national/cooperativeApproach/update", {
        cooperativeApproachId: id,
        status: "Revoked",
      });
      expect(res.status()).toBe(200);

      const getRes = await apiDna.get(
        `national/cooperativeApproach/get?id=${encodeURIComponent(id)}`
      );
      expect(getRes.status()).toBe(200);
      const entity = unwrap(await apiDna.json<any>(getRes));
      expect(entity.status).toBe("Revoked");
    });

    // Audit gap #11 — Suspended -> Revoked direct transition. Mirrors
    // the Draft -> Revoked test for the case where an in-flight CA is
    // paused, then revoked outright without returning to Active or
    // Completed. Article 6 semantics permit revocation from any
    // non-terminal prior state.
    test("status Draft -> Active -> Suspended -> Revoked persists", async ({
      apiDna,
    }) => {
      const created = await createCooperativeApproach(apiDna, {
        title: `CA Suspended Revoked ${uniqueSuffix()}`,
      });
      const id = created.cooperativeApproachId;

      for (const next of ["Active", "Suspended", "Revoked"] as const) {
        const res = await apiDna.put("national/cooperativeApproach/update", {
          cooperativeApproachId: id,
          status: next,
        });
        expect(res.status()).toBe(200);
        const entity = unwrap(await apiDna.json<any>(res));
        expect(entity.status).toBe(next);
      }

      const finalRes = await apiDna.get(
        `national/cooperativeApproach/get?id=${encodeURIComponent(id)}`
      );
      expect(finalRes.status()).toBe(200);
      const finalEntity = unwrap(await apiDna.json<any>(finalRes));
      expect(finalEntity.status).toBe("Revoked");
    });

    // Audit gap #12 — non-linear transition: Active -> Completed
    // skipping Suspended. The CA lifecycle spec does not mandate
    // Suspended as an intermediate state, so this is the intended
    // happy path for a CA that simply concludes while active. Locks
    // the accepted behaviour so a future regression that forces
    // Active -> Suspended -> Completed would surface here.
    test("status Draft -> Active -> Completed (skipping Suspended) persists", async ({
      apiDna,
    }) => {
      const created = await createCooperativeApproach(apiDna, {
        title: `CA Active Completed ${uniqueSuffix()}`,
      });
      const id = created.cooperativeApproachId;

      for (const next of ["Active", "Completed"] as const) {
        const res = await apiDna.put("national/cooperativeApproach/update", {
          cooperativeApproachId: id,
          status: next,
        });
        expect(res.status()).toBe(200);
        const entity = unwrap(await apiDna.json<any>(res));
        expect(entity.status).toBe(next);
      }

      const finalRes = await apiDna.get(
        `national/cooperativeApproach/get?id=${encodeURIComponent(id)}`
      );
      expect(finalRes.status()).toBe(200);
      const finalEntity = unwrap(await apiDna.json<any>(finalRes));
      expect(finalEntity.status).toBe("Completed");
    });

    // Audit gap #5 — backend allows any status transition via PUT;
    // spec says Completed is terminal per Article 6 semantics. A
    // Completed CA that can be resurrected to Active would let a
    // Party re-open a wound-down arrangement and issue fresh ITMOs.
    // Expected: 400 on the reactivation attempt.
    test(
      "status Completed -> Active is rejected (terminal-state guard)",
      async ({ apiDna }) => {
        const created = await createCooperativeApproach(apiDna, {
          title: `CA Completed Reactivate ${uniqueSuffix()}`,
        });
        const id = created.cooperativeApproachId;

        for (const next of ["Active", "Suspended", "Completed"] as const) {
          const res = await apiDna.put("national/cooperativeApproach/update", {
            cooperativeApproachId: id,
            status: next,
          });
          expect(res.status()).toBe(200);
        }

        // Attempt to reactivate a Completed CA. Terminal-state guard
        // should reject with 400. Defensive window: any 4xx counts,
        // but the primary assertion is 400.
        const reactivate = await apiDna.put(
          "national/cooperativeApproach/update",
          {
            cooperativeApproachId: id,
            status: "Active",
          }
        );
        expect(reactivate.ok()).toBe(false);
        expect(reactivate.status()).toBe(400);

        // And the persisted status must remain Completed regardless
        // of what the response said.
        const getRes = await apiDna.get(
          `national/cooperativeApproach/get?id=${encodeURIComponent(id)}`
        );
        expect(getRes.status()).toBe(200);
        const entity = unwrap(await apiDna.json<any>(getRes));
        expect(entity.status).toBe("Completed");
      }
    );
  });

  // ------------------------------------------------------------------
  // UI: list, create, details, status change (DNA)
  // ------------------------------------------------------------------
  test.describe("UI: DNA flow", () => {
    test("sidebar navigates to list; DNA sees Add New button", async ({
      dnaPage,
    }) => {
      await dnaPage.goto(`${BASE_URL}/cooperativeApproaches/viewAll`);
      await dnaPage.waitForLoadState("networkidle");
      await expect(
        dnaPage.getByText("Cooperative Approaches").first()
      ).toBeVisible();
      await expect(
        dnaPage.getByRole("button", { name: /add new/i })
      ).toBeVisible();
    });

    test("full UI create flow: Add New -> fill form -> CA visible in list", async ({
      dnaPage,
      apiDna,
    }) => {
      const title = `UI CA ${uniqueSuffix()}`;

      await dnaPage.goto(`${BASE_URL}/cooperativeApproaches/viewAll`);
      await dnaPage.waitForLoadState("networkidle");

      await dnaPage.getByRole("button", { name: /add new/i }).click();
      await dnaPage.waitForURL(/\/cooperativeApproaches\/add$/);

      await dnaPage.locator("input#title").fill(title);

      // Host Party is no longer user-editable — it's fetched from
      // GET cooperativeApproach/hostParty and rendered as a disabled
      // field. Just wait for it to populate (loading text is replaced).
      await expect(
        dnaPage.locator(".ant-form-item")
          .filter({ hasText: /Host Party/i })
          .locator("input")
      ).not.toHaveValue(/Loading/);

      // participatingParties is an Ant Design Select in "multiple"
      // mode with real country options (server-fed). Ant Design
      // doesn't put the id on the inner <input>; it is on the wrapping
      // combobox. The actual input is .ant-select-selection-search-input
      // inside the form-item whose label contains "Participating Parties".
      // The host country (NG) is pre-selected and locked by the form.
      const partiesItem = dnaPage
        .locator(".ant-form-item")
        .filter({ hasText: /Participating Parties/i });
      await partiesItem.locator(".ant-select-selector").click();
      const partiesInput = partiesItem.locator(
        ".ant-select-selection-search-input"
      );
      for (const countryName of ["Ghana", "Switzerland"]) {
        await partiesInput.fill(countryName);
        await dnaPage
          .locator(".ant-select-item-option")
          .filter({ hasText: countryName })
          .first()
          .click();
      }

      // Submit via the primary "Create" button inside the form.
      await dnaPage.getByRole("button", { name: /^create$/i }).click();

      // Redirects back to /viewAll on success.
      await dnaPage.waitForURL(/\/cooperativeApproaches\/viewAll$/, {
        timeout: 15000,
      });

      // Query the API directly to confirm persistence and get the id
      // (the list table may be paginated past what's visible).
      const { items } = await queryCooperativeApproaches(apiDna, 1, 50);
      const match = items.find((i: any) => i.title === title);
      expect(match, `expected to find CA with title ${title}`).toBeTruthy();
      // GH/CH selected via the UI, plus the host (NG) auto-included.
      expect(match.participatingParties).toEqual(
        expect.arrayContaining(["GH", "CH", "NG"])
      );
    });

    test("clicking a row shows the details page with matching title", async ({
      dnaPage,
      apiDna,
    }) => {
      const created = await createCooperativeApproach(apiDna, {
        title: `CA Row Click ${uniqueSuffix()}`,
      });

      await dnaPage.goto(
        `${BASE_URL}/cooperativeApproaches/view/${created.cooperativeApproachId}`
      );
      await dnaPage.waitForLoadState("networkidle");

      // Title renders in the header body-title slot.
      await expect(
        dnaPage.getByText(created.title, { exact: false }).first()
      ).toBeVisible();
      await expect(
        dnaPage.getByText(created.cooperativeApproachId).first()
      ).toBeVisible();
    });

    test("DNA changes status from Draft to Active via the dropdown", async ({
      dnaPage,
      apiDna,
    }) => {
      const created = await createCooperativeApproach(apiDna, {
        title: `CA Status UI ${uniqueSuffix()}`,
      });

      await dnaPage.goto(
        `${BASE_URL}/cooperativeApproaches/view/${created.cooperativeApproachId}`
      );
      await dnaPage.waitForLoadState("networkidle");

      // Scope to the .content-card (which wraps Descriptions) and find
      // the Select whose current value is "Draft" — uniquely identifies
      // the status Select on a freshly created CA.
      const statusSelect = dnaPage
        .locator(".content-card .ant-select")
        .filter({ hasText: /Draft/ })
        .first();
      await statusSelect.locator(".ant-select-selector").click();

      // Dropdown options are teleported to body; click "Active" and
      // wait for the PUT to complete before asserting persistence.
      const updateCall = dnaPage.waitForResponse(
        (r) =>
          /cooperativeApproach\/update/.test(r.url()) && r.request().method() === "PUT"
      );
      await dnaPage
        .locator(".ant-select-item-option")
        .filter({ hasText: /^Active$/ })
        .first()
        .click();
      await updateCall;

      const res = await apiDna.get(
        `national/cooperativeApproach/get?id=${encodeURIComponent(
          created.cooperativeApproachId
        )}`
      );
      expect(res.status()).toBe(200);
      const entity = unwrap(await apiDna.json<any>(res));
      expect(entity.status).toBe("Active");
    });
  });

  // ------------------------------------------------------------------
  // API: Authorized entities — authorizingParty is derived server-side
  // from the host party (never client-supplied), and
  // countryOfIncorporation must be one of the CA's participatingParties.
  // ------------------------------------------------------------------
  test.describe("API: Authorized Entities", () => {
    // Authorized entities can only be added to an Active CA, and
    // activation requires a submitted initial report (Dec 2/CMA.3
    // Annex para 18) — spin both up before each case.
    async function createActiveCa(
      apiDna: ApiClient,
      participatingParties: string[]
    ): Promise<string> {
      const created = await createCooperativeApproach(apiDna, {
        title: `CA Entities ${uniqueSuffix()}`,
        participatingParties,
      });
      const ir = await generateInitialReport(apiDna, {
        cooperativeApproachId: created.cooperativeApproachId,
      });
      await submitInitialReport(apiDna, ir.reportId);
      const activateRes = await apiDna.put(
        "national/cooperativeApproach/update",
        {
          cooperativeApproachId: created.cooperativeApproachId,
          status: "Active",
        }
      );
      expect(activateRes.status()).toBe(200);
      return created.cooperativeApproachId;
    }

    test("addAuthorizedEntity derives authorizingParty from the host regardless of client input", async ({
      apiDna,
    }) => {
      const caId = await createActiveCa(apiDna, ["GH", "CH"]);
      const res = await apiDna.post(
        "national/cooperativeApproach/authorizedEntity/add",
        {
          cooperativeApproachId: caId,
          entityName: `Entity ${uniqueSuffix()}`,
          countryOfIncorporation: "GH",
        }
      );
      expect(res.status()).toBe(201);
      const entity = unwrap(await apiDna.json<any>(res));
      // systemCountryCode=NG in the e2e stack — always the authorizing
      // party, regardless of what the client sends (or omits).
      expect(entity.authorizingParty).toBe("NG");
      expect(entity.countryOfIncorporation).toBe("GH");
    });

    test("addAuthorizedEntity rejects a countryOfIncorporation outside the CA's participatingParties", async ({
      apiDna,
    }) => {
      const caId = await createActiveCa(apiDna, ["GH", "CH"]);
      const res = await apiDna.post(
        "national/cooperativeApproach/authorizedEntity/add",
        {
          cooperativeApproachId: caId,
          entityName: `Entity ${uniqueSuffix()}`,
          countryOfIncorporation: "US",
        }
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(400);
    });
  });

  // ------------------------------------------------------------------
  // Permissions: PD is read-only at both UI and API layers
  // ------------------------------------------------------------------
  test.describe("Permissions: PD is read-only", () => {
    test("PD can view the list but does not see Add New", async ({
      pdPage,
    }) => {
      await pdPage.goto(`${BASE_URL}/cooperativeApproaches/viewAll`);
      await pdPage.waitForLoadState("networkidle");

      await expect(
        pdPage.getByText("Cooperative Approaches").first()
      ).toBeVisible();
      // PD role is not DNA/Ministry — the Add New button must be
      // absent, not merely disabled.
      await expect(
        pdPage.getByRole("button", { name: /add new/i })
      ).toHaveCount(0);
    });

    test("PD POST /create is rejected by CASL (403 Forbidden)", async ({
      apiPd,
    }) => {
      const res = await apiPd.post("national/cooperativeApproach/create", {
        title: `PD Should Fail ${uniqueSuffix()}`,
        participatingParties: ["GH", "CH"],
      });
      expect(res.ok()).toBe(false);
      // CASL PoliciesGuardEx rejects as 403. Defensive window: any
      // 4xx is acceptable, but the primary assertion is 403.
      expect(res.status()).toBe(403);
    });
  });
});
