import { AnalyticsAPIModule } from "./analytics-api/analytics.api.module";
import { handler } from "./ledger-replicator/handler";
import * as setupHandler from "./setup/handler";
import { NationalAPIModule } from "./national-api/national.api.module";
import { buildNestApp } from "./shared/server";
import { join } from "path";

async function bootstrap() {
  let module;
  let httpPath;
  switch (process.env.RUN_MODULE) {
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
      return;
    default:
      module = NationalAPIModule;
      httpPath = "national";
  }

  const app = await buildNestApp(module, "/" + httpPath);
  if (process.env.RUN_MODULE == "national-api") {
    const staticPath = join(__dirname, '..', 'public')
    console.log('Static file path:', staticPath)
    app.useStaticAssets(staticPath);
    await setupHandler.handler();
  }
  await app.listen(process.env.RUN_PORT || 3000);
  // global.baseUrl = await app.getUrl();
}
bootstrap();
