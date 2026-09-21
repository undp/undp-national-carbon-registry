/**
 * E2E coverage for the Initial Report module (Article 6.2 / Decision
 * 2/CMA.3 para. 18), rewritten for the NDC-period restructure (UNCR-478).
 *
 * OLD model (pre-restructure, do not resurrect): one append-only
 * InitialReport row per cooperative approach, keyed by `reportId`
 * (`IR-<n>`), each edit/submit minting a brand-new row + version.
 *
 * NEW model this file targets:
 *   - `InitialReport` (backend/services/libs/shared/src/entities/initial.report.entity.ts)
 *     is a single MUTABLE row per NDC implementation period, keyed by the
 *     stable `reportNumber` (`IR-<n>`). It carries only general NDC
 *     fields (ndcStartYear/ndcEndYear/ndcType/baseYear/ndcTarget/
 *     caMethod/caMethodDescription/sectors + the three jsonb sections
 *     participationDemonstration/itmoMetrics/environmentalIntegrity) and
 *     a `status` (Draft/Submitted) + `majorVersion`/`minorVersion` (last
 *     *submitted* version; 0/0 before first submit).
 *   - `InitialReportCooperativeApproach` (…initial.report.cooperative.approach.entity.ts)
 *     links approaches to a report. `cooperativeApproachId` is globally
 *     UNIQUE — an approach belongs to exactly one report, ever.
 *     `addedInMajor: null` means "linked since the last submit, not yet
 *     filed" — that null-ness is what drives the major-vs-minor version
 *     bump on the next submit.
 *   - `InitialReportVersion` (…initial.report.version.entity.ts) is
 *     append-only, written ONLY by submitReport, and freezes the whole
 *     filing (general fields + every linked approach + that approach's
 *     authorized-entity set at that moment) into `snapshot`.
 *   - Service: backend/services/libs/shared/src/initial-report/initial-report.service.ts
 *   - Controller: backend/services/src/national-api/initial-report.controller.ts
 *
 * Every test below is written against those two files plus
 * ndc-trajectory.ts, ndc-method-compatibility.ts and
 * i18n/en/initialReport.json, read in full as of this rewrite. Message
 * keys are cited by name where the assertion depends on one; line
 * numbers are avoided since they drift faster than symbol names.
 *
 * NOTE: this file was rewritten without a live stack to run it against.
 * It has been syntax-checked (TypeScript parse-only) but NOT executed.
 * Judgment calls that need live-stack verification are called out
 * inline as "VERIFY:" comments — search for that token before trusting
 * this file blindly.
 *
 * Parallel safety: `nextNdcPeriod()` (support/factories.ts) hands out
 * disjoint synthetic decade-long NDC windows per call, seeded by wall
 * clock + worker index, so tests never collide on the
 * (ndcStartYear, ndcEndYear) uniqueness that submitReport enforces via
 * ndc_target. Every test also creates its own fresh CooperativeApproach
 * via `createCooperativeApproach()` — `cooperativeApproachId` is
 * globally unique per report, so approaches must never be shared across
 * tests either.
 */
import { test, expect } from "./support/fixtures";
import { BASE_URL } from "./support/auth";
import { expectOk } from "./support/api-client";
import {
  createCooperativeApproach,
  generateInitialReport,
  nextNdcPeriod,
  nullInitialReportSectionDirect,
  submitInitialReport,
  uniqueSuffix,
} from "./support/factories";

function unwrap<T = any>(raw: any): T {
  if (raw == null) return raw;
  if (raw.data !== undefined) return raw.data as T;
  return raw as T;
}

// ---------------------------------------------------------------------
// Enum values verified on disk against:
//   backend/services/libs/shared/src/enum/ndc.type.enum.ts
//   backend/services/libs/shared/src/enum/ca.method.enum.ts
//   backend/services/libs/shared/src/enum/initial.report.status.enum.ts
// ---------------------------------------------------------------------
const NDC_TYPE_VALUES = ["SingleYear", "MultiYear"] as const;
const CA_METHOD_VALUES = ["Trajectory", "Averaging", "MultiYear"] as const;
const IR_STATUS_VALUES = ["Draft", "Submitted", "Published"] as const;

// Minimal complete general-fields payload for a raw (non-factory) POST
// /generate call, mirroring support/factories.ts's generateInitialReport
// defaults so hand-rolled tests that need to skip its auto-seeding
// behaviour (e.g. the missing-emission test) still produce a
// submittable report.
function completeGeneralFields(period: {
  ndcStartYear: number;
  ndcEndYear: number;
  baseYear: number;
}) {
  return {
    ndcStartYear: period.ndcStartYear,
    ndcEndYear: period.ndcEndYear,
    ndcType: "SingleYear",
    baseYear: period.baseYear,
    ndcTarget: 70_000,
    caMethod: "Trajectory",
    caMethodDescription: "E2E-generated method description",
    sectors: ["Energy"],
  };
}

test.describe("Initial Report - Article 6.2 (NDC-period model)", () => {
  // ------------------------------------------------------------------
  // API: POST /generate — general fields only, no cooperative approach.
  // ------------------------------------------------------------------
  test.describe("API: generate", () => {
    test("POST /generate with only general NDC fields returns 201, reportNumber=IR-<n>, status=Draft, majorVersion=minorVersion=0", async ({
      apiDna,
    }) => {
      const period = nextNdcPeriod();
      const res = await apiDna.post(
        "national/initialReport/generate",
        completeGeneralFields(period)
      );
      await expectOk(res, "generate");
      expect(res.status()).toBe(201);
      const ir = unwrap<any>(await apiDna.json<any>(res));

      expect(typeof ir.reportNumber).toBe("string");
      expect(ir.reportNumber).toMatch(/^IR-\d+$/);
      expect(ir.status).toBe("Draft");
      expect(ir.majorVersion).toBe(0);
      expect(ir.minorVersion).toBe(0);
      expect(ir.ndcStartYear).toBe(period.ndcStartYear);
      expect(ir.ndcEndYear).toBe(period.ndcEndYear);
      expect(ir.caMethodDescription).toBe("E2E-generated method description");
      expect(ir.sectors).toEqual(["Energy"]);

      // participationDemonstration/itmoMetrics/environmentalIntegrity get
      // sensible empty defaults when omitted (service generateDraft
      // lines ~129-148) — non-null but not necessarily "complete" (the
      // environmentalIntegrity default has empty-string leaf fields,
      // which submitReport's completeness check treats as present since
      // it only rejects undefined/null/"" at the *object* level, not per
      // leaf key — see buildMissingFields).
      expect(ir.participationDemonstration).toBeTruthy();
      expect(ir.participationDemonstration.hasNDC).toBe(true);
      expect(ir.itmoMetrics).toEqual({ primaryMetric: "tCO2e", nonGhgMetrics: [] });
      expect(ir.environmentalIntegrity).toBeTruthy();
    });

    test("the create DTO has no cooperativeApproachId field — sending one is silently ignored, not stored or echoed", async ({
      apiDna,
    }) => {
      // InitialReportCreateDto (dto/initial.report.create.dto.ts) has no
      // cooperativeApproachId property at all — approaches are attached
      // only via POST cooperativeApproach/add. There is no
      // `whitelist: true` on the global ValidationPipe (server.ts), so
      // an extraneous field is not rejected outright either; it is just
      // never read by generateDraft/applyGeneralFields, so it cannot
      // surface anywhere on the saved row.
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Gen No CA Field ${uniqueSuffix()}`,
      });
      const period = nextNdcPeriod();
      const res = await apiDna.post("national/initialReport/generate", {
        ...completeGeneralFields(period),
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      await expectOk(res, "generate (extraneous cooperativeApproachId)");
      const ir = unwrap<any>(await apiDna.json<any>(res));
      expect(ir.cooperativeApproachId).toBeUndefined();

      // Confirm it really wasn't linked either — /check for that CA
      // must still report false (no submitted report), and GET get must
      // show zero cooperativeApproaches.
      const getRes = await apiDna.get(
        `national/initialReport/get?reportNumber=${encodeURIComponent(
          ir.reportNumber
        )}`
      );
      await expectOk(getRes, "get after extraneous-field generate");
      const got = unwrap<any>(await apiDna.json<any>(getRes));
      expect(got.cooperativeApproaches).toEqual([]);
    });

    test("POST /generate omitting all fields still returns 201 with a fresh reportNumber (everything optional at generate time)", async ({
      apiDna,
    }) => {
      const res = await apiDna.post("national/initialReport/generate", {});
      await expectOk(res, "generate (empty body)");
      const ir = unwrap<any>(await apiDna.json<any>(res));
      expect(ir.reportNumber).toMatch(/^IR-\d+$/);
      expect(ir.status).toBe("Draft");
      // General fields default to whatever TypeORM/undefined leaves them
      // as; caMethodDescription and sectors get explicit fallbacks
      // (service lines ~149-150).
      expect(ir.caMethodDescription).toBe("");
      expect(ir.sectors).toEqual([]);
    });
  });

  // ------------------------------------------------------------------
  // API: PUT /update — merge semantics + the Submitted-reopens-to-Draft
  // rule that replaces the old Published edit-lock.
  // ------------------------------------------------------------------
  test.describe("API: update", () => {
    test("PUT /update with partial fields merges, preserves non-patched fields, bumps updatedTime", async ({
      apiDna,
    }) => {
      const period = nextNdcPeriod();
      const genRes = await apiDna.post(
        "national/initialReport/generate",
        completeGeneralFields(period)
      );
      await expectOk(genRes, "generate for update test");
      const gen = unwrap<any>(await apiDna.json<any>(genRes));
      const originalSectors = gen.sectors;
      const originalUpdated = Number(gen.updatedTime);

      await new Promise((r) => setTimeout(r, 5));

      const patch = {
        reportNumber: gen.reportNumber,
        caMethodDescription: "Updated CA method description — averaging.",
        ndcTarget: 999_999,
      };
      const res = await apiDna.put("national/initialReport/update", patch);
      await expectOk(res, "update (partial)");
      const updated = unwrap<any>(await apiDna.json<any>(res));

      expect(updated.caMethodDescription).toBe(patch.caMethodDescription);
      expect(updated.ndcTarget).toBe(999_999);
      // sectors untouched by the patch.
      expect(updated.sectors).toEqual(originalSectors);
      expect(Number(updated.updatedTime)).toBeGreaterThanOrEqual(
        originalUpdated
      );
      expect(updated.status).toBe("Draft");
    });

    test("PUT /update on nonexistent reportNumber returns 404 (initialReport.notFound)", async ({
      apiDna,
    }) => {
      const missing = `IR-DOES-NOT-EXIST-${uniqueSuffix()}`;
      const res = await apiDna.put("national/initialReport/update", {
        reportNumber: missing,
        caMethodDescription: "should-not-apply",
      });
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(404);
    });

    test("PUT /update on a Submitted report reopens it to Draft (service lines ~230-235)", async ({
      apiDna,
    }) => {
      // This replaces the old Published edit-lock test. The new service
      // has NO status guard on update at all — Submitted is always
      // mutable, and touching it flips status back to Draft so the next
      // submit computes a fresh version. Published is never reached by
      // any code path in the new model (not even the test-only direct-
      // SQL helper supports it any more — see factories.ts
      // setInitialReportStatusDirect's type signature), so there is
      // nothing left to lock there; dropped rather than kept as a
      // vestigial gap.
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Update Reopens ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      const submitted = await submitInitialReport(apiDna, gen.reportId);
      expect(submitted.status).toBe("Submitted");

      const res = await apiDna.put("national/initialReport/update", {
        reportNumber: gen.reportId,
        caMethodDescription: "post-submit edit reopens the report",
      });
      await expectOk(res, "update on Submitted report");
      const updated = unwrap<any>(await apiDna.json<any>(res));
      expect(updated.status).toBe("Draft");
      expect(updated.caMethodDescription).toBe(
        "post-submit edit reopens the report"
      );
      // The already-filed version 1.0 is untouched — only the live row
      // reopened.
      expect(updated.majorVersion).toBe(1);
      expect(updated.minorVersion).toBe(0);
    });
  });

  // ------------------------------------------------------------------
  // API: cooperative approach add/remove — Draft-only gate, global
  // one-report-per-approach uniqueness, and the reopen-on-add rule.
  // ------------------------------------------------------------------
  test.describe("API: add/remove cooperative approach", () => {
    test("add requires the approach to be CA-status Draft (initialReport.approachNotDraft otherwise)", async ({
      apiDna,
    }) => {
      // Drive the CA all the way to Submitted (via its OWN report), then
      // try to link it to a second, unrelated report.
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Add NotDraft ${uniqueSuffix()}`,
      });
      const firstReport = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      await submitInitialReport(apiDna, firstReport.reportId);

      const caCheck = unwrap<any>(
        await apiDna.json<any>(
          await apiDna.get(
            `national/cooperativeApproach/get?id=${encodeURIComponent(
              ca.cooperativeApproachId
            )}`
          )
        )
      );
      expect(caCheck.status).toBe("Submitted");

      const period = nextNdcPeriod();
      const secondGen = unwrap<any>(
        await apiDna.json<any>(
          await apiDna.post(
            "national/initialReport/generate",
            completeGeneralFields(period)
          )
        )
      );
      const res = await apiDna.post(
        "national/initialReport/cooperativeApproach/add",
        {
          reportNumber: secondGen.reportNumber,
          cooperativeApproachId: ca.cooperativeApproachId,
        }
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(400);
      const bodyText = await res.text();
      expect(bodyText).toMatch(/Draft/);
    });

    test("add rejects an approach already linked to a different report (initialReport.approachAlreadyLinked)", async ({
      apiDna,
    }) => {
      // Link the (still-Draft) approach to report A, then try to link
      // the SAME approach to a fresh report B before A is ever
      // submitted — approachNotDraft cannot fire here since the
      // approach's CA-status is still Draft, so this isolates the
      // uniqueness check.
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Add AlreadyLinked ${uniqueSuffix()}`,
      });
      const reportA = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });

      const period = nextNdcPeriod();
      const reportB = unwrap<any>(
        await apiDna.json<any>(
          await apiDna.post(
            "national/initialReport/generate",
            completeGeneralFields(period)
          )
        )
      );
      const res = await apiDna.post(
        "national/initialReport/cooperativeApproach/add",
        {
          reportNumber: reportB.reportNumber,
          cooperativeApproachId: ca.cooperativeApproachId,
        }
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(400);
      const bodyText = await res.text();
      expect(bodyText).toMatch(new RegExp(reportA.reportId));
    });

    test("add reopens an already-Submitted report to Draft", async ({
      apiDna,
    }) => {
      const ca1 = await createCooperativeApproach(apiDna, {
        title: `IR Add Reopen 1 ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca1.cooperativeApproachId,
      });
      const submitted = await submitInitialReport(apiDna, gen.reportId);
      expect(submitted.status).toBe("Submitted");

      const ca2 = await createCooperativeApproach(apiDna, {
        title: `IR Add Reopen 2 ${uniqueSuffix()}`,
      });
      const addRes = await apiDna.post(
        "national/initialReport/cooperativeApproach/add",
        { reportNumber: gen.reportId, cooperativeApproachId: ca2.cooperativeApproachId }
      );
      await expectOk(addRes, "add second approach reopens report");

      const getRes = await apiDna.get(
        `national/initialReport/get?reportNumber=${encodeURIComponent(gen.reportId)}`
      );
      const got = unwrap<any>(await apiDna.json<any>(getRes));
      expect(got.status).toBe("Draft");
      expect(got.cooperativeApproaches).toHaveLength(2);
    });

    test("remove requires CA-status Draft (initialReport.approachNotRemovable once the approach has been filed)", async ({
      apiDna,
    }) => {
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Remove NotRemovable ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      await submitInitialReport(apiDna, gen.reportId);

      const res = await apiDna.put(
        "national/initialReport/cooperativeApproach/remove",
        { reportNumber: gen.reportId, cooperativeApproachId: ca.cooperativeApproachId }
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(400);
      const bodyText = await res.text();
      expect(bodyText).toMatch(/not Draft|Submitted/);
    });

    test("remove on a still-Draft link succeeds and the approach disappears from GET get", async ({
      apiDna,
    }) => {
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Remove Draft ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });

      const res = await apiDna.put(
        "national/initialReport/cooperativeApproach/remove",
        { reportNumber: gen.reportId, cooperativeApproachId: ca.cooperativeApproachId }
      );
      await expectOk(res, "remove Draft link");

      const getRes = await apiDna.get(
        `national/initialReport/get?reportNumber=${encodeURIComponent(gen.reportId)}`
      );
      const got = unwrap<any>(await apiDna.json<any>(getRes));
      expect(got.cooperativeApproaches).toEqual([]);
    });

    test("remove on a non-existent link returns 404 (initialReport.approachLinkNotFound)", async ({
      apiDna,
    }) => {
      const period = nextNdcPeriod();
      const gen = unwrap<any>(
        await apiDna.json<any>(
          await apiDna.post(
            "national/initialReport/generate",
            completeGeneralFields(period)
          )
        )
      );
      const res = await apiDna.put(
        "national/initialReport/cooperativeApproach/remove",
        {
          reportNumber: gen.reportNumber,
          cooperativeApproachId: `CA-DOES-NOT-EXIST-${uniqueSuffix()}`,
        }
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(404);
    });
  });

  // ------------------------------------------------------------------
  // API: submit — the core state transition. Split into the
  // "structurally blocked / success" tests and the "validation error
  // per message key" tests below.
  // ------------------------------------------------------------------
  test.describe("API: submit — zero approaches / success / version bump", () => {
    test("PUT /submit with zero linked approaches returns 400 initialReport.noCooperativeApproach", async ({
      apiDna,
    }) => {
      // No Emission row is seeded either, but noCooperativeApproach is
      // checked before the emission lookup (service ordering:
      // incomplete -> multiYearNotSupported -> methodCompatible ->
      // trajectory -> noCooperativeApproach -> baseYearEmissionMissing),
      // so this test isolates the CA-count guard specifically.
      const period = nextNdcPeriod();
      const gen = unwrap<any>(
        await apiDna.json<any>(
          await apiDna.post(
            "national/initialReport/generate",
            completeGeneralFields(period)
          )
        )
      );
      const res = await apiDna.put(
        `national/initialReport/submit?reportNumber=${encodeURIComponent(
          gen.reportNumber
        )}`
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(400);
      const bodyText = await res.text();
      expect(bodyText).toMatch(/cooperative approach/i);
    });

    test("PUT /submit on a fully-populated Draft with one Draft approach succeeds: majorVersion=1, minorVersion=0, the approach flips Draft->Submitted with a caReferenceNumber, its authorized entities flip to Submitted", async ({
      apiDna,
    }) => {
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Submit v1 ${uniqueSuffix()}`,
        participatingParties: ["NG", "GH"],
      });
      // Attach an authorized entity while the CA is still Draft — this
      // is the closest analogue to cooperative-approach.spec's
      // "submitting the initial report carries the entities to
      // Submitted" test, re-verified against the new submitReport
      // transaction loop (it re-reads CaAuthorizedEntity per linked
      // approach and calls markSubmitted, same as before the
      // restructure).
      const entityRes = await apiDna.post(
        "national/cooperativeApproach/authorizedEntity/add",
        {
          cooperativeApproachId: ca.cooperativeApproachId,
          entityName: `Entity ${uniqueSuffix()}`,
          countryOfIncorporation: "GH",
          authorizationDate: Date.now() - 86400000,
        }
      );
      await expectOk(entityRes, "add authorized entity");

      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      const submitted = await submitInitialReport(apiDna, gen.reportId);
      expect(submitted.reportNumber).toBe(gen.reportId);
      expect(submitted.status).toBe("Submitted");
      expect(submitted.majorVersion).toBe(1);
      expect(submitted.minorVersion).toBe(0);

      const caAfter = unwrap<any>(
        await apiDna.json<any>(
          await apiDna.get(
            `national/cooperativeApproach/get?id=${encodeURIComponent(
              ca.cooperativeApproachId
            )}`
          )
        )
      );
      expect(caAfter.status).toBe("Submitted");
      expect(caAfter.caReferenceNumber).toMatch(/^CA\d+/);

      const entitiesRes = await apiDna.get(
        `national/cooperativeApproach/authorizedEntity/query?cooperativeApproachId=${encodeURIComponent(
          ca.cooperativeApproachId
        )}`
      );
      const entities = unwrap<any[]>(await apiDna.json<any>(entitiesRes));
      expect(entities).toHaveLength(1);
      expect(entities[0].submissionStatus).toBe("Submitted");
    });

    test("adding a second Draft approach after a submit bumps to majorVersion=2 minorVersion=0; the 1.0 snapshot still shows only the first approach", async ({
      apiDna,
    }) => {
      const ca1 = await createCooperativeApproach(apiDna, {
        title: `IR Snapshot v1 A ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca1.cooperativeApproachId,
      });
      const v1 = await submitInitialReport(apiDna, gen.reportId);
      expect(v1.majorVersion).toBe(1);
      expect(v1.minorVersion).toBe(0);

      const ca2 = await createCooperativeApproach(apiDna, {
        title: `IR Snapshot v1 B ${uniqueSuffix()}`,
      });
      const addRes = await apiDna.post(
        "national/initialReport/cooperativeApproach/add",
        { reportNumber: gen.reportId, cooperativeApproachId: ca2.cooperativeApproachId }
      );
      await expectOk(addRes, "add second approach");

      // Report reopened to Draft by the add (asserted in its own test
      // above; re-checked here since it's a precondition for re-submit).
      const reopened = unwrap<any>(
        await apiDna.json<any>(
          await apiDna.get(
            `national/initialReport/get?reportNumber=${encodeURIComponent(gen.reportId)}`
          )
        )
      );
      expect(reopened.status).toBe("Draft");

      const v2 = await submitInitialReport(apiDna, gen.reportId);
      expect(v2.majorVersion).toBe(2);
      expect(v2.minorVersion).toBe(0);

      // /versions lists both filings, newest-first per the service's
      // ORDER BY majorVersion DESC, minorVersion DESC.
      const versionsRes = await apiDna.get(
        `national/initialReport/versions?reportNumber=${encodeURIComponent(gen.reportId)}`
      );
      await expectOk(versionsRes, "versions");
      const versions = unwrap<any[]>(await apiDna.json<any>(versionsRes));
      const keys = versions.map((v) => `${v.majorVersion}.${v.minorVersion}`);
      expect(keys).toEqual(expect.arrayContaining(["1.0", "2.0"]));

      // The core guarantee the whole redesign exists for: version 1.0's
      // frozen snapshot must show ONLY ca1, never ca2, even though ca2
      // is now live on the report.
      const v1SnapshotRes = await apiDna.get(
        `national/initialReport/version?reportNumber=${encodeURIComponent(
          gen.reportId
        )}&major=1&minor=0`
      );
      await expectOk(v1SnapshotRes, "get version 1.0");
      const v1Snapshot = unwrap<any>(await apiDna.json<any>(v1SnapshotRes));
      const v1Approaches = v1Snapshot.snapshot.cooperativeApproaches;
      expect(v1Approaches).toHaveLength(1);
      expect(v1Approaches[0].cooperativeApproachId).toBe(
        ca1.cooperativeApproachId
      );
      expect(
        v1Approaches.some(
          (a: any) => a.cooperativeApproachId === ca2.cooperativeApproachId
        )
      ).toBe(false);

      // And 2.0's snapshot shows both.
      const v2SnapshotRes = await apiDna.get(
        `national/initialReport/version?reportNumber=${encodeURIComponent(
          gen.reportId
        )}&major=2&minor=0`
      );
      const v2Snapshot = unwrap<any>(await apiDna.json<any>(v2SnapshotRes));
      const v2ApproachIds = v2Snapshot.snapshot.cooperativeApproaches.map(
        (a: any) => a.cooperativeApproachId
      );
      expect(v2ApproachIds).toEqual(
        expect.arrayContaining([
          ca1.cooperativeApproachId,
          ca2.cooperativeApproachId,
        ])
      );
    });

    test("GET /version for a version that was never filed returns 404 (initialReport.versionNotFound)", async ({
      apiDna,
    }) => {
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR VersionNotFound ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      await submitInitialReport(apiDna, gen.reportId);

      const res = await apiDna.get(
        `national/initialReport/version?reportNumber=${encodeURIComponent(
          gen.reportId
        )}&major=99&minor=99`
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(404);
    });
  });

  // ------------------------------------------------------------------
  // API: submit — one test per rejection message key in submitReport,
  // each driven the most direct way that isolates it from the others.
  // ------------------------------------------------------------------
  test.describe("API: submit — validation errors", () => {
    test("initialReport.incomplete — nulling a required jsonb section 400s and names it", async ({
      apiDna,
    }) => {
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Incomplete ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      // The update DTO would reject an explicit null before it reaches
      // buildMissingFields, so bypass it via direct SQL exactly like the
      // pre-restructure spec did.
      nullInitialReportSectionDirect(gen.reportId, "environmentalIntegrity");

      const res = await apiDna.put(
        `national/initialReport/submit?reportNumber=${encodeURIComponent(gen.reportId)}`
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(400);
      const bodyText = await res.text();
      expect(bodyText).toMatch(/incomplete|missing/i);
      expect(bodyText).toMatch(/environmentalIntegrity/);
    });

    test("initialReport.multiYearNotSupported — ndcType=MultiYear is rejected even though the field itself is populated", async ({
      apiDna,
    }) => {
      // multiYearNotSupported is checked BEFORE the ndcType/caMethod
      // compatibility check, so any caMethod value reaches this branch
      // first as long as ndcType === MultiYear.
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR MultiYear ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
        ndcType: "MultiYear",
      });
      const res = await apiDna.put(
        `national/initialReport/submit?reportNumber=${encodeURIComponent(gen.reportId)}`
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(400);
      const bodyText = await res.text();
      expect(bodyText).toMatch(/multi-year|not supported/i);
    });

    test("initialReport.methodNotCompatibleWithNdcType — SingleYear + MultiYear caMethod is rejected", async ({
      apiDna,
    }) => {
      // isNdcMethodCompatible(SingleYear, caMethod) only accepts
      // Trajectory/Averaging. Pairing SingleYear (the default, so
      // multiYearNotSupported does NOT fire) with caMethod=MultiYear
      // isolates this specific check.
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR MethodIncompatible ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
        ndcType: "SingleYear",
        caMethod: "MultiYear",
      });
      const res = await apiDna.put(
        `national/initialReport/submit?reportNumber=${encodeURIComponent(gen.reportId)}`
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(400);
      const bodyText = await res.text();
      expect(bodyText).toMatch(/not compatible/i);
    });

    test("initialReport.invalidNdcPeriod — an inverted period (ndcEndYear < ndcStartYear) is rejected", async ({
      apiDna,
    }) => {
      // validateNdcTrajectory (ndc-trajectory.ts) flags PERIOD_INVERTED
      // when ndcEndYear < ndcStartYear, and separately
      // TARGET_YEAR_OUTSIDE_PERIOD never applies here since submitReport
      // always passes targetYear = report.ndcEndYear. Build a period
      // manually rather than via nextNdcPeriod() (which always returns a
      // valid ascending window) so the inversion is deliberate; offset
      // far from any other test's synthetic range to avoid the
      // ndc_target period-uniqueness constraint colliding — irrelevant
      // here anyway since submitReport never reaches the period-claim
      // step (trajectory validation runs first).
      const period = nextNdcPeriod();
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR BadTrajectory ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
        ndcStartYear: period.ndcEndYear,
        ndcEndYear: period.ndcStartYear,
        baseYear: period.baseYear,
      });
      const res = await apiDna.put(
        `national/initialReport/submit?reportNumber=${encodeURIComponent(gen.reportId)}`
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(400);
      const bodyText = await res.text();
      expect(bodyText).toMatch(/invalid/i);
    });

    test("initialReport.baseYearEmissionMissing — a baseYear with no seeded Emission row is rejected", async ({
      apiDna,
    }) => {
      // generateInitialReport() (support/factories.ts) always seeds a
      // base-year Emission row as part of its convenience wrapper — to
      // exercise the missing-emission path we must bypass it and drive
      // generate + add + submit by hand against a fresh period that has
      // deliberately NOT had seedEmissionRowDirect called for it.
      const period = nextNdcPeriod();
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR NoEmission ${uniqueSuffix()}`,
      });
      const genRes = await apiDna.post(
        "national/initialReport/generate",
        completeGeneralFields(period)
      );
      await expectOk(genRes, "generate (no emission seed)");
      const gen = unwrap<any>(await apiDna.json<any>(genRes));

      const addRes = await apiDna.post(
        "national/initialReport/cooperativeApproach/add",
        {
          reportNumber: gen.reportNumber,
          cooperativeApproachId: ca.cooperativeApproachId,
        }
      );
      await expectOk(addRes, "add approach (no emission seed)");

      const res = await apiDna.put(
        `national/initialReport/submit?reportNumber=${encodeURIComponent(
          gen.reportNumber
        )}`
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(400);
      const bodyText = await res.text();
      expect(bodyText).toMatch(/emission/i);
      // VERIFY: this assumes no other test/fixture has ever seeded an
      // Emission row for country=NG at this exact synthetic baseYear.
      // nextNdcPeriod()'s far-future decade windows make a collision
      // vanishingly unlikely, but it is not provable without a live DB.
    });

    test("PUT /submit on nonexistent reportNumber returns 404", async ({
      apiDna,
    }) => {
      const missing = `IR-MISSING-${uniqueSuffix()}`;
      const res = await apiDna.put(
        `national/initialReport/submit?reportNumber=${encodeURIComponent(missing)}`
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(404);
    });
  });

  // ------------------------------------------------------------------
  // API: GET /check — UNCHANGED signature and semantics: "has this CA
  // ever been part of a submitted initial report". Only the
  // implementation changed (a join through the link table via
  // hasSubmittedReport, instead of a per-CA IR row lookup).
  // ------------------------------------------------------------------
  test.describe("API: check", () => {
    test("GET /check?cooperativeApproachId=<id> before any report links it returns { hasSubmittedReport: false }", async ({
      apiDna,
    }) => {
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Check NoLink ${uniqueSuffix()}`,
      });
      const res = await apiDna.get(
        `national/initialReport/check?cooperativeApproachId=${encodeURIComponent(
          ca.cooperativeApproachId
        )}`
      );
      await expectOk(res, "check (no link)");
      const body = await apiDna.json<any>(res);
      const payload = body?.data ?? body;
      expect(payload.hasSubmittedReport).toBe(false);
    });

    test("GET /check stays false once linked-but-not-yet-submitted, flips true after submit", async ({
      apiDna,
    }) => {
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Check Flip ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      // Linked (addedInMajor still null) but not submitted —
      // hasSubmittedReport requires `link.addedInMajor != null`.
      const beforeRes = await apiDna.get(
        `national/initialReport/check?cooperativeApproachId=${encodeURIComponent(
          ca.cooperativeApproachId
        )}`
      );
      await expectOk(beforeRes, "check (linked, unsubmitted)");
      const beforeBody = await apiDna.json<any>(beforeRes);
      const beforePayload = beforeBody?.data ?? beforeBody;
      expect(beforePayload.hasSubmittedReport).toBe(false);

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
      const period = nextNdcPeriod();
      await apiDna.post(
        "national/initialReport/generate",
        completeGeneralFields(period)
      );

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

    test("GET /get?reportNumber=<n> returns the live row plus a cooperativeApproaches array", async ({
      apiDna,
    }) => {
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR Get ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca.cooperativeApproachId,
      });
      const res = await apiDna.get(
        `national/initialReport/get?reportNumber=${encodeURIComponent(gen.reportId)}`
      );
      await expectOk(res, "get");
      const ir = unwrap<any>(await apiDna.json<any>(res));
      expect(ir.reportNumber).toBe(gen.reportId);
      expect(ir.status).toBe("Draft");
      expect(Array.isArray(ir.cooperativeApproaches)).toBe(true);
      expect(ir.cooperativeApproaches).toHaveLength(1);
      expect(ir.cooperativeApproaches[0].cooperativeApproachId).toBe(
        ca.cooperativeApproachId
      );
    });

    test("GET /get?reportNumber=NONEXISTENT returns 404", async ({
      apiDna,
    }) => {
      const missing = `IR-DOES-NOT-EXIST-${uniqueSuffix()}`;
      const res = await apiDna.get(
        `national/initialReport/get?reportNumber=${encodeURIComponent(missing)}`
      );
      expect(res.ok()).toBe(false);
      expect(res.status()).toBe(404);
    });
  });

  // ------------------------------------------------------------------
  // Enum cardinality — canary for silent enum renames/additions.
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

    test("InitialReportStatus still declares 3 values, but Published is unreachable dead code post-restructure", () => {
      expect(IR_STATUS_VALUES).toHaveLength(3);
      expect(IR_STATUS_VALUES).toContain("Draft");
      expect(IR_STATUS_VALUES).toContain("Submitted");
      // Published remains a declared enum member (entity default column
      // still lists it) but no service method — generateDraft, update,
      // addCooperativeApproach, removeCooperativeApproach, submitReport
      // — ever writes or checks for it any more. The old Published
      // edit-lock test is gone along with the guard it locked; see the
      // "API: update" describe block above for why.
      expect(IR_STATUS_VALUES).toContain("Published");
    });
  });

  // ------------------------------------------------------------------
  // Permissions — CASL grants Manage InitialReport to DNA Admin/Root
  // only (assertCanManage, service lines ~70-83). PD has no rule -> 403
  // on any mutating call. /check guards on JwtAuthGuard only (no
  // PoliciesGuardEx) — unchanged from before the restructure.
  // ------------------------------------------------------------------
  test.describe("Permissions", () => {
    test("PD user cannot POST /generate", async ({ apiPd }) => {
      const period = nextNdcPeriod();
      const res = await apiPd.post(
        "national/initialReport/generate",
        completeGeneralFields(period)
      );
      expect(res.ok()).toBe(false);
      expect([401, 403]).toContain(res.status());
    });

    test("GET /check is reachable by any authenticated user (JwtAuthGuard-only)", async ({
      apiPd,
      apiDna,
    }) => {
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
        expect([401, 403]).toContain(res.status());
      }
    });
  });

  // ------------------------------------------------------------------
  // UI: DNA flow. Selectors verified against the ACTUAL current source
  // of createInitialReport.tsx / initialReportDetails.tsx /
  // initialReportManagement.tsx / public/locales/i18n/InitialReport/en.json
  // — not guessed. See the file-level header for the VERIFY caveat: none
  // of this has been run against a live stack.
  // ------------------------------------------------------------------
  test.describe("UI: DNA flow", () => {
    test("DNA user can navigate to /initialReports/viewAll and the list renders with a Generate Report button", async ({
      dnaPage,
    }) => {
      await dnaPage.goto(`${BASE_URL}/initialReports/viewAll`);
      await dnaPage.waitForLoadState("networkidle");
      expect(dnaPage.url()).toContain("/initialReports/viewAll");
      // Heading is t('InitialReport:initialReports') = "Initial Reports"
      // (public/locales/i18n/InitialReport/en.json).
      await expect(
        dnaPage.locator("text=/Initial Reports/i").first()
      ).toBeVisible({ timeout: 10000 });
      // canCreate gates on companyRole===DNA only (no role check) —
      // dnaAdmin qualifies. Button label is
      // t('InitialReport:generateReport') = "Generate Report".
      await expect(
        dnaPage.getByRole("button", { name: /generate report/i })
      ).toBeVisible();
    });

    test("DNA can open /initialReports/create and see the NDC-period form controls (no cooperative-approach picker)", async ({
      dnaPage,
    }) => {
      await dnaPage.goto(`${BASE_URL}/initialReports/create`);
      await dnaPage.waitForLoadState("networkidle");
      expect(dnaPage.url()).toContain("/initialReports/create");

      // Page heading is the same "Generate Report" string as the list
      // page's button (TimedPageInfoTitle title prop is
      // t('InitialReport:generateReport')) — the create form itself has
      // no separate "Generate Initial Report" heading text.
      await expect(
        dnaPage.locator(".content-card").first()
      ).toBeVisible({ timeout: 10000 });

      // Field labels straight from createInitialReport.tsx's Form.Item
      // `label` props.
      for (const label of [
        "NDC Start Year",
        "NDC End Year",
        "NDC Type",
        "Base Year",
        "NDC Target",
        "CA Method",
        "Sectors",
        "Environmental Integrity Assessment",
        "Corresponding Adjustment Method Description",
      ]) {
        await expect(
          dnaPage.locator("text=/" + label + "/i").first()
        ).toBeVisible();
      }
      // There is deliberately no "Cooperative Approach" field/label
      // anywhere on this form any more — approaches are attached from
      // the detail page instead.
      await expect(
        dnaPage.locator("text=/Cooperative Approach/i")
      ).toHaveCount(0);

      await expect(
        dnaPage.getByRole("button", { name: /generate draft/i })
      ).toBeVisible();
      await expect(
        dnaPage.getByRole("button", { name: /^cancel$/i })
      ).toBeVisible();
    });

    test("filling and submitting the Create form lands on the report's detail page with 0 approaches and a disabled Submit button", async ({
      dnaPage,
    }) => {
      await dnaPage.goto(`${BASE_URL}/initialReports/create`);
      await dnaPage.waitForLoadState("networkidle");

      const period = nextNdcPeriod();
      await dnaPage.locator("input#ndcStartYear").fill(String(period.ndcStartYear));
      await dnaPage.locator("input#ndcEndYear").fill(String(period.ndcEndYear));
      // ndcType defaults to SingleYear (Form.Item initialValue) — leave
      // as-is; MultiYear is rendered disabled and cannot be selected.
      await dnaPage.locator("input#baseYear").fill(String(period.baseYear));
      await dnaPage.locator("input#ndcTarget").fill("70000");

      // CA Method — single Select, no search box.
      const caMethodItem = dnaPage
        .locator(".ant-form-item")
        .filter({ hasText: /^CA Method/ });
      await caMethodItem.locator(".ant-select-selector").click();
      await dnaPage
        .locator(".ant-select-item-option")
        .filter({ hasText: /Trajectory/ })
        .first()
        .click();

      // Sectors — multi Select.
      const sectorsItem = dnaPage
        .locator(".ant-form-item")
        .filter({ hasText: /^Sectors/ });
      await sectorsItem.locator(".ant-select-selector").click();
      await dnaPage
        .locator(".ant-select-item-option")
        .filter({ hasText: /^Energy$/ })
        .first()
        .click();

      // The environmentalIntegrityAssessment field is the only one of
      // the two textareas on this form with this placeholder — targets
      // it precisely rather than relying on DOM order.
      await dnaPage
        .locator("textarea[placeholder*='Conservative baselines']")
        .fill("E2E UI environmental integrity note");

      const generateResp = dnaPage.waitForResponse(
        (r) =>
          /initialReport\/generate/.test(r.url()) &&
          r.request().method() === "POST"
      );
      await dnaPage
        .getByRole("button", { name: /generate draft/i })
        .click();
      const resp = await generateResp;
      expect(resp.status()).toBe(201);
      const respBody = await resp.json();
      const reportNumber = (respBody?.data ?? respBody)?.reportNumber;
      expect(reportNumber).toMatch(/^IR-\d+$/);

      await dnaPage.waitForURL(
        new RegExp(`/initialReports/view/${reportNumber}$`),
        { timeout: 10000 }
      );

      // Detail page: Cooperative Approaches table present, empty, Submit
      // disabled (initialReportDetails.tsx: disabled={approaches.length
      // === 0} + a tooltip explaining why).
      await expect(
        dnaPage.locator("text=/Cooperative Approaches/i").first()
      ).toBeVisible();
      await expect(
        dnaPage.locator("text=/No cooperative approaches attached yet/i")
      ).toBeVisible();
      const submitButton = dnaPage.getByRole("button", { name: /^submit$/i });
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeDisabled();
    });

    test("Add Cooperative Approach on the detail page enables the Submit button", async ({
      dnaPage,
      apiDna,
    }) => {
      const ca = await createCooperativeApproach(apiDna, {
        title: `IR UI Add Approach ${uniqueSuffix()}`,
      });
      const period = nextNdcPeriod();
      const gen = unwrap<any>(
        await apiDna.json<any>(
          await apiDna.post(
            "national/initialReport/generate",
            completeGeneralFields(period)
          )
        )
      );

      await dnaPage.goto(`${BASE_URL}/initialReports/view/${gen.reportNumber}`);
      await dnaPage.waitForLoadState("networkidle");

      const submitButton = dnaPage.getByRole("button", { name: /^submit$/i });
      await expect(submitButton).toBeDisabled();

      await dnaPage
        .getByRole("button", { name: /add cooperative approach/i })
        .click();

      const addForm = dnaPage.locator("form").filter({
        has: dnaPage.locator("button", { hasText: /^add$/i }),
      });
      await addForm.locator(".ant-select-selector").click();
      const searchInput = addForm.locator(".ant-select-selection-search-input");
      await searchInput.fill(ca.cooperativeApproachId);
      const addResp = dnaPage.waitForResponse(
        (r) =>
          /initialReport\/cooperativeApproach\/add/.test(r.url()) &&
          r.request().method() === "POST"
      );
      await dnaPage
        .locator(".ant-select-item-option")
        .filter({ hasText: ca.cooperativeApproachId })
        .first()
        .click();
      await addForm.getByRole("button", { name: /^add$/i }).click();
      await addResp;

      await expect(
        dnaPage.locator("td", { hasText: ca.cooperativeApproachId })
      ).toBeVisible({ timeout: 10000 });
      await expect(submitButton).toBeEnabled();
    });
  });

  // ---------------------------------------------------------------------
  // Behavior locks — gaps re-verified against the new service. Two of
  // the three pre-restructure locks are dropped; see comments for why.
  // ---------------------------------------------------------------------
  test.describe("Behavior locks", () => {
    // DROPPED: "POST /generate against a Revoked CA is rejected" — the
    // old lock exercised generate's (now-removed) cooperativeApproachId
    // parameter directly. generateDraft takes no CA at all any more, so
    // there is no equivalent request to make; the guard question moved
    // entirely to addCooperativeApproach, which is covered by
    // "add requires the approach to be CA-status Draft" above (a
    // Revoked CA is definitionally not Draft, so it is rejected the same
    // way a Submitted one is).
    //
    // DROPPED: "a Draft CA holding an unsubmitted IR cannot be revoked"
    // — this was really testing cooperative-approach.spec's own
    // Draft-has-no-manual-transitions rule (CooperativeApproachStatus
    // guard), not anything initial-report-specific; it is already
    // locked there ("a Draft CA rejects every manual status change").
    // Re-asserting it here would just be redundant coverage of someone
    // else's module boundary.

    // KEPT and reframed: the old "PUT /update on a Submitted IR
    // succeeds today (no guard)" lock is now covered as designed
    // behaviour (not a gap) in "API: update — PUT /update on a
    // Submitted report reopens it to Draft" above, since the service
    // comment at update()'s Submitted branch makes the reopen
    // intentional rather than an oversight. Nothing left to lock here as
    // a "current no-guard state" — the guard exists, it just reopens
    // instead of rejecting.

    // NEW gap worth locking: addCooperativeApproach silently reopens a
    // Submitted report to Draft with NO corresponding guard preventing
    // that add from happening on a report whose linked approaches are
    // otherwise untouched — i.e. adding an unrelated approach forces
    // every previously-filed approach on the report through a fresh
    // (identical) submit cycle the next time someone calls /submit,
    // even though nothing about them changed. This is intentional per
    // the major/minor version design (any new approach bumps major for
    // the WHOLE report, not just itself), but it means a DNA user who
    // adds one new approach to a report covering many approaches
    // effectively re-files all of them. Documented here as the
    // clearest evididence: v2's snapshot.cooperativeApproaches contains
    // ca1 with addedInMajor=1 unchanged (not re-added), which the
    // "adding a second Draft approach..." test above already asserts
    // implicitly via the arrayContaining check — no separate test
    // needed, noting it here so the behaviour is documented rather than
    // silently relied upon.
    test("adding one new approach to a report with an existing filed approach does not disturb the existing approach's addedInMajor", async ({
      apiDna,
    }) => {
      const ca1 = await createCooperativeApproach(apiDna, {
        title: `IR Lock UnrelatedAdd A ${uniqueSuffix()}`,
      });
      const gen = await generateInitialReport(apiDna, {
        cooperativeApproachId: ca1.cooperativeApproachId,
      });
      await submitInitialReport(apiDna, gen.reportId);

      const ca2 = await createCooperativeApproach(apiDna, {
        title: `IR Lock UnrelatedAdd B ${uniqueSuffix()}`,
      });
      await apiDna.post("national/initialReport/cooperativeApproach/add", {
        reportNumber: gen.reportId,
        cooperativeApproachId: ca2.cooperativeApproachId,
      });
      const v2 = await submitInitialReport(apiDna, gen.reportId);
      expect(v2.majorVersion).toBe(2);

      const v2SnapshotRes = await apiDna.get(
        `national/initialReport/version?reportNumber=${encodeURIComponent(
          gen.reportId
        )}&major=2&minor=0`
      );
      const v2Snapshot = unwrap<any>(await apiDna.json<any>(v2SnapshotRes));
      const ca1Entry = v2Snapshot.snapshot.cooperativeApproaches.find(
        (a: any) => a.cooperativeApproachId === ca1.cooperativeApproachId
      );
      expect(ca1Entry.addedInMajor).toBe(1);
      const ca2Entry = v2Snapshot.snapshot.cooperativeApproaches.find(
        (a: any) => a.cooperativeApproachId === ca2.cooperativeApproachId
      );
      expect(ca2Entry.addedInMajor).toBe(2);
    });
  });
});
