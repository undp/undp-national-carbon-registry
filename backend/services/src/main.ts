import { handler } from "./ledger-replicator/handler";
import { handler as asyncHandler } from "./async-operations-handler/handler";
import { handler as cadTrustAsyncHandler } from "./async-operations-handler/cadtrust-handler";
import { handler as importHandler } from "./data-importer/handler";
import { handler as aefRolloverHandler } from "./aef-rollover/handler";
import * as setupHandler from "@app/shared/setup/handler";
import { CadTrustSyncEnqueueService } from "@app/shared/cadtrust-sync/cadtrust-sync.enqueue.service";
import { NationalAPIModule } from "./national-api/national.api.module";
import { join } from "path";
import { AnalyticsAPIModule } from "./analytics-api/analytics.api.module";
import { buildNestApp } from "./server";
import * as fs from "fs";
//const fs = require("fs");

async function bootstrap() {
  let module;
  let httpPath;

  let modules = ["national-api"];
  if (process.env.RUN_MODULE) {
    modules = process.env.RUN_MODULE.split(",");
  }

  for (const moduleName of modules) {
    console.log("Starting module", moduleName);
    switch (moduleName) {
      case "national-api":
        module = NationalAPIModule;
        httpPath = "national";
        break;
      case "analytics-api":
        module = AnalyticsAPIModule;
        httpPath = "stats";
        break;
      case "replicator":
        await handler();
        console.log("Module initiated", moduleName);
        continue;
      case "async-operations-handler":
        await asyncHandler();
        console.log("Module initiated", moduleName);
        continue;
      case "cadtrust-operations-handler":
        // CAD Trust's own async lane — separate cursor, separate loop, plus a recurring
        // reconcile timer, all independent of async-operations-handler above. See
        // src/async-operations-handler/cadtrust-async-operations-handler.service.ts.
        await cadTrustAsyncHandler();
        console.log("Module initiated", moduleName);
        continue;
      case "data-importer":
        await importHandler({ importTypes: process.env.DATA_IMPORT_TYPES });
        console.log("Module initiated", moduleName);
        continue;
      case "aef-rollover":
        // Manual re-run path for the AEF V2 start-of-year rollover
        // (container deployments only — see AefV2SchedulerService for the
        // normal in-process trigger, and serverless.yml's `aef-rollover`
        // function for the Lambda equivalent of this same handler).
        await aefRolloverHandler({});
        console.log("Module initiated", moduleName);
        continue;
      default:
        module = NationalAPIModule;
        httpPath = "national";
    }

    const app = await buildNestApp(module, "/" + httpPath);
    if (moduleName == "national-api") {
      if (fs.existsSync("organisations.csv")) {
        const orgs = await fs.readFileSync("organisations.csv", "utf8");
        console.log("Inserting orgs", orgs);
        await setupHandler.handler({ type: "IMPORT_ORG", body: orgs });
      }

      if (fs.existsSync("users.csv")) {
        const users = await fs.readFileSync("users.csv", "utf8");
        console.log("Inserting users", users);
        await setupHandler.handler({ type: "IMPORT_USERS", body: users });
      }

      const staticPath = join(__dirname, "..", "public");
      console.log("Static file path:", staticPath);
      app.useStaticAssets(staticPath);
      await setupHandler.handler();

      // Verifies the CAD Trust home organization and stages the registry's
      // program + methodology if not already synced. Enqueued on every start on
      // purpose — CadTrustBootstrapHandler is idempotent, dropped entirely when
      // CADT_V2_ENABLE is off, and runs in the replicator's
      // async-operations-handler, not here. See libs/shared/src/cadtrust-sync/README.md.
      const cadTrustSyncEnqueue = app.get(CadTrustSyncEnqueueService);
      await cadTrustSyncEnqueue.enqueueBootstrap();
      // Retries a staged-but-uncommitted batch and re-drives any project left with a FAILED
      // sync record — otherwise nothing ever revisits one. Same idempotent-on-every-start
      // reasoning as enqueueBootstrap() above.
      await cadTrustSyncEnqueue.enqueueReconcile();
    }
    await app.listen(process.env.RUN_PORT || 3000);
    console.log("Module initiated", moduleName);
  }
}
bootstrap();
