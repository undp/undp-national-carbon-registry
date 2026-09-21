import { Module } from "@nestjs/common";
import { CreditTransactionsManagementService } from "./credit-transactions-management.service";
import { UtilModule } from "../util/util.module";
import { CompanyModule } from "../company/company.module";
import { LedgerDbModule } from "../ledger-db/ledger-db.module";
import { ProgrammeLedgerModule } from "../programme-ledger/programme-ledger.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CreditTransactionsEntity } from "../entities/credit.transactions.entity";
import { CreditBlocksEntity } from "../entities/credit.blocks.entity";
import { CooperativeApproach } from "../entities/cooperative.approach.entity";
import { CaAuthorizedEntity } from "../entities/ca.authorized.entity.entity";
import { CreditBlockBalancesViewEntity } from "../view-entities/credit.block.balances.view.entity";
import { CreditBlockTransfersViewEntity } from "../view-entities/credit.block.transfers.view.entity";
import { CreditBlockRetirementsViewEntity } from "../view-entities/credit.block.retirements.view.entity";
import { CreditBlockItmoAuthorizationsViewEntity } from "../view-entities/credit.block.itmo.authorizations.view.entity";
import { CreditBlockExplorerViewEntity } from "../view-entities/credit.block.explorer.view.entity";
import { CreditBlockIssuancesViewEntity } from "../view-entities/credit.block.issuances.view.entity";
import { CreditBlockOrgBalancesViewEntity } from "../view-entities/credit.block.org.balances.view.entity";
import { CreditBlockProjectBalancesViewEntity } from "../view-entities/credit.block.project.balances.view.entity";
import { CreditBlockProjectHolderBalancesViewEntity } from "../view-entities/credit.block.project.holder.balances.view.entity";
import { CreditBlockOrgTransactionsViewEntity } from "../view-entities/credit.block.org.transactions.view.entity";
import { CreditBlockOrgAggregationViewEntity } from "../view-entities/credit.block.org.aggregation.view.entity";
import { DocumentManagementModule } from "../document-management/document-management.module";
import { AefV2RegistryModule } from "../aef-v2-registry/aef-v2-registry.module";
import { SerialNumberManagementModule } from "../serial-number-management/serial-number-management.module";
// Provides CadTrustSyncEnqueueService — the producer-side half of credit sync to CAD Trust v2.
// Not transitively inherited through DocumentManagementModule (Nest doesn't re-export imports
// unless a module explicitly lists them in its own `exports`), so this needs its own import here,
// the same way DocumentManagementModule itself had to import it directly.
import { CadTrustSyncModule } from "../cadtrust-sync/cadtrust-sync.module";

@Module({
  imports: [
    UtilModule,
    CompanyModule,
    ProgrammeLedgerModule,
    SerialNumberManagementModule,
    TypeOrmModule.forFeature([
      CreditTransactionsEntity,
      CreditBlocksEntity,
      CooperativeApproach,
      CaAuthorizedEntity,
      CreditBlockBalancesViewEntity,
      CreditBlockTransfersViewEntity,
      CreditBlockRetirementsViewEntity,
      CreditBlockItmoAuthorizationsViewEntity,
      CreditBlockExplorerViewEntity,
      CreditBlockIssuancesViewEntity,
      CreditBlockOrgBalancesViewEntity,
      CreditBlockProjectBalancesViewEntity,
      CreditBlockProjectHolderBalancesViewEntity,
      CreditBlockOrgTransactionsViewEntity,
      CreditBlockOrgAggregationViewEntity,
    ]),
    DocumentManagementModule,
    AefV2RegistryModule,
    CadTrustSyncModule,
  ],
  providers: [CreditTransactionsManagementService],
  exports: [CreditTransactionsManagementService],
})
export class CreditTransactionsManagementModule {}
