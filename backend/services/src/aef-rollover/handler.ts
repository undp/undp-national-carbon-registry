import { AefV2ReportService } from "@app/shared/aef-v2-registry/aef-v2-report.service";
import { Handler, Context } from "aws-lambda";
import { NestFactory } from "@nestjs/core";

import { getLogger } from "../server";
import { AefRolloverModule } from "./aef-rollover.module";

export interface AefRolloverEvent {
  /** The year being opened. Defaults to the current calendar year. */
  openYear?: number;
  /** ISO 8601. Defaults to the closed year's UTC year-end. */
  asOf?: string;
  /** Forwarded to both snapshot calls. */
  force?: boolean;
}

// Scheduled via serverless.yml's `aef-rollover` function
// (cron(0 1 1 1 ? *) — 01:00 UTC, 1 January), and reachable as
// `RUN_MODULE=aef-rollover` for a manual re-run in container deployments.
// Not reachable over HTTP anywhere — see AefV2Controller's docblock.
export const handler: Handler = async (event: AefRolloverEvent = {}, context?: Context) => {
  const app = await NestFactory.createApplicationContext(AefRolloverModule, {
    logger: getLogger(AefRolloverModule),
  });

  return app.get(AefV2ReportService).rollover({
    openYear: event?.openYear,
    asOf: event?.asOf ? new Date(event.asOf) : undefined,
    force: event?.force,
  });
};
