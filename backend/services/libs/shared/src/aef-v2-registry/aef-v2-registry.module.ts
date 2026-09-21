import { AefV2Module } from "@app/aef-v2/typeorm";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CaAuthorizedEntity } from "../entities/ca.authorized.entity.entity";
import { CooperativeApproach } from "../entities/cooperative.approach.entity";
import { CreditBlocksEntity } from "../entities/credit.blocks.entity";
import { CreditTransactionsEntity } from "../entities/credit.transactions.entity";
import { ProjectEntity } from "../entities/projects.entity";
import { FileHandlerModule } from "../file-handler/filehandler.module";
import { SerialNumberManagementModule } from "../serial-number-management/serial-number-management.module";
import { UtilModule } from "../util/util.module";
import { CountryService } from "../util/country.service";
import { AefV2ReportService } from "./aef-v2-report.service";
import { aefSubmissionDefaultsFactory } from "./aef-v2-defaults.factory";
import { AefStoreFactory } from "./aef-v2-store.factory";
import { AefV2WriteService } from "./aef-v2-write.service";
import {
  AEF_AUTHORIZED_ENTITIES_PROVIDER,
  AEF_HOLDINGS_PROVIDER,
  AEF_SUBMISSION_DEFAULTS,
} from "./aef-v2.tokens";
import { RegistryAuthorizedEntitiesProvider } from "./providers/registry-authorized-entities.provider";
import { RegistryControlledValueProvider } from "./providers/registry-controlled-values.provider";
import { RegistryHoldingsProvider } from "./providers/registry-holdings.provider";

/**
 * This registry's implementation of the `@app/aef-v2` ports, plus the
 * write/report services built on top of them.
 *
 * Deliberately does **not** import `CreditTransactionsManagementModule`,
 * `ProgrammeLedgerModule` or `CooperativeApproachModule` — this module is
 * imported *by* `CreditTransactionsManagementModule` (for the event hook),
 * so importing back would be a cycle. Repositories are wired directly via
 * `TypeOrmModule.forFeature` instead.
 *
 * Importing `AefV2Module` here is also what finally registers the five AEF
 * V2 entities under `autoLoadEntities` — that module's own docblock notes it
 * is deliberately not wired anywhere until a caller needs it, and this is
 * that caller.
 */
@Module({
  imports: [
    UtilModule,
    SerialNumberManagementModule,
    FileHandlerModule,
    AefV2Module,
    TypeOrmModule.forFeature([
      CreditBlocksEntity,
      CreditTransactionsEntity,
      ProjectEntity,
      CooperativeApproach,
      CaAuthorizedEntity,
    ]),
  ],
  providers: [
    AefStoreFactory,
    {
      provide: AEF_SUBMISSION_DEFAULTS,
      useFactory: aefSubmissionDefaultsFactory,
      inject: [ConfigService, CountryService],
    },
    { provide: AEF_HOLDINGS_PROVIDER, useClass: RegistryHoldingsProvider },
    { provide: AEF_AUTHORIZED_ENTITIES_PROVIDER, useClass: RegistryAuthorizedEntitiesProvider },
    RegistryControlledValueProvider,
    AefV2WriteService,
    AefV2ReportService,
  ],
  exports: [AefV2WriteService, AefV2ReportService, AEF_SUBMISSION_DEFAULTS],
})
export class AefV2RegistryModule {}
