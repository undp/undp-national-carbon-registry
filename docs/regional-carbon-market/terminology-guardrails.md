# Regional Carbon Market Terminology Guardrails

This document is the terminology guardrail for reasoning about the extracted
regional carbon market subsystem. It combines:

- `全国温室气体自愿减排交易系统用户手册.pdf` in the repository root.
- The extracted subsystem artifacts under `docs/regional-carbon-market/`,
  `scripts/`, `backend/services/libs/shared/src/regional-market/`, and
  `web/src/Pages/CommandCenter/`.

Use the official manual terms when discussing national CCER trading concepts.
Use the project terms when discussing this repository's extracted regional PoC.
Do not infer exchange, clearing, or regulatory-warning functionality unless it
exists in code or a later design document explicitly adds it.

## Source Priority

1. Official user manual terminology for national trading-system concepts.
2. Project implementation and tests for what this extracted subsystem actually
   does.
3. Project docs and review notes for agreed boundaries and roadmap items.
4. General carbon-market knowledge only when it does not conflict with the
   above.

## System Boundary Terms

| Term | Project Meaning | Guardrail |
| --- | --- | --- |
| 全国温室气体自愿减排交易系统 / 交易系统 | Official national voluntary GHG emission reduction trading system from the user manual. | Do not treat this repository as a full clone of the official trading system. |
| 全国温室气体自愿减排注册登记系统 / 注册登记系统 | Official registry system used to record CCER registration, holding, change, and cancellation information. | In this repo, registry behavior is represented by existing project, credit-block, and credit-transaction services/entities. |
| 区域碳市场子系统 | Extracted subsystem in this branch: regional carbon asset registry plus OTC settlement PoC. | It is a PoC, not a production exchange. |
| Registry / 登记簿 | Source of truth for carbon-credit lifecycle and ownership. | Registry transfer is separate from market-price metadata. |
| OTC Settlement / 场外交易结算 | Bilateral trade metadata plus registry transfer, with offline cash settlement. | Do not call it an order book, matching engine, or clearing engine. |
| 数字碳管理平台案例 / 202605 建设思路 | Reference PDF showing carbon management dashboards, asset ledgers, market-price trends, trade-record maintenance, budget workflows, and assisted trading strategy. | Supports a management cockpit / record-maintenance / decision-support interpretation; does not prove implemented order books, matching, platform clearing, bank settlement, or production trading-account holdings. |
| Continuous Exchange / 连续竞价交易所 | A system with order book, matching, cash accounts, freezing, fees, clearing, and market data. | Explicitly out of scope for the current PoC. |
| Trading client / 交易系统客户端 | Official manual's desktop client used by trading participants. | The repo's `/command-center` is a dashboard, not the official desktop client. |

## Account And Participant Terms

| Term | Meaning | Project Mapping |
| --- | --- | --- |
| 交易主体 | Legal person or organization that has opened an account in the official trading system. | Closest project concept: `Company` / organization account holder. |
| 交易账户 | Account opened in the official trading system to trade CCER. | Do not equate directly with registry holdings. In this project, account counts come from `Company`. |
| 登记账户 / CCER 账户 | Account opened in the registry system to record CCER registration, holding, change, and cancellation. | Closest project concept: registry-side holdings represented by credit blocks and transactions. |
| 联合开户 | Official flow where trading account and registry account are bound automatically. | Not implemented in the extracted dashboard flow. |
| 单独开户 | Official flow where registry account binding is performed separately. | Not implemented in the extracted dashboard flow. |
| 操作员 | User under a trading participant with configured account operation permissions. | Closest project concept: `User`; do not assume the official 5-operator limit is enforced here. |
| 交易代表 | Contact/representative information used by the official trading system. | Not part of the extracted regional dashboard logic. |
| 交易机构 | Beijing Green Exchange in the official manual. | Do not map this to a local service unless the code explicitly models it. |
| 北京登记结算 | Official settlement channel/company in the manual. | Not implemented as a live settlement integration in this PoC. |

## Project Role Terms

| Term | Meaning In This Repo | Guardrail |
| --- | --- | --- |
| `CompanyRole` | Organization role enum in the existing backend. | Use code enum values when implementing logic. |
| `PD` / Project Developer / 项目业主 | Project owner/developer. | In smoke data, 10 of 15 accounts are project developers. |
| `IC` / Independent Certifier / 独立核证机构 | Independent verifier/certifier. | In smoke data, 4 of 15 accounts are independent certifiers. |
| `DNA` / Designated National Authority / 指定国家主管机构 | Regulatory/national authority role. | In smoke data, 1 of 15 accounts is a regional authority. |
| 市场参与主体 | Dashboard account category label. | Aggregate account-holder count, not proof of a full compliance-market participant module. |
| 地方主管机构 | Dashboard account category label. | DNA/Ministry-style account count, not proof of local compliance workflows. |
| 核证机构 | Dashboard account category label. | Independent certifier count; do not infer a separate trading-member model unless added. |

## CCER And Asset Terms

| Term | Meaning | Project Mapping |
| --- | --- | --- |
| CCER | China Certified Emission Reduction / 核证自愿减排量. | The project's generic `credit` / issued credit quantities are used as the dashboard carbon-credit unit. |
| 核证自愿减排量 | Official manual's tradable voluntary reduction asset. | In UI, displayed as tons (`吨`) of emission reduction. |
| 标的物 | Tradable subject/instrument in the official trading client. | Closest dashboard concept: project/credit asset rows and OTC trade rows. Current PoC does not implement official instrument listing. |
| 标的物维护 | Official operation where the first transfer-in participant maintains and lists the tradable subject. | Not implemented in the extracted dashboard flow. |
| 上市 | Official process for a tradable subject becoming visible in market quotes on T+1. | Not implemented in the extracted dashboard flow. |
| CCER 转入 | Official flow initiated from the registry system, then transferred to trading account/platform. | Not implemented as UI/API flow in this extracted dashboard. |
| CCER 转出 | Official flow from trading system back to bound registry account. | Not implemented as UI/API flow in this extracted dashboard. |
| 持仓 | Holdings in the trading account. | In this repo, use credit-block balances or company/project balances depending on context; avoid using it loosely. |
| 可转数量 | Quantity eligible for CCER transfer-out in official client. | Not currently modeled by dashboard projection. |

## Project And Credit Lifecycle Terms

| Term | Meaning In This Repo | Guardrail |
| --- | --- | --- |
| `ProjectEntity` / 项目 | Registered emission-reduction project record. | Dashboard project rows come from project projection, not trading instruments. |
| `refId` | Project business reference ID, such as `SMOKE-PRJ-1`. | Used to connect project, issuance, trade, and retirement data in smoke flows. |
| `serialNumber` / 序列号 | Traceable credit serial number. | Must be produced/preserved through existing serial-number services; do not synthesize ad hoc serial formats. |
| `projectProposalStage` | Project approval/registration stage. | Projection treats `AUTHORISED` and `AUTHORIZED` as active/registered. |
| `creditEst` | Estimated credits for a project. | Do not use as issued credits. |
| `creditIssued` | Issued credits for a project. | Dashboard `totalIssuedCredits` aggregates this, with transaction fallback where implemented. |
| `creditBalance` | Remaining credit balance. | Not identical to issued credits or holdings in every context. |
| `creditTransferred` | Credits already transferred. | Do not confuse with OTC trade volume unless the projection explicitly uses trade records. |
| `creditRetired` | Retired/cancelled credits. | Current UI does not directly display `retiredCredits`; API projection and smoke tests verify it. |
| `CreditBlocksEntity` / credit block / 登记簿减排量批次 | Traceable registry credit lot for balances, serial tracking, transfers, and retirement. | This is an implementation abstraction for a serialized CCER holding unit, not an official SOT term by itself. Ownership and serial integrity depend on credit-block behavior. |
| `CreditTransactionsEntity` | Registry-side credit lifecycle transaction record. | Used for issuance and retirement traces in smoke flows. |
| `Issued` / 签发 | Creation/issuance of credits after project/verification readiness. | Smoke flow inserts 10 completed issuance transactions and sets project `creditIssued`. |
| `Transfer` / 转让 | Registry ownership transfer. | Separate from OTC price metadata. |
| `Retired` / 退休 / 注销 | Credit removed from circulation after use/cancellation. | Only `Completed` retirements count in `retiredCredits`. |
| `Pending` retirement | Retirement request not completed. | Must not affect completed retirement aggregates. |
| `Completed` | Completed registry transaction status. | Required for completed issuance/retirement counting. |

## SOT-To-Implementation Mapping Notes

The implementation is terminology-driven, but code entities do not always use
the exact official SOT wording. Some entities are engineering abstractions that
carry a combination of SOT concepts. When adding or reviewing a model, map the
official term to the implementation role first, then decide whether a new
domain entity is required.

### Issuance And CCER

| SOT Term | Current Implementation | Relationship | Design Rationale |
| --- | --- | --- | --- |
| 签发 | `ProjectEntity.creditIssued` | Direct dashboard aggregate for lifecycle issued credits. | The dashboard needs cumulative issued amount, not current balance. The project table already has a stable cumulative field for read-model aggregation. |
| 核证自愿减排量 / CCER | `CreditBlocksEntity.creditAmount`, project credit quantities, UI unit `吨` | Partial implementation mapping. | SOT defines the asset concept; the repo stores it as issued quantities and traceable credit lots. Do not treat a generic `credit` number as a full official CCER account position. |
| 减排量序列号 / 编号 | `CreditBlocksEntity.serialNumber` | Direct traceability mapping. | Serial preservation is needed to trace source project and lifecycle movement. Do not synthesize ad hoc serial formats in dashboard code. |
| 签发流水 / 生命周期事件 | `CreditTransactionsEntity.type = Issued`, `status = Completed` | Event/audit mapping. | The transaction record explains when the lifecycle event happened and whether it is final. It is useful as an audit source and fallback, while `ProjectEntity.creditIssued` remains the dashboard aggregate source. |
| 项目登记状态 | `ProjectEntity.projectProposalStage = AUTHORISED / AUTHORIZED` | State-filter mapping. | SOT registration language should not include drafts or in-review projects. Dashboard project rows and counts must filter to registered/authorized states. |

### Holding, Change, And Retirement

| SOT Term | Current Implementation | Relationship | Design Rationale |
| --- | --- | --- | --- |
| 持有 / 持有数量 | `CreditBlocksEntity.ownerCompanyId`, `creditAmount`, `serialNumber` | Implementation abstraction: registry credit lot / holding unit. | SOT talks about holdings and ownership state; the code needs a concrete lot-level object to preserve quantity, current holder, source project, and serial traceability. |
| 权属变更 / 持有量变更 | `CreditTransactionsEntity.type = Transfer`, `senderId`, `receiverId`, `amount`, `status` | Lifecycle-event mapping. | Ownership change must be represented on the registry side. `MarketTradeExecutionEntity` is only OTC price/trade metadata and must not be treated as the ownership-transfer source of truth. |
| 注销 / 抵销注销 | `CreditTransactionsEntity` retirement records and `CreditBlockRetirementsViewEntity` | Final-state and read-model mapping. | Dashboard retirement metrics count only completed lifecycle events. Pending, rejected, or cancelled requests must not affect retired-credit aggregates. |
| 已完成注销 | `CreditTransactionStatusEnum.Completed` in retirement projection/view | Direct status mapping. | Completed status is the minimum finality filter for dashboard `retiredCredits`. |
| 当前余额 / 可用余额 | Credit-block state plus dashboard projection formula such as `issued + bought - sold - retired` | Derived read-model mapping. | The dashboard balance is derived from registry and executed-trade facts. It is not itself a ledger source of truth. |

### Why `CreditBlocksEntity` Is Not Renamed To A SOT Term

`CreditBlocksEntity` is not an official SOT term. It is the current codebase's
asset-lot abstraction for a serialized holding unit:

```text
issued CCER quantity
+ source project
+ serial number
+ current holder
+ transfer/retirement traceability
= registry credit lot / 登记簿减排量批次
```

Using a generic name such as `CCEREntity` would be less precise because one SOT
asset concept can be issued, split, transferred, partially retired, and traced
by serial number. The implementation needs a lot/holding unit, not just an
abstract asset type. For business-facing documentation, prefer `登记簿减排量批次`
or `持有量单元`; for code references, keep `CreditBlocksEntity` unless a
dedicated migration and compatibility plan is approved.

### Continuous Improvement Rule

For every new entity or projection field, add a mapping entry that states:

1. the SOT term it implements or approximates;
2. whether the mapping is direct, partial, derived, or not implemented;
3. the finality/status filter required for dashboard use;
4. whether the field is source-of-truth data or a read-model projection;
5. which official capability must not be inferred from it.

## Official Market Data Terms

These terms come from the official trading-client manual. They are useful for
future marketplace work but are mostly out of scope for the current dashboard
projection.

| Term | Meaning | Current Project Status |
| --- | --- | --- |
| 行情展示 | Market quote display for all tradable subjects. | Dashboard has static/demo market chart, not official market quote system. |
| 申报大厅 | Hall showing current listed-agreement quotes and orders, allowing delisting/taking action. | Not implemented. |
| 最新 | Latest traded price of a tradable subject. | Not implemented as official quote field. |
| 买价 / 卖价 | Current best bid / ask. | Not implemented. |
| 买量 / 卖量 | Quantity at current best bid / ask. | Not implemented. |
| 分时走势 | Intraday or multi-day time-series quote chart. | Dashboard chart is static/demo. |
| 浮动行情 | Hover/click quote overlay showing latest price, volume, value. | Not implemented. |
| 基本资料 | Basic information for a tradable subject. | Not implemented as official trading-client screen. |
| 盘口 | Order-book style depth display, including five bid/ask levels and quote stats. | Not implemented. |
| 买五档 / 卖五档 | Five-level bid/ask depth. | Not implemented. |
| 委比 | `(委托买入数量 - 委托卖出数量) / (委托买入数量 + 委托卖出数量) * 100%`. | Not implemented. |
| 委差 | `委托买入数量 - 委托卖出数量`. | Not implemented. |
| 分笔成交 | Tick-by-tick trades with time, price, and quantity. | Not implemented; dashboard has recent OTC trades only. |
| 分价表 | Aggregation by price level: quantity, count, value, ratio. | Not implemented. |
| 涨停 / 跌停 | Daily price limits. Official manual states listed-agreement price movement is ±10% of daily base price. | Not implemented. |

## Official Listed-Agreement Trading Terms

| Term | Official Meaning | Current Project Mapping |
| --- | --- | --- |
| 挂牌协议交易 | Participant submits buy/sell declaration with asset, quantity, and price; counterparty takes listed order by price priority, then time priority for same price. | Current project has `MarketTradeExecutionEntity` for executed OTC metadata, not a live listed-agreement order book. |
| 挂牌买入 / 挂牌卖出 | Submit listed buy/sell order. | Not implemented. |
| 委托 | Buy/sell order declaration. | Do not map to `MarketTradeExecutionEntity`; that entity stores executed trade metadata. |
| 摘牌 | Counterparty takes a listed declaration and completes a trade. | Not implemented. |
| 应价方 | Party taking the listed declaration. | Not modeled. |
| 挂牌撤销 / 撤单 | Cancel unfilled listed order; filled orders cannot be cancelled, partially filled orders can cancel unfilled remainder. | Not implemented. |
| 部分成交 | Order partially filled. | Not implemented. |
| 闭市自动撤单 | Unfilled orders are automatically cancelled after market close. | Not implemented. |
| 成交记录 | Official listed-agreement execution records. | Dashboard recent trades are OTC execution records, not official order-book trade records. |
| 交易时间 | Official manual says listed-agreement trading is 9:30-11:30 and 13:00-15:00. | Current PoC smoke tests do not enforce trading hours. |

## Funds, Fees, And Invoice Terms

The official client includes funds and invoice workflows. The extracted
subsystem currently does not implement these production workflows.

| Term | Official Meaning | Guardrail |
| --- | --- | --- |
| 资金管理 | Bank account binding, deposit, withdrawal, and fee payment. | Out of scope for current PoC. |
| 银行账户绑定 | Bind one same-name bank account to one trading account. | Not implemented. |
| 结算渠道 | Official settlement channel, e.g. 北京登记结算. | Do not infer live integration. |
| 入金 | Deposit funds into trading account. | Not implemented. |
| 出金 | Withdraw available funds to bound bank account. | Not implemented. |
| 可出资金 | Funds available for withdrawal. | Not implemented. |
| 支付密码 | Password used for official online banking deposit/withdrawal operations. | Not implemented. |
| 缴费 | Pay account opening fee or annual fee. | Not implemented. |
| 交易手续费 | Fee paid by buyer and seller to the trading institution based on transaction value. | Current PoC does not compute or collect trading fees. |
| 开户费 / 年费 | Official account opening and annual fees. | Not implemented. |
| 开票 | Apply for invoices for transaction fees, account opening fees, and annual fees. | Not implemented. |
| 发票抬头 | Invoice title information. | Not implemented. |
| 成交明细开票申请 | Invoice request based on trade details. | Not implemented. |
| 缴费明细开票申请 | Invoice request based on fee payment details. | Not implemented. |

## Query And User-Management Terms

| Term | Official Meaning | Current Project Status |
| --- | --- | --- |
| 数据查询 | Official query center for trades, funds, CCER holdings, fees, and annual fee payments. | Project has API smoke queries and dashboard projection, not the full official query center. |
| 挂牌协议查询 | Query listed-agreement orders and executions. | Not implemented. |
| 资金查询 | Query fund balance changes, deposit/withdrawal flows, fund transaction flows, settlement-channel results. | Not implemented. |
| CCER 查询 | Query holdings, transfer-in/out flows, and transaction flows. | Partially analogous to credit balance/transfer/retirement services, but not the official screen. |
| 交易手续费查询 | Query fee details and summaries. | Not implemented. |
| 年费缴费查询 | Query account opening/annual fee payment and annual fee expiry. | Not implemented. |
| 用户信息管理 | Modify passwords, view account basic information, modify representative information. | Existing repo has user/company services, but this official client module is not implemented in the extracted dashboard. |
| 操作员管理 | Add/modify/freeze/unfreeze operators and configure permissions. | Existing repo has users/roles; official operator-management flow is not part of this dashboard PoC. |
| 信息中心 / 消息中心 | View announcements, notices, information, and messages. | Not implemented in extracted dashboard. |

## Dashboard Projection Terms

| Term | Meaning In This Repo | Guardrail |
| --- | --- | --- |
| `RegionalMarketProjectionService` | Backend service that converts registry/trade/account tables into dashboard-shaped read data. | This is a read model, not the ledger source of truth. |
| `/regional/dashboard/summary` | Main dashboard projection API. | Frontend should depend on this shape, not raw ledger tables. |
| `dataStatus` | Overall dashboard data status. | `real` only when all required sections are real; `fallback` means demo data should be used. |
| `projectionAvailable` | Whether projection is available. | Do not mix partial real metrics with demo tables when false. |
| `projectionErrors` | Projection error list. | Used for diagnostics, not user-facing regulatory alerts. |
| `sectionStatus` | Per-section real/fallback status. Current sections: `projects`, `issuance`, `trades`, `retirements`, `accounts`. | Add a section here when adding a new projection dependency. |
| `accountSummary` | Account-holder aggregate shown in the dashboard account panel. | Based on `Company` role/state data. |
| `metrics.totalIssuedCredits` | Total issued credits. | Do not use `creditEst`. |
| `metrics.activeProjectCount` | Count of active/registered projects. | Currently based on authorised/authorized project stages. |
| `metrics.transferVolume` | OTC executed volume shown as transaction quantity. | Based on executed OTC records in current projection. |
| `metrics.retiredCredits` | Completed retired credits. | API-level metric; current dashboard UI does not directly render it. |
| `metrics.averageOtcPrice` | Weighted average OTC price. | Compute as `SUM(totalPrice) / SUM(amount)`, not average of unit prices. |
| `metrics.otcTradeCount` | Count of OTC execution rows. | Not an order count. |
| `metrics.otcTradeValue` | Total OTC execution value. | Used by dashboard daily trade amount. |
| `recentProjectRegistrations` | Recent registered project rows for the project table. | Query only `AUTHORISED` / `AUTHORIZED` projects; current smoke expects 10 most recent registered rows when 15 are seeded. |
| `recentTrades` | Recent OTC execution rows for the history table. | Not official tick-by-tick exchange trades. |
| `supervisoryAlerts` | Placeholder/projection field for supervisory alerts. | No business logic currently; dashboard text remains static. |
| `regionalMetrics` | City-level dashboard read model for account, project, issued-credit, OTC buy/sell, retirement, balance, and demo governance-score fields. | Treat it as derived projection data, not the ledger or official city performance score. |
| `singleCountTradeVolume` | Frontend helper for regional snapshot trade volume. | Count executed OTC volume once at the regional level by using the larger of summed buy-side and sell-side volume; do not add both sides together. |

## Market Trade Execution Terms

| Term | Meaning In This Repo | Guardrail |
| --- | --- | --- |
| `MarketTradeExecutionEntity` | Stores executed OTC trade metadata. | It is not the registry transfer itself and not an order book order. |
| `creditTransactionId` | Identifier linking or representing the associated credit transaction. | Preserve deterministic IDs in smoke tests. |
| `creditBlockId` | Credit block involved in the trade. | Must remain traceable to registry credit blocks. |
| `sellerCompanyId` / `buyerCompanyId` | Seller/buyer organization IDs. | Must refer to existing account-holder concepts. |
| `amount` | Quantity of credits traded. | Dashboard volume sums this field. |
| `unitPrice` | Price per credit/ton. | Do not use simple average for aggregate price. |
| `totalPrice` | Total trade value. | Dashboard trade value sums this field. |
| `currency` | Currency code, e.g. `CNY`. | Current smoke data uses `CNY`. |
| `tradeTime` | Execution timestamp. | Used for recent trade ordering. |
| `settlementStatus` | OTC metadata settlement status. | Current PoC uses offline settlement statuses. |
| `SETTLED_OFFLINE` | Trade/transfer is treated as settled with cash handled offline. | Dashboard trade summary, recent trade rows, and regional buy/sell metrics count only this status. It does not prove bank/payment integration. |
| `RECONCILIATION_REQUIRED` | Registry transfer succeeded but OTC metadata recording needs reconciliation. | Use when metadata persistence fails after registry action. |

## Demo And Test Terms

| Term | Meaning | Guardrail |
| --- | --- | --- |
| `SMOKE-*` | Deterministic smoke-test row prefix. | Safe to reset/remove by smoke scripts. |
| `seed-dashboard-accounts` | Inserts 15 active account holders. | Expected split: 10 PD, 4 IC, 1 DNA. |
| `seed-dashboard-project` | Inserts 15 authorised/authorized project rows. | Expected active project count: 15. |
| `seed-dashboard-issuance` | Sets issued credits and inserts 10 completed issuance traces. | Expected total issued credits on clean DB: 15000. |
| `seed-dashboard-trade` | Inserts 15 OTC trades, 300 credits each at unit price 42. | Expected volume: 4500, value: 189000, average price: 42. |
| `seed-dashboard-retirement` | Inserts 10 buyer-side completed retirements, 150 each. | Expected completed retirement total: 1500. |
| `seed-dashboard-pending-retirement` | Inserts 10 pending retirements, 50 each. | Must not change completed retirement total. |
| `dashboard-flow-smoke` | API staged empty-to-full projection verification. | Use for backend projection regression. |
| `dashboard-demo-smoke` | Final full-demo projection verification. | Use after complete seed. |
| self-contained dashboard fixture | Static fixture under `web/public/regional/dashboard/summary`, generated from the same 50-step story. | It may demonstrate the business/data flow without Postgres or Nest; it must not introduce a different trading causality or claim official trading-system capabilities. |
| Playwright UI E2E | Real Chromium test of `/command-center`. | Validates UI rendering/interaction, not all backend edge cases. |
| omarchy | Remote isolated test environment used to avoid local watcher/Warp risk. | Prefer for heavy API/UI E2E. |
| `node dist/main.js` | Non-watcher backend startup used in tests. | Prefer over `yarn start:dev` for E2E. |
| `yarn preview` | Built frontend preview server. | Prefer over `yarn dev` for E2E. |

## Reasoning Guardrails

### Must Say

- The extracted subsystem is a regional registry plus OTC settlement PoC.
- Registry transfer and OTC price metadata are separate concerns.
- Cash settlement is offline in the current PoC.
- Dashboard projection is a read model over existing registry/account/trade data.
- The command-center dashboard can progress from empty data to populated real
  projection data via seeded business records.
- Self-contained or static-fixture previews consume the same 50-step story and
  terminology boundaries as the full-stack branch.
- Regulatory warning text, map markers, regional metrics, and footer details are
  static or placeholder unless later work implements their logic.

### Must Not Say

- Do not say the current project implements the full national trading client.
- Do not say it implements continuous trading, order matching, order book,
  clearing, bank settlement, fee collection, invoice workflows, or official
  operator management.
- Do not equate `MarketTradeExecutionEntity` with registry ownership transfer.
- Do not treat `creditEst` as issued credits.
- Do not count pending retirements as retired credits.
- Do not present dashboard `recentTrades` as official exchange tick data.
- Do not add self-contained demo wording that claims official trading accounts,
  order matching, product listing, clearing, bank settlement, CCER transfer to
  trading platform, or exchange account holdings.
- Do not infer supervisory alert logic from static UI text.
- Do not infer dynamic map/regional metrics from static demo markers.

## Naming And Translation Rules

| Prefer | Avoid | Reason |
| --- | --- | --- |
| 核证自愿减排量 / CCER | carbon allowance | CCER is voluntary reduction, not compliance allowance. |
| 交易主体 | trader user | Official term is participant organization, not just a login user. |
| 交易账户 | registry account | Official manual distinguishes trading account and registry account. |
| 登记账户 / CCER 账户 | trading account | Registry-side account records holding/change/cancellation. |
| 挂牌协议交易 | OTC trade | Official listed-agreement trading has order/taking semantics; current project OTC is simpler metadata. |
| 场外交易 / OTC execution | 挂牌协议委托 | Current `MarketTradeExecutionEntity` is executed OTC metadata, not live listed order. |
| 退休 / 注销 | deletion | Carbon-credit retirement is a lifecycle event, not a database delete. |
| 投影 / read model | source of truth | Dashboard projection is derived data. |

## Current Implementation Coverage Matrix

| Domain | Covered Now | Not Covered Now |
| --- | --- | --- |
| Account holders | `Company` role/status projection into dashboard account summary. | Official trading-account opening, registry-account binding workflows. |
| Projects | Registered/authorised project rows and recent project table. | Full official project document workflow in dashboard UI. |
| Issuance | Issued-credit totals and issuance traces in smoke tests. | Full verification/certificate UI workflow. |
| OTC trades | Executed OTC metadata, volume, value, weighted average price, recent trades. | Listed-agreement order book, bid/ask, delisting/taking, cancellation, price limits. |
| Retirements | Completed retirement aggregate in API projection; pending excluded. | UI display of retired-credit metric; official retirement workflow UI. |
| Funds | Offline cash-settlement status only. | Bank account binding, deposit, withdrawal, fee payment, clearing. |
| Fees/invoices | Not covered. | Trading fees, annual fees, invoice application, invoice status. |
| Market data | Static/demo chart and map. | Official quote screen, order depth, tick trades, price-level table. |
| Supervision | Static dashboard prompt text. | Dynamic regulatory warning rules. |
| E2E testing | Omarchy isolated API/UI E2E with Playwright. | Production-like multi-user trading/concurrency tests. |
