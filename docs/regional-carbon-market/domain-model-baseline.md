# Phase Zero Demo Domain Model Baseline

Status: Phase 0 implementation gate baseline  
Applies to: `/regional/demo/...` APIs and phase-zero regional carbon demo  
Authoritative inputs:

- `docs/plans/2026-06-17-phase-zero-demo-revised-design-baseline.md`
- `docs/regional-carbon-market/terminology-guardrails.md`
- `/Users/cy/carbon/undp-national-carbon-registry/documention/demo-assertions-revised-baseline.md`

## 1. Boundary

The phase-zero demo is a controlled value demonstration. It is not a production
exchange, official registry, bank system, clearing system, or legal contract
platform.

The model separates:

- S12 public regional indicators, which can be real public data only when
  source-labelled and verified.
- S8 and S10 operating signals, which are seeded or simulated demo state.
- Registry-side demo holdings from trading-side demo holdings.
- Demonstration document previews from legally effective documents.

## 2. Truth Status

| Status | Meaning | Allowed Use |
| --- | --- | --- |
| `REAL_PUBLIC_DATA` | Public data with source, year, caliber, methodology, and verification state. | S12 indicators only. |
| `SEEDED_DEMO_DATA` | Fictional organizations, users, accounts, and initial holdings. | Golden demo accounts and assets. |
| `SIMULATED_OPERATIONAL_SIGNAL` | State-machine output created during demo interaction. | S8/S10 events and supervision return metrics. |
| `INTERNAL_ASSESSMENT` | Demo-only analytical or warning-like assessment. | Must be labelled `内部研判` or `内部研判指标`. |

Every API DTO that mixes sections from more than one layer must expose
`truthStatus` or an equivalent field.

## 3. Core Entities

| Entity | Purpose | Truth Status | SOT Mapping | Forbidden Inference |
| --- | --- | --- | --- | --- |
| `DemoRegionIndicator` | S12 public indicator with source metadata. | `REAL_PUBLIC_DATA` when `verified=true`; otherwise hidden or downgraded. | Public macro/regional statistics. | Does not create an official government warning. |
| `DemoOrganization` | Fictional party for the demo. | `SEEDED_DEMO_DATA` | Participant-like organization. | Not a real account-opening record. |
| `DemoUser` | Golden demo user for role access. | `SEEDED_DEMO_DATA` | User/operator concept. | Does not implement official operator management. |
| `RegistryAccount` | Demo registry-side account. | `SEEDED_DEMO_DATA` | Registry account concept for holding/change semantics. | Not an official registry account. |
| `RegistryHolding` | Demo holding lot with source, quantity, and status. | `SEEDED_DEMO_DATA` or derived from demo actions. | Holding/lot semantics. | Not official account balance. |
| `TradingAccount` | Demo trading-context account. | `SEEDED_DEMO_DATA` | Trading account concept. | Not production exchange membership. |
| `TransferToTradingAccount` | Simulated transfer from registry context to trading context. | `SIMULATED_OPERATIONAL_SIGNAL` | Transfer-in boundary pattern. | Not official CCER transfer to a national platform. |
| `TradingInstrument` | Demo tradable subject wrapper after transfer-in. | `SIMULATED_OPERATIONAL_SIGNAL` | Trading subject/listed subject concept. | Not production listing or order book instrument. |
| `TradingAccountHolding` | Demo quantity available in the trading context. | `SIMULATED_OPERATIONAL_SIGNAL` | Trading holding concept. | Not a real trading-account position. |
| `Listing` | Demo agreement-transfer offer. | `SIMULATED_OPERATIONAL_SIGNAL` | Listed-agreement workflow approximation. | Not continuous auction, matching, or five-level market depth. |
| `TradeDeal` | Confirmed demo deal record. | `SIMULATED_OPERATIONAL_SIGNAL` | Trade result metadata. | Not official exchange tick data. |
| `DemoContractPreview` | Non-legal contract preview. | `SIMULATED_OPERATIONAL_SIGNAL` | Demo document artifact. | Not a legally effective electronic contract. |
| `ClearingResult` | Simulated delivery/status result. | `SIMULATED_OPERATIONAL_SIGNAL` | Delivery/status display. | Not bank clearing or official clearing. |
| `RegistryHoldingChange` | Demo audit-style record for holding impact. | `SIMULATED_OPERATIONAL_SIGNAL` | Holding change trace. | Not official registry final bookkeeping. |
| `FinanceApplication` | Financing intent application. | `SIMULATED_OPERATIONAL_SIGNAL` | Financing-intent workflow. | Not a bank loan application of record or disbursement. |
| `PledgeLock` | Demo pledge/freeze state. | `SIMULATED_OPERATIONAL_SIGNAL` | Pledge/freeze concept. | Not real pledge registration or security interest creation. |
| `DemoEsgAssessment` | Internal ESG demo-v1 assessment. | `INTERNAL_ASSESSMENT` | Internal model output. | Not official ESG or regulator rating. |
| `DemoAuditLog` | Demo action log for replay confidence. | Derived from demo actions. | Audit trail concept. | Not a statutory audit record. |

## 4. Status Enums

### Holding State

```text
REGISTRY_AVAILABLE
TRANSFER_REQUESTED
TRANSFERRED_TO_TRADING
LISTED
DEAL_CONFIRMED
DELIVERY_RECORDED
PLEDGE_LOCKED
PLEDGE_RELEASED
```

### Listing State

```text
DRAFT
ACTIVE
PICKED
CANCELLED
EXPIRED
```

### Deal State

```text
CONFIRMED
DOCUMENTS_GENERATED
DELIVERY_RECORDED
```

### Finance State

```text
DRAFT
SUBMITTED
SIMULATED_APPROVED
SIMULATED_REJECTED
PLEDGE_LOCKED
WITHDRAWN
```

## 5. Required Transition Rules

- A listing requires a prior `TRANSFERRED_TO_TRADING` holding.
- A listing quantity must not exceed available demo trading quantity.
- A deal requires an active listing and available quantity.
- `DemoContractPreview` and simulated status certificate are created or queued
  by deal confirmation.
- A pledge lock requires a selected demo asset or demo holding.
- A financing review result must use simulated approval/rejection language.
- Retirement or cancellation inside the trading context is out of scope for
  phase zero.

## 6. Reuse Boundary

Existing regional-market code remains the projection/supporting-screen base:

- `RegionalMarketProjectionService` is a read model over existing registry,
  account, project, trade, and retirement facts. It is not the ledger source of
  truth.
- `MarketTradeExecutionService` stores executed OTC metadata. It is not an
  order book, matching engine, registry transfer, or clearing engine.
- `regional-market.module.ts` should register new demo services/controllers
  under `/regional/demo/...` without changing the existing dashboard projection
  contract unless a specific migration is planned.

## 7. Reset Boundary

`POST /regional/demo/reset` must restore:

- golden users and role mappings;
- verified S12 indicator records;
- fictional demo organizations;
- initial registry holdings and trading accounts;
- empty or initial S8/S10 state-machine records;
- initial supervision return counters.

It must not delete verified public source catalog entries.
