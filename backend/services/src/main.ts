import { join } from "path";
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
        module = (await import("./national-api/national.api.module"))
          .NationalAPIModule;
        httpPath = "national";
        break;
      case "analytics-api":
        module = (await import("./analytics-api/analytics.api.module"))
          .AnalyticsAPIModule;
        httpPath = "stats";
        break;
      case "regional-market-api":
        module = (await import("./regional-market-api/regional.market.api.module"))
          .RegionalMarketAPIModule;
        httpPath = "regional";
        break;
      case "replicator": {
        const { handler } = await import("./ledger-replicator/handler");
        await handler();
        console.log("Module initiated", moduleName);
        continue;
      }
      case "async-operations-handler": {
        const { handler: asyncHandler } = await import(
          "./async-operations-handler/handler"
        );
        await asyncHandler();
        console.log("Module initiated", moduleName);
        continue;
      }
      case "data-importer": {
        const { handler: importHandler } = await import("./data-importer/handler");
        await importHandler({ importTypes: process.env.DATA_IMPORT_TYPES });
        console.log("Module initiated", moduleName);
        continue;
      }
      default:
        module = (await import("./national-api/national.api.module"))
          .NationalAPIModule;
        httpPath = "national";
    }

    const app = await buildNestApp(module, "/" + httpPath, undefined, {
      useClassValidatorContainer: moduleName !== "regional-market-api",
    });
    if (moduleName == "national-api") {
      if (fs.existsSync("organisations.csv")) {
        const orgs = await fs.readFileSync("organisations.csv", "utf8");
        console.log("Inserting orgs", orgs);
        const setupHandler = await import("@app/shared/setup/handler");
        await setupHandler.handler({ type: "IMPORT_ORG", body: orgs });
      }

      if (fs.existsSync("users.csv")) {
        const users = await fs.readFileSync("users.csv", "utf8");
        console.log("Inserting users", users);
        const setupHandler = await import("@app/shared/setup/handler");
        await setupHandler.handler({ type: "IMPORT_USERS", body: users });
      }

      const staticPath = join(__dirname, "..", "public");
      console.log("Static file path:", staticPath);
      app.useStaticAssets(staticPath);
      const setupHandler = await import("@app/shared/setup/handler");
      await setupHandler.handler();
    }
    await app.listen(process.env.RUN_PORT || 3000);
    console.log("Module initiated", moduleName);
  }
}
bootstrap();
