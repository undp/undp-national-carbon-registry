import { CoreModule } from "@app/core";
import { SharedModule } from "@app/shared";
import { Logger, Module } from "@nestjs/common";

// One-shot application context for the AEF V2 start-of-year rollover,
// mirroring src/data-importer's shape. Exists for deployments where
// national-api runs as a Lambda (serverless.yml) rather than a long-running
// container — there is no process alive to fire AefV2SchedulerService's
// in-process @Cron, so this module is invoked directly by an external
// schedule (see the `aef-rollover` function in serverless.yml) or, for
// containers, via `RUN_MODULE=aef-rollover` as a manual re-run path.
//
// AefV2ReportService (and everything it needs — store, holdings/authorized
// entities providers, submission defaults) comes through SharedModule's
// re-export of AefV2RegistryModule; nothing AEF-specific is wired here.
@Module({
  imports: [SharedModule, CoreModule],
  providers: [Logger],
})
export class AefRolloverModule {}
