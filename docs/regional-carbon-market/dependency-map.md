# Regional Carbon Market Extraction Dependency Map

## Boundary

The extracted subsystem is a regional carbon asset registry plus OTC settlement PoC. It preserves the registry lifecycle and adds market-facing read models. It is not a continuous exchange.

## Included API Controllers

- `backend/services/src/national-api/project-management.controller.ts`
  - Source pattern for project query, details, and logs.
- `backend/services/src/national-api/document.controller.ts`
  - Source pattern for project creation, document workflow, approval, and issuance.
- `backend/services/src/national-api/credit.transactions.management.controller.ts`
  - Source pattern for transfer, retirement, balances, transfers, and retirement queries.
- `backend/services/src/national-api/company.controller.ts`
  - Source pattern for organization/account holder operations.
- `backend/services/src/national-api/user.controller.ts`
  - Source pattern for user and role/account association.
- New regional facade:
  - `backend/services/src/regional-market-api/*`

## Included Services

- `ProjectManagementService`
  - Query/details/logs.
  - Depends on project/document/activity views and existing auth/audit helpers.
- `DocumentManagementService`
  - Project creation and workflow entry point.
  - Calls `ProgrammeLedgerService.createProject`, `updateProjectProposalStage`, and `issueCredits`.
- `ProgrammeLedgerService`
  - Source of truth for project creation, approval stage updates, issuance, transfer, and retirement actions.
- `CreditBlocksManagementService`
  - Credit block splitting/generation and serial-number preservation.
- `CreditTransactionsManagementService`
  - Transfer, retirement request/action, balance query, transfer query, retirement query.
- `CompanyService` and `UserService`
  - Account holder identity and role context.
- `SerialNumberManagementService`
  - Required for traceable credit-block generation.
- `AuditLogsService`
  - Required where existing workflow records regulated actions.
- New regional services:
  - `RegionalMarketService`
  - `MarketTradeExecutionService`
  - `RegionalMarketProjectionService`

## Included Entities And Views

- `ProjectEntity`
- `CreditBlocksEntity`
- `CreditTransactionsEntity`
- `Company`
- `User`
- `AuditEntity`
- `Counter`
- `DocumentEntity`
- `ActivityEntity`
- project/document/activity view entities required by existing services
- credit balance/transfer/retirement view entities required by `CreditTransactionsManagementService`
- New market read/write entities:
  - `MarketTradeExecutionEntity`
  - `RegionalMarketProjectionEntity`

## Modules To Avoid In First PoC

Avoid pulling these into the regional facade unless an existing dependency forces it:

- `ProgrammeModule` legacy programme CRUD surface.
- `AnnualReportModule`.
- `CadtModule`.
- `RegistryClientModule`.
- `AnalyticsAPIModule` and national accounting APIs.
- `AefReportManagementModule` except where currently required by `CreditTransactionsManagementModule`.
- Replicator, async handler, and importer runtime modules.

## Hidden Dependency Notes

- `ProjectManagementModule` imports `DocumentManagementModule`, `ProgrammeLedgerModule`, `CompanyModule`, `UserModule`, `EmailHelperModule`, `FileHandlerModule`, `AuditLogsModule`, `CaslModule`, and `UtilModule`.
- `DocumentManagementModule` imports `ProgrammeLedgerModule`, `EmailHelperModule`, `AuditLogsModule`, `CompanyModule`, `FileHandlerModule`, `UserModule`, and `SerialNumberManagementModule`.
- `ProgrammeLedgerModule` imports `LedgerDbModule`, `CaslModule`, `UtilModule`, `CreditBlocksManagementModule`, and `SerialNumberManagementModule`.
- `CreditTransactionsManagementModule` imports `CompanyModule`, `ProgrammeLedgerModule`, `DocumentManagementModule`, and `AefReportManagementModule`.
- `UtilModule` imports `CoreModule`, `FileHandlerModule`, `AsyncOperationsModule`, and multiple TypeORM entities. This makes it a heavy but currently central dependency.
- `CompanyService` and `UserService` use `forwardRef` through `EmailHelperService`; tests for the regional facade should mock services instead of compiling the full graph unless intentionally testing DI.

## Serial Number Notes

Credit traceability depends on preserving existing serial-number behavior:

- `ProgrammeLedgerService.issueCredits(...)` creates issued credits and delegates credit-block behavior.
- `CreditBlocksManagementService` splits and creates credit blocks.
- `SerialNumberManagementService` and `@undp/serial-number-gen` must remain the source of serial formatting rules.
- The regional facade must not synthesize serial numbers independently.

## Dashboard Data Needs

The command-center dashboard needs projection-shaped data rather than raw ledger tables:

- total issued credits;
- active/registered project count;
- transferred credits;
- retired/cancelled credits;
- average OTC price;
- recent project registrations;
- recent OTC trades;
- regional/province metrics for the China map;
- supervisory alerts.

The projection API should hide registry-table complexity and preserve the option to move to materialized views or scheduled projection updates later.

## Review Checkpoints

DeepSeek should review:

- whether the dependency boundary misses a required Nest provider;
- whether the regional module imports too much of `SharedModule`;
- whether serial-number behavior is preserved.

Gemini should review:

- whether the subsystem is still accurately framed as registry plus OTC settlement;
- whether trade-price metadata is clearly separated from regulated credit transfer;
- whether dashboard projection avoids turning the ledger into a reporting query surface.
