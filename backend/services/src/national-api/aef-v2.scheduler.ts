import { AefV2ReportService } from "@app/shared/aef-v2-registry/aef-v2-report.service";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";

// AEF V2 start-of-year rollover — sibling of AefV2Controller, deliberately
// with no @Controller and no routes. This must not be triggerable from the
// frontend or any other caller: it opens the new year's Table 1 Submission
// and freezes the closed year's Table 4/5 snapshots via
// AefV2ReportService.rollover() -> @app/aef-v2's openReportingYear, which is
// the registry's chosen entry point for exactly this operation.
//
// Fires at 01:00 UTC on 1 January, not on the boundary itself — the library
// derives "current year" from Date#getUTCFullYear() (see clock.ts), and a
// tick landing within a few seconds of midnight risks resolving to the wrong
// year under clock skew. An hour of slack removes that risk entirely.
//
// This only fires in a long-running national-api process (docker-compose /
// container deployments). Serverless (Lambda) deployments have no process
// alive to fire an in-process cron, so they use the separate `aef-rollover`
// one-shot module scheduled via serverless.yml instead — see
// AEF_V2.rolloverCronEnabled below for how the two are kept from double-firing.
@Injectable()
export class AefV2SchedulerService {
  private readonly logger = new Logger(AefV2SchedulerService.name);

  constructor(
    private readonly aefV2ReportService: AefV2ReportService,
    private readonly configService: ConfigService
  ) {}

  @Cron("0 1 1 1 *", { name: "aefV2YearRollover", timeZone: "UTC" })
  async handleYearRollover(): Promise<void> {
    if (this.configService.get<boolean>("AEF_V2.rolloverCronEnabled") === false) {
      this.logger.log("AEF V2 year rollover cron is disabled (AEF_ROLLOVER_CRON_ENABLED=false); skipping");
      return;
    }

    this.logger.log("AEF V2 year rollover starting");
    try {
      const result = await this.aefV2ReportService.rollover();
      this.logger.log(
        `AEF V2 year rollover complete: opened ${result.openedYear} ` +
          `(submission ${result.submissionCreated ? "created" : "already existed"}), ` +
          `closed ${result.closedYear} (holdings ${result.holdings.rows.length} rows, ` +
          `${result.holdings.created ? "newly snapshotted" : "already frozen"}; ` +
          `authorized entities ${result.authorizedEntities.rows.length} rows, ` +
          `${result.authorizedEntities.created ? "newly snapshotted" : "already frozen"})`
      );
    } catch (error) {
      // An unhandled rejection inside a Nest cron tick takes the whole
      // process down. The operation is idempotent (see openReportingYear's
      // docblock), so logging and letting a future manual run or the next
      // tick retry is safer than crashing national-api on New Year's Day.
      this.logger.error(`AEF V2 year rollover failed: ${error?.message ?? error}`, error?.stack);
    }
  }
}
