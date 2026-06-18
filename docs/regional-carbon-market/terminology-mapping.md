# Phase Zero Demo Terminology Mapping

Status: Phase 0 baseline

## 1. Source Priority

1. Revised assertion baseline.
2. Revised design baseline.
3. `docs/regional-carbon-market/terminology-guardrails.md`.
4. Existing implementation and tests.
5. General carbon-market knowledge only when it does not conflict.

## 2. Mapping Table

| Demo Term | Implementation Concept | SOT Relationship | Truth Layer | Must Not Infer |
| --- | --- | --- | --- | --- |
| `DemoRegionIndicator` | New demo indicator entity/API row. | Public statistical indicator. | Real public data when verified. | Official warning or official assessment. |
| `RegistryAccount` | New demo account context. | Registry account semantics. | Seeded demo data. | Official registry account opening. |
| `RegistryHolding` | New demo holding lot. | Holding/ownership semantics. | Seeded or simulated. | Official registry final balance. |
| `TradingAccount` | New demo trading context. | Trading account semantics. | Seeded demo data. | Production exchange account. |
| `TransferToTradingAccount` | New demo transfer-in record. | Transfer-in boundary approximation. | Simulated operational signal. | National platform CCER transfer. |
| `TradingInstrument` | Demo tradable wrapper. | Tradable subject approximation. | Simulated operational signal. | Production listing or market quote instrument. |
| `Listing` | Demo agreement-transfer offer. | Listed-agreement workflow approximation. | Simulated operational signal. | Order book, matching, five-level depth. |
| `TradeDeal` | Demo confirmed deal. | Executed trade metadata. | Simulated operational signal. | Official exchange trade tick. |
| `ClearingResult` | Demo delivery/status result. | Status display approximation. | Simulated operational signal. | Official clearing or bank clearing. |
| `FinanceApplication` | Financing-intent workflow. | Financing-intent concept. | Simulated operational signal. | Bank loan, disbursement, or binding credit approval. |
| `PledgeLock` | Demo lock/freeze state. | Pledge/freeze concept. | Simulated operational signal. | Real pledge registration or security interest. |
| `DemoEsgAssessment` | Internal demo-v1 score. | Internal model only. | Internal assessment. | Official ESG or regulator rating. |
| `CreditBlocksEntity` | Existing registry credit-lot implementation. | Partial holding-lot mapping. | Source/ledger implementation data. | A standalone SOT professional term. |
| `MarketTradeExecutionEntity` | Existing executed OTC metadata. | Trade metadata mapping. | Projection source for current dashboard. | Registry transfer, order, matching, or clearing. |
| `RegionalMarketProjectionService` | Existing dashboard read model. | Derived projection. | Read model. | Ledger source of truth. |

## 3. Boundary Statements

- Registry-side terms express ownership, holding, change, and retirement
  semantics.
- Trading-side terms express demo transfer-in, listing intent, and confirmed
  demonstration deal metadata.
- S8/S10 state changes can feed supervision return metrics only as simulated
  operational signals.
- A confirmed demo deal must not be described as causing official registry
  settlement. The safe wording is: demo transfer records and executed metadata
  are associated for display, while cash settlement is outside the demo.

## 4. Review Rule

When adding an entity, DTO field, seed value, or UI label, document:

1. the business term it represents;
2. whether the mapping is direct, partial, derived, simulated, or not
   implemented;
3. the truth layer;
4. the status/finality filter for dashboard use;
5. which official capability must not be inferred.
