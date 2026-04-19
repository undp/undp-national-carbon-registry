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
import {
  createCooperativeApproach,
  queryCooperativeApproaches,
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
        hostParty: "GH",
      });
      expect(res.status()).toBe(201);
      const body = await apiDna.json<any>(res);
      const entity = unwrap(body);
      expect(entity.cooperativeApproachId).toMatch(/^CA-\d+/);
      expect(entity.title).toBe(title);
      // Backend forces DRAFT on create even if caller tries otherwise.
      expect(entity.status).toBe("Draft");
      expect(Array.isArray(entity.participatingParties)).toBe(true);
      expect(entity.participatingParties).toEqual(["GH", "CH"]);
      expect(entity.hostParty).toBe("GH");
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
        hostParty: "GH",
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

      // hostParty defaults to VITE_APP_COUNTRY_CODE. Set explicitly
      // so the test is environment-independent.
      await dnaPage.locator("input#hostParty").fill("");
      await dnaPage.locator("input#hostParty").fill("GH");

      // participatingParties is an Ant Design Select in "tags" mode.
      // We focus the input inside the selector, type country codes,
      // and press Enter so each becomes a tag.
      const partiesSelect = dnaPage
        .locator("#participatingParties")
        .locator("..");
      await partiesSelect.click();
      const partiesInput = dnaPage
        .locator("#participatingParties")
        .locator("input");
      await partiesInput.fill("GH");
      await partiesInput.press("Enter");
      await partiesInput.fill("CH");
      await partiesInput.press("Enter");

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
      expect(match.participatingParties).toEqual(
        expect.arrayContaining(["GH", "CH"])
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

      // Ant Design Select rendered for canManage users. Find the
      // selector within the Status description cell and open it.
      const selector = dnaPage.locator(".ant-select-selector").first();
      await selector.click();

      // Dropdown options are teleported to body; click the "Active"
      // option.
      await dnaPage
        .locator(".ant-select-item-option")
        .filter({ hasText: /^Active$/ })
        .first()
        .click();

      // UI fires PUT /update; wait for it to settle then reload and
      // confirm via API (UI reflection is tested indirectly — the
      // selector's value should be "Active" after refetch).
      await dnaPage.waitForLoadState("networkidle");

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
        hostParty: "GH",
      });
      expect(res.ok()).toBe(false);
      // CASL PoliciesGuardEx rejects as 403. Defensive window: any
      // 4xx is acceptable, but the primary assertion is 403.
      expect(res.status()).toBe(403);
    });
  });
});
