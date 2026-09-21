import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AsyncActionEntity } from "@app/shared/entities/async.action.entity";
import { Counter } from "@app/shared/entities/counter.entity";
import { CadTrustSyncModule } from "@app/shared/cadtrust-sync/cadtrust-sync.module";
import { CoreModule } from "@app/core";

import { AsyncOperationsHandlerInterface } from "./async-operations-handler-interface.service";
import { CadTrustAsyncOperationsHandlerService } from "./cadtrust-async-operations-handler.service";

/**
 * The CAD Trust-only counterpart to `async-operations.module.ts` (`AsyncOperationsModuleMain`) —
 * intentionally much lighter. It only ever needs to reach `CadTrustSyncDispatcherService`, not the
 * generic switch in `AsyncOperationsHandlerService`, so it does not import `SharedModule` /
 * `EmailModule` / `RegistryClientModule` / the legacy `CadtModule` at all. `CoreModule` is what
 * actually brings in the global `ConfigModule.forRoot(...)` and the TypeORM connection (see
 * `AppConfigModule`) — required since this boots as its own standalone application context, the
 * same way `AsyncOperationsModuleMain` does for the shared lane. See
 * `cadtrust-async-operations-handler.service.ts`'s class doc for why this lane exists.
 */
@Module({
  imports: [
    CoreModule,
    TypeOrmModule.forFeature([AsyncActionEntity, Counter]),
    CadTrustSyncModule,
  ],
  providers: [
    Logger,
    {
      provide: AsyncOperationsHandlerInterface,
      useClass: CadTrustAsyncOperationsHandlerService,
    },
  ],
})
export class CadTrustAsyncOperationsModule {}
