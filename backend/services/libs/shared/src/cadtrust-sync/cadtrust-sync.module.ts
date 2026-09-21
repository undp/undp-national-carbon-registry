import { CadTrustModule } from "@app/cadtrust";
import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AsyncOperationsModule } from "../async-operations/async-operations.module";
import { CaAuthorizedEntity } from "../entities/ca.authorized.entity.entity";
import { CadTrustSyncRecordEntity } from "../entities/cadtrust.sync.record.entity";
import { Company } from "../entities/company.entity";
import { Country } from "../entities/country.entity";
import { CreditBlocksEntity } from "../entities/credit.blocks.entity";
import { CreditTransactionsEntity } from "../entities/credit.transactions.entity";
import { DocumentEntity } from "../entities/document.entity";
import { ProjectEntity } from "../entities/projects.entity";
import { ProgrammeLedgerModule } from "../programme-ledger/programme-ledger.module";
import { SerialNumberManagementModule } from "../serial-number-management/serial-number-management.module";
import { CadTrustCreditResourceService } from "./cadtrust-credit-resource.service";
import { CadTrustPicklistService } from "./cadtrust-picklist.service";
import { CadTrustProjectResourceService } from "./cadtrust-project-resource.service";
import { CadTrustRegistryProfileService } from "./cadtrust-registry-profile.service";
import {
  CADTRUST_SYNC_HANDLERS,
  CadTrustSyncDispatcherService,
} from "./cadtrust-sync.dispatcher.service";
import { CadTrustSyncEnqueueService } from "./cadtrust-sync.enqueue.service";
import { CadTrustSyncQueryService } from "./cadtrust-sync-query.service";
import { CadTrustSyncRecordService } from "./cadtrust-sync-record.service";
import { CadTrustBootstrapHandler } from "./handlers/bootstrap.handler";
import { CadTrustCommitHandler } from "./handlers/commit.handler";
import { CadTrustCreditIssuanceHandler } from "./handlers/credit-issuance.handler";
import { CadTrustProjectCreateHandler } from "./handlers/project-create.handler";
import { CadTrustProjectUpdateHandler } from "./handlers/project-update.handler";
import { CadTrustReconcileHandler } from "./handlers/reconcile.handler";
import { CadTrustUnitUpdateHandler } from "./handlers/unit-update.handler";
import { CadTrustValidationCreateHandler } from "./handlers/validation-create.handler";
import { CadTrustVerificationCreateHandler } from "./handlers/verification-create.handler";
import { CadTrustCreditUnitMapper } from "./mappers/credit-unit.mapper";
import { CadTrustLocationMapper } from "./mappers/location.mapper";
import { CadTrustProjectMapper } from "./mappers/project.mapper";
import { CadTrustStakeholderMapper } from "./mappers/stakeholder.mapper";
import { CadTrustUnitLabelMapper } from "./mappers/unit-label.mapper";
import { CadTrustValidationMapper } from "./mappers/validation.mapper";
import { CadTrustVerificationMapper } from "./mappers/verification.mapper";

/**
 * CAD Trust v2 sync adaptor.
 *
 * The registry-specific half of the CAD Trust integration: it decides *what* to
 * send and *when*, and owns every mapping from this registry's data model onto
 * CAD Trust's. The transport half is `@app/cadtrust`, which knows nothing about
 * this registry and should never need to change for it.
 *
 * ## Registering a new synced entity
 *
 * 1. Append an `AsyncActionType` member (never reorder — the ordinals are
 *    persisted) and add its label in a migration.
 * 2. Add a mapper under `mappers/`.
 * 3. Add a handler under `handlers/` extending `CadTrustSyncHandler`, and list it
 *    in `SYNC_HANDLERS` below.
 * 4. Add a typed method to `CadTrustSyncEnqueueService` and call it from wherever
 *    the domain event happens.
 *
 * Nothing outside this module changes — not the dispatcher, and not the shared
 * `async-operations-handler.service.ts` switch.
 *
 * ## Why repositories (and the ledger service) rather than domain services
 *
 * `DocumentManagementService` enqueues these actions, so injecting it here would
 * make `DocumentManagementModule` and this module mutually dependent. Handlers
 * (mostly via `CadTrustProjectResourceService`, which centralizes the repository
 * access shared by the project-create, project-update and reconcile handlers)
 * therefore read `DocumentEntity` / `Company` through repositories, and current
 * project state through `ProgrammeLedgerService` (imported via `ProgrammeLedgerModule`,
 * confirmed dependency-cycle-free) — never `ProjectEntity`, which the ledger replicator
 * populates asynchronously and cannot be trusted to exist yet, or to already reflect a
 * just-written transition, at sync time (see `handlers/project-create.handler.ts`'s and
 * `handlers/project-update.handler.ts`'s class docs).
 */
const SYNC_HANDLERS = [
  CadTrustBootstrapHandler,
  CadTrustProjectCreateHandler,
  CadTrustProjectUpdateHandler,
  CadTrustValidationCreateHandler,
  CadTrustCommitHandler,
  CadTrustReconcileHandler,
  CadTrustVerificationCreateHandler,
  CadTrustCreditIssuanceHandler,
  CadTrustUnitUpdateHandler,
];

@Module({
  imports: [
    ConfigModule,
    CadTrustModule,
    AsyncOperationsModule,
    ProgrammeLedgerModule,
    SerialNumberManagementModule,
    TypeOrmModule.forFeature([
      CadTrustSyncRecordEntity,
      DocumentEntity,
      Company,
      Country,
      CaAuthorizedEntity,
      CreditBlocksEntity,
      CreditTransactionsEntity,
      ProjectEntity,
    ]),
  ],
  providers: [
    Logger,
    CadTrustSyncRecordService,
    CadTrustSyncEnqueueService,
    CadTrustPicklistService,
    CadTrustRegistryProfileService,
    CadTrustProjectMapper,
    CadTrustStakeholderMapper,
    CadTrustLocationMapper,
    CadTrustValidationMapper,
    CadTrustVerificationMapper,
    CadTrustCreditUnitMapper,
    CadTrustUnitLabelMapper,
    CadTrustProjectResourceService,
    CadTrustCreditResourceService,
    CadTrustSyncQueryService,
    ...SYNC_HANDLERS,
    {
      provide: CADTRUST_SYNC_HANDLERS,
      useFactory: (...handlers) => handlers,
      inject: SYNC_HANDLERS,
    },
    CadTrustSyncDispatcherService,
  ],
  exports: [
    // Producers need the enqueue service; the async-operations consumer needs the
    // dispatcher. Nothing else should reach into this module.
    CadTrustSyncEnqueueService,
    CadTrustSyncDispatcherService,
    CadTrustSyncRecordService,
    CadTrustSyncQueryService,
  ],
})
export class CadTrustSyncModule {}
