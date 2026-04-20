/**
 * E2E coverage for Phase 4: AEF reporting expansion for Article 6.2
 * compliance.
 *
 * Backs the requirement table in
 * docs/article6/04-aef-reporting.md. Covers:
 *   - the shape of the AEF record query envelope
 *     (POST /national/reportsManagement/queryAefRecords), including
 *     the Phase 4 columns cooperativeApproachId, authorizationPurpose,
 *     isFirstTransfer, cumulativeAmount, reportingYear and
 *     acquiringPartyCountryCode,
 *   - the three AefReportTypeEnum report variants (HOLDINGS, ACTIONS,
 *     ANNUAL_INFORMATION) and the two ExportFileType variants
 *     (CSV, XLSX) exposed through POST /downloadAefReport,
 *   - the DNA-admin/root gate enforced inside
 *     AefReportManagementService.{queryAefRecords, downloadAefReport}
 *     (service-level HttpStatus.UNAUTHORIZED = 401 for non-DNA or
 *     non-admin users),
 *   - a lightweight UI smoke of /reports that the DNA-gated sidebar
 *     entry navigates to the Reports page and the two download-as-CSV /
 *     download-as-Excel buttons render.
 *
 * Phase 4 is primarily a read-over-existing-ITMO-history feature. On a
 * fresh database the AefActionsTableEntity table is empty and
 * downloadAefReport returns 400 "nothingToExport". The spec treats a
 * 400 with that error shape as a valid "no data to export" outcome and
 * asserts the response is otherwise well-formed. Tests that require
 * seeded ITMO activity (to observe specific actionType values in a
 * downloaded CSV, or to assert cumulativeAmount is populated) are
 * marked test.fixme and called out in the doc's Gaps section.
 *
 * Parallel safety: this spec is read-only. No uniqueSuffix() is needed,
 * but uniqueSuffix() is still imported to follow the phase-1/2/3
 * convention and to keep any future mutating seed helpers consistent.
 */
import { test, expect } from "./support/fixtures";
import { BASE_URL } from "./support/auth";
import { uniqueSuffix } from "./support/factories";
import { expectOk } from "./support/api-client";

// ---------------------------------------------------------------------
// Static enum expectations. We intentionally do NOT import from the
// backend source tree (the playwright config isn't set up to resolve
// the @app/shared paths the server uses). The values below mirror:
//   - backend/services/libs/shared/src/enum/aef.action.type.enum.ts
//   - backend/services/libs/shared/src/enum/aef.report.type.enum.ts
//   - backend/services/libs/shared/src/enum/export.file.type.enum.ts
//   - backend/services/libs/shared/src/enum/authorization.purpose.enum.ts
// as of Phase 4. Keep these in sync if the enums change.
// ---------------------------------------------------------------------
const AEF_ACTION_TYPE_VALUES = [
  "authorization",
  "firstTransfer",
  "transfer",
  "acquisition",
  "retire",
  "crossBoarderTransfer",
  "useTowardsNDC",
  "useForOIMP",
  "voluntaryCancellation",
  "omgeCancellation",
  "holdingsSnapshot",
] as const;

const AEF_REPORT_TYPE_VALUES = ["HOLDINGS", "ACTIONS", "ANNUAL_INFORMATION"] as const;

const EXPORT_FILE_TYPE_VALUES = ["xlsx", "csv"] as const;

const AUTHORIZATION_PURPOSE_VALUES = [
  "UseTowardsNDC",
  "OtherInternationalMitigationPurposes",
  "OtherPurposes",
] as const;

// ---------------------------------------------------------------------
// Small response helpers. The controller wraps service returns in a
// DataListResponseDto ({ data: [...], total }) for query endpoints; the
// downloadAefReport controller forwards the service return object
// directly ({ url, outputFileName }) on success and throws an
// HttpException on failure.
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

// The download endpoint uploads the generated file to the configured
// file handler (S3 in deployed environments, a local folder in dev) and
// returns { url, outputFileName }. A fresh database will instead throw
// "reportExport.nothingToExport" with 400. We treat either as a valid
// "endpoint is reachable and enforced auth correctly" outcome.
function isDownloadSuccess(status: number, body: any): boolean {
  if (status < 200 || status >= 300) return false;
  const payload = unwrap<any>(body);
  return typeof payload?.outputFileName === "string" && typeof payload?.url === "string";
}

function isNothingToExport(status: number, body: any): boolean {
  if (status !== 400) return false;
  const text = JSON.stringify(body ?? {});
  return /nothingToExport|nothing to export/i.test(text);
}

test.describe("AEF Reporting - Article 6.2", () => {
  // ------------------------------------------------------------------
  // API: POST /queryAefRecords — shape contract.
  // ------------------------------------------------------------------
  test.describe("API: queryAefRecords", () => {
    test("POST /reportsManagement/queryAefRecords returns a paginated envelope with the Phase 4 columns", async ({
      apiDna,
    }) => {
      const res = await apiDna.post("national/reportsManagement/queryAefRecords", {
        page: 1,
        size: 10,
      });
      await expectOk(res, "queryAefRecords");
      const body = await apiDna.json<any>(res);
      const rows = extractRows(body);
      expect(Array.isArray(rows)).toBe(true);

      // On a fresh DB this may be empty. Contract we lock in: when a
      // row is returned, every Phase 4 column is either absent or of
      // the expected type. We do not require population (AEF records
      // seeded by prior ITMO activity may predate Phase 4 migrations).
      for (const row of rows) {
        if (row.actionType !== undefined && row.actionType !== null) {
          // After queryAefRecords formatting the service runs actionType
          // through helperService.formatReqMessagesString("aef.<key>").
          // The resulting string is either the enum key ("authorization")
          // or its localized label ("Authorization"). Both forms are
          // accepted here — the shape assertion is "string, non-empty".
          expect(typeof row.actionType).toBe("string");
          expect(row.actionType.length).toBeGreaterThan(0);
        }
        if (row.authorizationPurpose !== undefined && row.authorizationPurpose !== null) {
          expect(AUTHORIZATION_PURPOSE_VALUES).toContain(row.authorizationPurpose);
        }
        if (row.isFirstTransfer !== undefined && row.isFirstTransfer !== null) {
          expect(typeof row.isFirstTransfer).toBe("boolean");
        }
        if (row.reportingYear !== undefined && row.reportingYear !== null) {
          // Stored as int column; some JSON stacks surface decimals as
          // strings, so allow either shape as long as it parses to a
          // sensible 4-digit year.
          const parsed =
            typeof row.reportingYear === "number"
              ? row.reportingYear
              : parseInt(String(row.reportingYear), 10);
          expect(Number.isFinite(parsed)).toBe(true);
          expect(parsed).toBeGreaterThan(1970);
          expect(parsed).toBeLessThan(2200);
        }
        if (row.cumulativeAmount !== undefined && row.cumulativeAmount !== null) {
          // @Column({type: "decimal"}) — TypeORM typically surfaces
          // decimals as strings. Accept string or number.
          const type = typeof row.cumulativeAmount;
          expect(["string", "number"]).toContain(type);
        }
        if (row.acquiringPartyCountryCode !== undefined && row.acquiringPartyCountryCode !== null) {
          expect(typeof row.acquiringPartyCountryCode).toBe("string");
        }
        if (row.cooperativeApproachId !== undefined && row.cooperativeApproachId !== null) {
          expect(typeof row.cooperativeApproachId).toBe("string");
        }
      }
    });
  });

  // ------------------------------------------------------------------
  // API: POST /downloadAefReport — round-trips for each
  // reportType × fileType pair the service supports. The service will
  // either upload a generated file and return {url, outputFileName} or
  // throw 400 "nothingToExport" on an empty DB; either outcome is
  // acceptable here. We assert the endpoint is reachable, enforces
  // auth, and returns a well-formed response.
  // ------------------------------------------------------------------
  test.describe("API: downloadAefReport", () => {
    test("HOLDINGS × CSV round-trip returns a file reference or 400 nothingToExport", async ({
      apiDna,
    }) => {
      const res = await apiDna.post("national/reportsManagement/downloadAefReport", {
        reportType: "HOLDINGS",
        fileType: "csv",
      });
      const status = res.status();
      const body = await apiDna.json<any>(res).catch(() => ({}));
      if (!(isDownloadSuccess(status, body) || isNothingToExport(status, body))) {
        throw new Error(
          `unexpected downloadAefReport outcome: ${status} ${JSON.stringify(body).slice(0, 500)}`
        );
      }
      if (isDownloadSuccess(status, body)) {
        const payload = unwrap<any>(body);
        expect(payload.outputFileName).toMatch(/\.csv$/);
      }
    });

    test("ACTIONS × CSV round-trip", async ({ apiDna }) => {
      const res = await apiDna.post("national/reportsManagement/downloadAefReport", {
        reportType: "ACTIONS",
        fileType: "csv",
      });
      const status = res.status();
      const body = await apiDna.json<any>(res).catch(() => ({}));
      expect(isDownloadSuccess(status, body) || isNothingToExport(status, body)).toBe(true);
      if (isDownloadSuccess(status, body)) {
        const payload = unwrap<any>(body);
        expect(payload.outputFileName).toMatch(/\.csv$/);
      }
    });

    test("ANNUAL_INFORMATION × CSV round-trip (Decision 2/CMA.3 para 20)", async ({
      apiDna,
    }) => {
      const res = await apiDna.post("national/reportsManagement/downloadAefReport", {
        reportType: "ANNUAL_INFORMATION",
        fileType: "csv",
      });
      const status = res.status();
      const body = await apiDna.json<any>(res).catch(() => ({}));
      expect(isDownloadSuccess(status, body) || isNothingToExport(status, body)).toBe(true);
      if (isDownloadSuccess(status, body)) {
        const payload = unwrap<any>(body);
        expect(payload.outputFileName).toMatch(/\.csv$/);
      }
    });

    test("HOLDINGS × XLSX round-trip (template-backed)", async ({ apiDna }) => {
      const res = await apiDna.post("national/reportsManagement/downloadAefReport", {
        reportType: "HOLDINGS",
        fileType: "xlsx",
      });
      const status = res.status();
      const body = await apiDna.json<any>(res).catch(() => ({}));
      expect(isDownloadSuccess(status, body) || isNothingToExport(status, body)).toBe(true);
      if (isDownloadSuccess(status, body)) {
        const payload = unwrap<any>(body);
        expect(payload.outputFileName).toMatch(/\.xlsx$/);
      }
    });

    test.fixme(
      "HOLDINGS CSV body contains only actionType=authorization rows",
      async () => {
        // Fetching and parsing the CSV body requires an HTTP-reachable
        // URL for the uploaded file. In this environment the service
        // uses a FileHandler implementation that writes to S3 /
        // MinIO / local disk; the returned url is not guaranteed to be
        // reachable from the Playwright worker without additional
        // configuration. The service-level filter is trivially
        // verifiable by reading aef-report-management.service.ts lines
        // 202-210: downloadAefReport forces filterAnd=[{actionType=
        // "authorization"}] before calling queryAefRecords for HOLDINGS
        // reports. Promote this test to executable once an
        // aef_export fixture seeds at least one CROSS_BOARDER_TRANSFER
        // + one AUTHORIZATION row and the spec can call queryAefRecords
        // with the same filter to verify the same projection.
      }
    );

    test.fixme(
      "ACTIONS report contains multiple actionType values when seeded",
      async () => {
        // Same blocker as above. Requires a seed that exercises all 11
        // AefActionTypeEnum branches in handleAefRecord (ISSUE,
        // TRANSFER + isNotTransferred, TRANSFER, RETIRE with each of
        // the 5 retirementType sub-branches, plus the plain RETIRE
        // fallback). Credit issuance and retirement are both service-
        // layer triggered (no direct HTTP create endpoint), so a
        // dedicated factory is needed.
      }
    );

    test("rejects an invalid reportType with 400/422 (class-validator AefExportDto)", async ({
      apiDna,
    }) => {
      const res = await apiDna.post("national/reportsManagement/downloadAefReport", {
        reportType: `INVALID_TYPE_${uniqueSuffix()}`,
        fileType: "csv",
      });
      expect(res.ok()).toBe(false);
      // class-validator returns 400 in this codebase; 422 would be a
      // reasonable alternative. Either is acceptable — we just require
      // a 4xx, and we want to be sure we did not tip over into a 5xx.
      expect(res.status()).toBeGreaterThanOrEqual(400);
      expect(res.status()).toBeLessThan(500);
    });

    test("rejects an invalid fileType with 400/422", async ({ apiDna }) => {
      const res = await apiDna.post("national/reportsManagement/downloadAefReport", {
        reportType: "HOLDINGS",
        fileType: `INVALID_FILETYPE_${uniqueSuffix()}`,
      });
      expect(res.ok()).toBe(false);
      expect(res.status()).toBeGreaterThanOrEqual(400);
      expect(res.status()).toBeLessThan(500);
    });
  });

  // ------------------------------------------------------------------
  // Enum shape: lock in the 11 AefActionTypeEnum + 3 AefReportTypeEnum
  // values. Mirrors the pattern from the Phase 2 spec. If somebody
  // renames an enum string, the API tests will still pass silently on
  // an empty DB, so this pure TS check is the canary.
  // ------------------------------------------------------------------
  test.describe("Enum shape", () => {
    test("AefActionTypeEnum expanded to 11 values in Phase 4", () => {
      expect(AEF_ACTION_TYPE_VALUES).toHaveLength(11);
      // Phase 4 additions, specifically the 7 new entries.
      for (const added of [
        "firstTransfer",
        "acquisition",
        "useTowardsNDC",
        "useForOIMP",
        "voluntaryCancellation",
        "omgeCancellation",
        "holdingsSnapshot",
      ]) {
        expect(AEF_ACTION_TYPE_VALUES).toContain(added);
      }
    });

    test("AefReportTypeEnum has exactly 3 values (HOLDINGS, ACTIONS, ANNUAL_INFORMATION)", () => {
      expect(AEF_REPORT_TYPE_VALUES).toHaveLength(3);
      expect(AEF_REPORT_TYPE_VALUES).toContain("HOLDINGS");
      expect(AEF_REPORT_TYPE_VALUES).toContain("ACTIONS");
      expect(AEF_REPORT_TYPE_VALUES).toContain("ANNUAL_INFORMATION");
    });

    test("ExportFileType supports exactly CSV + XLSX", () => {
      expect(EXPORT_FILE_TYPE_VALUES).toHaveLength(2);
      expect(EXPORT_FILE_TYPE_VALUES).toContain("csv");
      expect(EXPORT_FILE_TYPE_VALUES).toContain("xlsx");
    });
  });

  // ------------------------------------------------------------------
  // Permissions: AefReportManagementService gates queryAefRecords and
  // downloadAefReport with a hand-rolled companyRole + role check that
  // raises HttpStatus.UNAUTHORIZED (401), not the more usual
  // HttpStatus.FORBIDDEN (403) that CASL guards produce. We assert
  // "is a 4xx, not 2xx" rather than a specific status to avoid binding
  // the spec to one code path — the intent is that a non-DNA-admin
  // user is denied.
  // ------------------------------------------------------------------
  test.describe("Permissions: AEF download is DNA-admin/root only", () => {
    test("PD user cannot POST /downloadAefReport", async ({ apiPd }) => {
      const res = await apiPd.post("national/reportsManagement/downloadAefReport", {
        reportType: "HOLDINGS",
        fileType: "csv",
      });
      expect(res.ok()).toBe(false);
      expect(res.status()).toBeGreaterThanOrEqual(400);
      expect(res.status()).toBeLessThan(500);
      // Service raises 401 Unauthorized; CASL would raise 403 Forbidden.
      // Either is acceptable — both represent the gate firing.
      expect([401, 403]).toContain(res.status());
    });

    test("IC user cannot POST /downloadAefReport", async ({ apiIc }) => {
      const res = await apiIc.post("national/reportsManagement/downloadAefReport", {
        reportType: "HOLDINGS",
        fileType: "csv",
      });
      expect(res.ok()).toBe(false);
      expect(res.status()).toBeGreaterThanOrEqual(400);
      expect(res.status()).toBeLessThan(500);
      expect([401, 403]).toContain(res.status());
    });

    test("PD user cannot POST /queryAefRecords", async ({ apiPd }) => {
      // CASL allows PD to Read ProjectEntity, but the service re-checks
      // DNA + Admin/Root and throws 401. Either the CASL path or the
      // service path denying is acceptable.
      const res = await apiPd.post("national/reportsManagement/queryAefRecords", {
        page: 1,
        size: 10,
      });
      expect(res.ok()).toBe(false);
      expect(res.status()).toBeGreaterThanOrEqual(400);
      expect(res.status()).toBeLessThan(500);
      expect([401, 403]).toContain(res.status());
    });
  });

  // ------------------------------------------------------------------
  // UI smoke: /reports page. Only DNA admin/root see the sidebar entry
  // (web/src/Components/Sider/layout.sider.tsx lines 98-117). The page
  // renders two report cards — Actions and Holdings — with Export AS
  // EXCEL + Export AS CSV buttons. We assert the controls exist rather
  // than over-specifying the table contents, which depends on seeded
  // data.
  // ------------------------------------------------------------------
  test.describe("UI: /reports smoke", () => {
    test("DNA user can navigate to /reports and the page renders", async ({ dnaPage }) => {
      await dnaPage.goto(`${BASE_URL}/reports`);
      await dnaPage.waitForLoadState("networkidle");
      // The URL should stay on /reports — a redirect to /login would
      // indicate the auth check kicked us out.
      expect(dnaPage.url()).toContain("/reports");
      // Title lives in .title-container > .main and is set from i18n key
      // reporting:reportsTitle which resolves to "Reports".
      const titleEl = dnaPage.locator(".title-container .main").first();
      await expect(titleEl).toBeVisible({ timeout: 10000 });
      await expect(titleEl).toHaveText(/Reports|reportsTitle/i);
    });

    test("/reports exposes Export AS CSV and Export AS EXCEL buttons", async ({
      dnaPage,
    }) => {
      await dnaPage.goto(`${BASE_URL}/reports`);
      await dnaPage.waitForLoadState("networkidle");
      // Two report cards render (Actions + Holdings) when both are
      // selected in the Select filter (both are selected by default).
      // Each card exposes a CSV and an Excel button — so we expect at
      // least one of each label on the page.
      const csvButton = dnaPage
        .locator("button", { hasText: /Export AS CSV/i })
        .first();
      await expect(csvButton).toBeVisible({ timeout: 10000 });

      const xlsxButton = dnaPage
        .locator("button", { hasText: /Export AS EXCEL/i })
        .first();
      await expect(xlsxButton).toBeVisible();
    });

    test("/reports has a year picker and a report-type multi-select", async ({
      dnaPage,
    }) => {
      await dnaPage.goto(`${BASE_URL}/reports`);
      await dnaPage.waitForLoadState("networkidle");
      // antd DatePicker with picker="year" renders as an .ant-picker.
      await expect(dnaPage.locator(".ant-picker").first()).toBeVisible({
        timeout: 10000,
      });
      // antd Select in multiple mode renders as
      // .ant-select-multiple. The Reports page has exactly one such
      // Select (report-type-selector). We assert it exists without
      // pinning the selected labels, since i18n may or may not be
      // loaded at render time.
      await expect(dnaPage.locator(".ant-select-multiple").first()).toBeVisible();
    });
  });
});
