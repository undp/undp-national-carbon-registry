import {
  AefBundleDeps,
  AefRolloverOptions,
  AefSubmissionDefaults,
  AefTableName,
  AuthorizedEntitiesProvider,
  exportFileName,
  formatSubmissionDate,
  HoldingsProvider,
  loadSubmissionBundle,
  openReportingYear,
  submissionExportFileName,
  SubmitOptions,
  submitAefReport,
  toAefSubmissionExport,
  toCsv,
  toSubmissionCsv,
  toValidationBundle,
  validateSubmission,
} from "@app/aef-v2";
import {
  AEF_FULL_REPORT_TEMPLATE,
  toSubmissionTemplateXlsxBuffer,
  toXlsxBuffer,
} from "@app/aef-v2/export/xlsx";
import { Inject, Injectable } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

import { SortEntry } from "../dto/sort.entry";
import { ExportFileType } from "../enum/export.file.type.enum";
import { FileHandlerInterface } from "../file-handler/filehandler.interface";
import { CountryService } from "../util/country.service";
import { AefStoreFactory } from "./aef-v2-store.factory";
import {
  AEF_AUTHORIZED_ENTITIES_PROVIDER,
  AEF_HOLDINGS_PROVIDER,
  AEF_SUBMISSION_DEFAULTS,
} from "./aef-v2.tokens";
import { RegistryControlledValueProvider } from "./providers/registry-controlled-values.provider";

export interface AefV2DownloadResult {
  url: string;
  outputFileName: string;
}

/** Applied when the caller sends no `sort`. */
const DEFAULT_SORT: SortEntry = { key: "updatedAt", order: "DESC" };

/**
 * Per-table overrides of {@link DEFAULT_SORT}.
 *
 * Holdings rows for an open year are computed live by the provider and never
 * reach the store, so they carry no `updatedAt` for the default key to sort on —
 * it orders by authorization id instead, which is present on both the live and
 * the frozen path.
 */
const TABLE_DEFAULT_SORT: Partial<Record<AefTableName, SortEntry>> = {
  t4Holdings: { key: "aefT4HoldingsAuthorizationId", order: "DESC" },
};

/** A full ISO 8601 instant — excludes bare dates/years and anything else `Date.parse` would guess at. */
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/** A string that is entirely digits (optionally signed) — safe to compare numerically. */
const NUMERIC_STRING = /^-?\d+$/;

// Timestamps compare as epoch, not as text: TypeORM returns `Date` objects
// whose default stringification collates by weekday name, and ISO strings
// only compare correctly when every value shares the same fractional precision.
// Purely-numeric strings (e.g. authorization ids like "10") get the same
// treatment — compared as text, "10" sorts before "9".
function comparable(value: unknown): unknown {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === "string" && ISO_INSTANT.test(value)) {
    const epoch = Date.parse(value);
    if (!Number.isNaN(epoch)) {
      return epoch;
    }
  }
  if (typeof value === "string" && NUMERIC_STRING.test(value)) {
    return Number(value);
  }
  return value;
}

/**
 * The controller-facing service: query, validate, submit, export, and the
 * year rollover. Every AEF table read or write goes through `@app/aef-v2` —
 * this service assembles the library's ports from registry infrastructure
 * and otherwise just forwards to the library's own operations.
 */
@Injectable()
export class AefV2ReportService {
  constructor(
    private readonly storeFactory: AefStoreFactory,
    @Inject(AEF_SUBMISSION_DEFAULTS) private readonly defaults: AefSubmissionDefaults,
    @Inject(AEF_HOLDINGS_PROVIDER) private readonly holdings: HoldingsProvider,
    @Inject(AEF_AUTHORIZED_ENTITIES_PROVIDER)
    private readonly authorizedEntities: AuthorizedEntitiesProvider,
    private readonly fileHandler: FileHandlerInterface,
    private readonly controlledValues: RegistryControlledValueProvider,
    private readonly countryService: CountryService
  ) {}

  private deps(): AefBundleDeps {
    return {
      store: this.storeFactory.forManager(),
      holdings: this.holdings,
      authorizedEntities: this.authorizedEntities,
    };
  }

  async loadBundle(reportedYear: number) {
    return loadSubmissionBundle(this.deps(), this.defaults, reportedYear);
  }

  /**
   * Requirement 4: one table's rows for a reporting year.
   *
   * Deliberately built on `loadSubmissionBundle`, not a raw `AefStore.find`
   * — the library's store has no notion of "this year", so a caller reading
   * a single table directly would have to resolve Submission versions and,
   * for Holdings/Authorized entities, the live-vs-frozen split itself. The
   * bundle already does all of that.
   */
  async query(table: AefTableName, reportedYear: number, sort?: SortEntry) {
    const bundle = await this.loadBundle(reportedYear);
    const exportData = toAefSubmissionExport(bundle);
    const effectiveSort = sort ?? TABLE_DEFAULT_SORT[table] ?? DEFAULT_SORT;
    return {
      // Sorted before forDisplay, which rewrites Table 3's date to dd/mm/yyyy.
      data: this.forDisplay(table, this.sorted(exportData[table] ?? [], effectiveSort)),
      provisional:
        table === "t4Holdings"
          ? bundle.provisional.holdings
          : table === "t5AuthorizedEntities"
            ? bundle.provisional.authorizedEntities
            : false,
      snapshotAt:
        table === "t4Holdings"
          ? bundle.snapshotAt.holdings
          : table === "t5AuthorizedEntities"
            ? bundle.snapshotAt.authorizedEntities
            : undefined,
    };
  }

  /**
   * Ordering for the read path, in memory — not `AefQuery.sort` on the store,
   * since `loadSubmissionBundle` also feeds `download`/`validate`/`submit`, and
   * an open year's Tables 4/5 are provider-computed rows that never reach the
   * store at all.
   */
  private sorted(rows: readonly Record<string, unknown>[], sort: SortEntry) {
    if (!sort?.key) {
      return rows;
    }
    const descending = String(sort.order ?? "DESC").toUpperCase() === "DESC";

    // Partitioned rather than handled in the comparator, which must stay transitive.
    const keyed: Record<string, unknown>[] = [];
    const unkeyed: Record<string, unknown>[] = [];
    for (const row of rows) {
      const value = row[sort.key];
      (value === undefined || value === null ? unkeyed : keyed).push(row);
    }

    keyed.sort((a, b) => {
      const left = comparable(a[sort.key]);
      const right = comparable(b[sort.key]);
      const comparison =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right));
      return descending ? -comparison : comparison;
    });

    return sort.nullFirst ? [...unkeyed, ...keyed] : [...keyed, ...unkeyed];
  }

  /**
   * Presentation shaping for the reporting tables, applied on the read path
   * only — `download` deliberately does not call this.
   *
   * Table 3's Action date is stored as an ISO 8601 UTC datetime, which is what
   * the AEF requires (`field-spec.ts` types it `datetime`, and `recordAction`
   * derives the reporting year by parsing it), so the stored value and the CARP
   * export keep the time. On screen it reads as the day alone, matching Table
   * 2's Date of authorization, which the mapper already stores as `dd/mm/yyyy`.
   *
   * `formatSubmissionDate` is UTC-based, so the day shown is the day the action
   * carries rather than the server's local rendering of that instant.
   */
  private forDisplay(table: AefTableName, rows: readonly Record<string, unknown>[]) {
    if (table !== "t3Actions") {
      return rows;
    }
    return rows.map((row) => {
      const actionDate = row.aefT3ActionsDate;
      if (typeof actionDate !== "string") {
        return row;
      }
      const parsed = new Date(actionDate);
      // A value that is not a parseable date is passed through untouched
      // rather than turned into "NaN/NaN/NaN".
      if (Number.isNaN(parsed.getTime())) {
        return row;
      }
      return { ...row, aefT3ActionsDate: formatSubmissionDate(parsed) };
    });
  }

  async validate(reportedYear: number) {
    const bundle = await this.loadBundle(reportedYear);
    return validateSubmission(toValidationBundle(bundle), { controlledValues: this.controlledValues });
  }

  async submit(reportedYear: number, options: SubmitOptions = {}) {
    return submitAefReport(this.deps(), this.defaults, reportedYear, options);
  }

  /**
   * The start-of-year rollover. Deliberately not exposed over HTTP — see
   * AefV2SchedulerService (in-process cron) and src/aef-rollover (the
   * serverless one-shot trigger), both of which call this and nothing else.
   */
  async rollover(options: AefRolloverOptions = {}) {
    return openReportingYear(this.deps(), this.defaults, options);
  }

  config(): AefSubmissionDefaults {
    return this.defaults;
  }

  async download(
    reportedYear: number,
    fileType: ExportFileType,
    table?: AefTableName
  ): Promise<AefV2DownloadResult> {
    const bundle = await this.loadBundle(reportedYear);
    const exportData = toAefSubmissionExport(bundle);

    const extension = fileType === ExportFileType.XLSX ? "xlsx" : "csv";
    // Named by the library's own helpers rather than by hand, so the file a
    // user downloads matches the one submitAefReport files with CARP. The Party
    // is the alpha-3 code the submission itself carries — not the display name
    // Table 1 renders, which belongs on the page rather than in a filename.
    const party = String(
      exportData.t1Submission?.[0]?.aefT1SubmissionParty ?? this.defaults.aefT1SubmissionParty ?? ""
    );
    const outputFileName = table
      ? exportFileName(table, extension, reportedYear)
      : submissionExportFileName(party, reportedYear, extension);

    let content: string;
    if (fileType === ExportFileType.XLSX) {
      const buffer = table
        ? await toXlsxBuffer(table, exportData[table] ?? [])
        : // The full report goes into the official CARP workbook rather than a
          // generated grid — see toSubmissionTemplateXlsxBuffer. Reported year
          // needs no separate plumbing: it is a Table 1 field, filled from the
          // submission record like everything else.
          await toSubmissionTemplateXlsxBuffer(exportData, {
            templatePath: this.fullReportTemplatePath(),
            partyDisplayName: await this.partyDisplayName(),
          });
      content = buffer.toString("base64");
    } else {
      const csv = table ? toCsv(table, exportData[table] ?? []) : toSubmissionCsv(exportData);
      content = Buffer.from(csv, "utf8").toString("base64");
    }

    const url = await this.fileHandler.uploadFile("documents/exports/" + outputFileName, content);
    return { url, outputFileName };
  }

  /**
   * The reporting Party's country name, for Table 1's Party cell in the
   * full-report workbook.
   *
   * Presentation only — see `SubmissionTemplateOptions.partyDisplayName`. The
   * stored value and every other Party field stay ISO 3166-1 alpha-3, which is
   * what the AEF field spec requires.
   *
   * Falls back to the code when the Party is not in the `country` table (an
   * `AEF_PARTY` override set to a code this deployment does not carry, or a
   * reserved code such as `EUE` that is not a country at all).
   */
  private async partyDisplayName(): Promise<string | undefined> {
    const party = this.defaults.aefT1SubmissionParty;
    if (!party) {
      return undefined;
    }
    return (await this.countryService.getCountryNameByAlpha3(party)) ?? party;
  }

  /**
   * Locates the CARP full-report workbook that ships inside `@app/aef-v2`.
   *
   * The library declares its own layout ({@link AEF_FULL_REPORT_TEMPLATE});
   * only the `dist/aef-v2/src` prefix is this repo's business, and it comes
   * from nest-cli.json's asset rule for `libs/aef-v2/src/export/templates/**`
   * plus the fact that the webpack bundle's `__dirname` is `dist`. Same shape
   * as `AefReportManagementService.fillTemplate` uses for the V1 templates.
   *
   * Checked explicitly so a packaging slip fails with the missing path rather
   * than ExcelJS's bare ENOENT.
   */
  private fullReportTemplatePath(): string {
    const templatePath = path.resolve(
      __dirname,
      "aef-v2",
      "src",
      ...AEF_FULL_REPORT_TEMPLATE.segments
    );
    if (!fs.existsSync(templatePath)) {
      throw new Error(
        `AEF V2 full-report template not found at ${templatePath}. ` +
          `Check that nest-cli.json still copies libs/aef-v2/src/export/templates into the build output.`
      );
    }
    return templatePath;
  }
}
