# v2.mp4 Structured Business Extraction

## Source And Method

- Source file: `/Users/cy/carbon/undp-national-carbon-registry/v2.mp4`
- Duration: 676.5s, about 11m17s
- Resolution: 960x544
- Audio: effectively silent; `mean_volume=-91.0 dB`, `max_volume=-91.0 dB`; no useful speech transcription.
- Extraction method: sampled 135 frames at 1 frame per 5 seconds, generated a contact sheet, then manually inspected representative frames around trading, query, quota transfer, user management, report, and web portal sections.

## High-Level Identification

The recording mainly shows the `全国碳排放权交易系统` desktop trading client. Compared with `v1.mp4`, this second video covers a broader back-office and account-management surface, not just buy/sell order entry and market quotes.

The visible scope includes:

- exchange market quote and order-entry terminal,
-挂牌/挂单交易,
-大宗协议,
-单向竞价,
-资金查询 and fund flow query,
-配额转入/转出 between registry system and trading system,
-当日委托/成交 query,
-历史委托/成交 query,
-日终报表,
-用户信息 and operator security settings,
-上海环境能源交易所 public website and `交易意向信息发布平台` entry.

Important boundary: the video shows the public website banner and entry for `交易意向信息发布平台`, but it does not show a logged-in intent-publishing back-office form. Therefore, this report treats that part as a public portal/entry capability, not as confirmed CRUD workflow.

## Approximate Timeline

| Time | Observed UI State | Business Meaning |
| --- | --- | --- |
| 00:00-01:20 | Trading client, market quote panels, `卖出挂单` / order-entry form, CEA contracts. | User can inspect market data and submit sell-side orders against selected carbon allowance instruments. |
| 01:20-03:20 | `单向竞价` / agreement-style list pages, rows with session names, auction windows, quantities, prices, and status `已成交`. | Exchange supports auction/agreement sessions in addition to continuous order entry. |
| 03:20-04:40 | `综合查询` pages, including `资金查询`, bank/fund flow tabs, export buttons. | User can query trading fund accounts, available/frozen funds, and related流水. |
| 04:40-05:50 | `配额管理` pages, especially `转入/转出`; direction between registry system and trading system. | User can transfer allowances between registry-side holding and exchange-side trading account. |
| 05:50-07:20 | `当日查询`, `历史查询`; order/deal filters, status dropdowns, export. | User can audit current-day and historical委托/成交. |
| 07:20-08:40 | More query/detail dialogs, modal popups for transaction or session details. | Detail drill-down exists for exchange sessions and query rows. |
| 08:40-09:55 | `日终报表` and `用户信息管理`; report preview, operator password reset, contact information fields. | System supports end-of-day account reporting and account/security profile management. |
| 09:55-10:15 | Browser opens `上海环境能源交易所` public website at `www.cneeex.com`; banner shows `交易意向信息发布平台`. | Public portal exposes market/information services and an entry to trading-intent publication. |
| 10:15-10:35 | Website market section with `全国碳市场综合价格行情`, news center, quick links. | Public market disclosure and navigation service. |
| 10:35-11:17 | Returns to trading client;日终/用户信息管理 pages and About dialog. | Session ends in the desktop client. |

## Main Navigation And Pages

### Top Navigation

Visible top-level functions:

- `买入申报`
- `卖出申报`
- `撤销申报`
- `市场`
- `分时`
- `K线`
- `分笔`
- `F10`

Visible mode buttons on the top right:

- `行情`
- `交易`
- `行情+交易`
- `交易代码管理`
- `合约信息查询`

### Left Navigation

Visible module tree:

- `挂单交易`
- `大宗协议`
- `单向竞价`
- `综合查询`
- `配额管理`
- `当日查询`
- `历史查询`
- `日终报表`
- `用户信息管理`

Submenus observed:

- `综合查询`
  - `资金查询`
  -入金/出金 or bank-flow-style流水 tabs
- `配额管理`
  - `转入/转出`
  - `配额查询`
  - `可转持仓查询`
- `当日查询`
  - `当日委托查询`
  - `当日成交查询`
- `历史查询`
  - `历史委托查询`
  - `历史成交查询`
- `用户信息管理`
  - `修改登录密码`
  - `修改资金密码`
  - `用户基本信息`
  - `用户信息修改申请`

## Business Modules

### 1. Market And Instrument Quotation

Evidence:

- instruments such as `CEA`, `CEA21`, `CEA22`, `CEA23`, `CEA24`, `CEA25`;
- selected names such as `碳排放配额25` and `CEA 碳排放配额19-20`;
- K-line,分时,分笔, F10 info panes;
- price ladder and market metrics on the right.

Business meaning:

- A tradable carbon instrument is separate from a project or registry asset.
- The terminal needs a market-data read model with quotes, volume, turnover, and contract metadata.

Candidate entities:

```text
TradingInstrument
  code
  name
  productType
  complianceYear
  market
  tradableStatus
  priceTick
  quantityUnit

MarketQuoteSnapshot
  instrumentCode
  latestPrice
  previousClose
  openPrice
  highPrice
  lowPrice
  bidLevels[]
  askLevels[]
  volume
  turnover
  quoteTime
```

### 2. Order Entry /挂单交易

Evidence:

- buy/sell order forms show fields such as:
  - `标的物代码`
  - `标的物名称`
  - `账户类型`
  - `交易账号`
  - `委托价格`
  - `委托数量`
  -可用资金 / 可买数量 / 可卖数量
- quick proportion buttons are visible.

Business meaning:

- Order entry is not just a completed trade record.
- Buy-side and sell-side checks require fund/position availability and freezing.

Candidate entities:

```text
Order
  orderId
  tradingAccountId
  instrumentCode
  side: BUY | SELL
  orderType: LIMIT
  price
  quantity
  executedQuantity
  cancelledQuantity
  frozenCash
  frozenQuantity
  status
  submittedAt
  cancelledAt

Deal
  dealId
  orderId
  instrumentCode
  side
  price
  quantity
  amount
  counterpartyAccountId
  counterpartyName
  tradingFee
  settlementFee
  executedAt
```

Observed order states from dropdowns:

- `已申报`
- `部分成交`
- `已撤单`
- `已成交`
- `系统撤单`

Suggested order state machine:

```text
Draft
  -> Submitted
  -> PartiallyFilled
  -> Filled
  -> Cancelled
  -> SystemCancelled
  -> Rejected
```

Core validation rules:

- Buy order requires enough available cash.
- Sell order requires enough available allowance holding.
- Submitted unfilled quantity can be cancelled.
- Deal records are immutable after execution.
- Cancellation releases frozen cash or frozen holding.

### 3. 大宗协议 / 单向竞价

Evidence:

- `单向竞价` pages show tabs such as:
  -委托下单
  -协议列表
  -成交列表
  -当日委托查询
- table rows include:
  - session or场次名称,
  - auction/trading time windows such as `2025-05-22 10:00-10:30`, `2025-07-16 10:30-11:00`,
  -客户号,
  -标的物名称,
  - maximum trade quantity, e.g. `100,000吨`, `200,000吨`,
  - prices such as `¥80.43`, `¥48.72`, `¥44.33`,
  -成交价格模式,
  - status `已成交`.

Business meaning:

- Besides normal挂牌/挂单交易, the exchange supports scheduled sessions.
- Session metadata is a first-class object: time window, quantity cap, pricing mode, status, and participant actions.

Candidate entities:

```text
AgreementSession
  sessionId
  name
  instrumentCode
  tradingWindowStart
  tradingWindowEnd
  publisherAccountId
  maxQuantity
  price
  pricingMode
  status

AuctionSession
  sessionId
  instrumentCode
  bidWindowStart
  bidWindowEnd
  maxQuantity
  startingPrice
  pricingMode
  status

AuctionOrder
  auctionSessionId
  tradingAccountId
  side
  price
  quantity
  status
```

Suggested session states:

```text
Draft
  -> Published
  -> Open
  -> Closed
  -> Matched
  -> Settled
  -> Cancelled
```

### 4. Fund Account And Fund Flow Query

Evidence:

- `综合查询 > 资金查询` page.
- filters include `资金账号`.
- buttons include `查询`, `EXCEL导出`, `PDF导出`.
- table columns include:
  - `资金账号`
  - `账号类型`
  - `资金余额`
  - `可用资金`
  - `冻结资金`
- row shows account type `一般账号`, amounts like `¥0.00`.
- additional tabs show fund-flow-like pages, including inbound/outbound流水.

Business meaning:

- Trading account and fund account should not be collapsed into organization.
- Order validation depends on available cash and frozen cash.
- Query/export are part of operational audit, not just dashboard display.

Candidate entities:

```text
FundAccount
  fundAccountId
  tradingAccountId
  accountType
  balance
  availableCash
  frozenCash
  currency

FundFlow
  flowId
  fundAccountId
  direction: IN | OUT
  amount
  source
  status
  occurredAt
  externalBankReference
```

### 5. Quota / Allowance Transfer Management

Evidence:

- `配额管理 > 转入/转出` page.
- form fields include:
  - trading/account id such as `21030100434`,
  - `标的物代码`, e.g. `CEA25`,
  - `标的物名称`, e.g. `碳排放配额25`,
  - `划转方向`,
  - `划转数量`.
- direction radio options:
  - `登记系统->交易系统（转入）`
  - `交易系统->登记系统（转出）`
- note indicates a transfer window around trading hours.
- related query pages show fields such as transfer date/time, instrument code/name, transfer quantity, available quantity, buy/sell quantities, frozen quantity, and transaction number.

Business meaning:

- Registry holdings and exchange tradable holdings are separate ledgers.
- A market trade requires allowance to be moved into the trading system first.
- After trading, allowances can be moved back to the registry system.

Candidate entities:

```text
QuotaPosition
  tradingAccountId
  registryAccountId
  instrumentCode
  registryBalance
  exchangeTotalQuantity
  exchangeAvailableQuantity
  exchangeFrozenQuantity

QuotaTransferApplication
  transferId
  tradingAccountId
  registryAccountId
  instrumentCode
  direction: REGISTRY_TO_EXCHANGE | EXCHANGE_TO_REGISTRY
  quantity
  status
  submittedAt
  acceptedAt
  rejectedAt
  completedAt
```

Suggested transfer state machine:

```text
Draft
  -> Submitted
  -> Accepted
  -> Completed
  -> Rejected
  -> Cancelled
```

Core rules:

- Transfer-in increases exchange available position after completion.
- Transfer-out requires enough exchange available quantity.
- Pending transfer should freeze or reserve relevant quantity.
- Transfer window and trading-day calendar are validation inputs.

### 6. Current-Day And Historical Query

Evidence:

- `当日查询` page with:
  - `当日委托查询`
  - `当日成交查询`
- `历史查询` page with:
  - `历史委托查询`
  - `历史成交查询`
- filters include:
  - `标的物代码`
  - `买卖方向`
  - `委托状态`
  - date range
- buttons include:
  - `查询`
  - `清空`
  - `EXCEL导出`
  - `PDF导出`
- visible columns include:
  -委托编号,
  -委托日期,
  -委托时间,
  -操作员代码,
  -买卖方向,
  -标的物代码,
  -标的物名称,
  -委托价格,
  -委托数量,
  -成交数量,
  -成交金额,
  -结算手续费,
  -交易手续费,
  -交易账号.

Business meaning:

- Current-day and historical queries are separate operational read models.
- The platform must support regulatory/audit-grade export, not only UI listing.
- Fee and operator fields should be retained on order/deal history.

### 7. End-Of-Day Report

Evidence:

- `日终报表` page.
- filter includes customer number and trading date.
- report title resembles `全国碳排放权交易客户日终报表`.
- report fields include:
  -交易日期,
  -打印时间,
  -客户号,
  -客户名称,
  -交易账户,
  -配额登记账户,
  -期初资金余额,
  -可用资金,
  -买入金额,
  -买入手续费,
  -当日入金,
  -卖出金额,
  -卖出手续费,
  -当日出金,
  -结算手续费.
- action button `打印预览`.

Business meaning:

- The system produces daily account statements.
- The report combines funds, trades, fees, and registry/exchange account identity.

Candidate entity:

```text
DailyTradingStatement
  statementDate
  customerId
  customerName
  tradingAccountId
  registryAccountId
  openingCashBalance
  availableCash
  buyAmount
  sellAmount
  buyFee
  sellFee
  settlementFee
  cashIn
  cashOut
  generatedAt
```

### 8. User And Operator Management

Evidence:

- top-left user section shows operator id and customer id.
- `用户信息管理` includes:
  - login password modification,
  - fund password modification,
  - user basic information,
  - user information modification request.
- user basic info/contact page fields include:
  -联系人姓名,
  -联系人证件类型,
  -联系人证件号码,
  -联系电话（手机）,
  -联系电话（固定）,
  -联系人电子邮箱,
  -联系人部门/职务,
  -联系人联系地址.

Business meaning:

- Operator, customer, trading account, fund account, and registry account are different identity layers.
- Security settings include both login password and fund password, which implies sensitive transaction authorization.

Candidate entities:

```text
Customer
  customerId
  name
  organizationId
  status

Operator
  operatorId
  customerId
  loginName
  status
  permissions

ContactProfile
  customerId
  contactName
  identityType
  identityNumber
  mobile
  phone
  email
  departmentOrTitle
  address
```

## Public Website / Trading Intent Entry

Observed public site:

- `上海环境能源交易所`
- English name: `SHANGHAI ENVIRONMENT AND ENERGY EXCHANGE`
- URL shown: `https://www.cneeex.com`
- homepage navigation includes:
  - `首页`
  - `新闻中心`
  - `碳排放交易`
  - `用水权交易`
  - `绿色低碳服务`
  - `关于我们`
- banner title: `交易意向信息发布平台`
- CTA: `点击进入`
- shortcut items:
  - `全国碳排放权交易`
  - `EATNS碳管理体系`
  - `绿色指数`
  - `能力建设`
- `新闻中心` tabs include:
  -政策动态,
  -机构动态,
  -通知公告,
  -热点资讯.
- `市场行情` shows `全国碳市场综合价格行情`; visible values include close around `81.97`,涨幅 `0.16%`,挂牌成交量 `107,290吨`,挂牌成交额 `8,794,800.00元`, time `2026-06-03 15:00`.

Confirmed scope:

- public market disclosure,
- public news and notice disclosure,
- public navigation/entry into trading-intent information platform.

Not confirmed by this recording:

- intent publishing login,
- intent publish form,
- intent matching workflow,
- intent detail page,
- approval workflow for intent posts.

Candidate future entities if another recording shows the internal platform:

```text
TradingIntentPost
  postId
  publisherId
  instrumentCode
  side: BUY | SELL
  intendedQuantity
  intendedPrice
  contactMethod
  validityStart
  validityEnd
  status

IntentInquiry
  inquiryId
  postId
  requesterId
  message
  status
```

## Cross-System Domain Boundary

The video implies at least four separate but connected systems:

| System | Core Responsibility | Evidence |
| --- | --- | --- |
| Registry system | Holds official allowance/project asset ownership and supports registry-side transfer. | `登记系统->交易系统`, `交易系统->登记系统`, `配额登记账户`. |
| Exchange trading system | Order entry, matching/session trade, deals, funds, holdings, fees. | `全国碳排放权交易系统`, order/deal/fund/quota modules. |
| Public market disclosure portal | News, market行情, public links, platform entry. | `上海环境能源交易所` website and market行情 chart. |
| Trading-intent information platform | Public/semipublic intent publishing entry. | Banner `交易意向信息发布平台`; internal workflow not visible. |

For our current product architecture, this means the regional dashboard should not become the source of truth for trading workflows. It should consume projections from upstream subsystems:

- registry/project issuance ledger,
- exchange trading/order/deal ledger,
- retirement/compliance ledger,
- public market data feed,
- optional intent-publishing feed.

## API Backlog Suggested By v2

Trading account and identity:

- `GET /trading/customers/{customerId}`
- `GET /trading/operators/me`
- `GET /trading/accounts`
- `GET /trading/accounts/{accountId}/contact-profile`
- `POST /trading/accounts/{accountId}/contact-change-requests`

Market data:

- `GET /market/instruments`
- `GET /market/instruments/{code}`
- `GET /market/instruments/{code}/quotes/latest`
- `GET /market/instruments/{code}/candles`
- `GET /market/instruments/{code}/ticks`

Order and deal:

- `POST /trading/orders`
- `POST /trading/orders/{orderId}/cancel`
- `GET /trading/orders/today`
- `GET /trading/orders/history`
- `GET /trading/deals/today`
- `GET /trading/deals/history`

Funds:

- `GET /trading/fund-accounts/{fundAccountId}`
- `GET /trading/fund-accounts/{fundAccountId}/flows`

Quota transfer:

- `GET /trading/quota-positions`
- `POST /trading/quota-transfer-applications`
- `GET /trading/quota-transfer-applications`
- `GET /trading/quota-transfer-applications/{transferId}`

Agreement / auction:

- `GET /trading/agreement-sessions`
- `GET /trading/agreement-sessions/{sessionId}`
- `POST /trading/agreement-sessions/{sessionId}/orders`
- `GET /trading/auction-sessions`
- `GET /trading/auction-sessions/{sessionId}`
- `POST /trading/auction-sessions/{sessionId}/bids`

Reports and export:

- `GET /trading/daily-statements`
- `GET /trading/daily-statements/{statementId}/pdf`
- `GET /trading/orders/export`
- `GET /trading/deals/export`

Public website / market disclosure:

- `GET /public/news`
- `GET /public/notices`
- `GET /public/market-summary`
- `GET /public/market-summary/national-carbon`

Trading intent, pending confirmation from a real internal recording:

- `GET /intent-posts`
- `POST /intent-posts`
- `GET /intent-posts/{postId}`
- `POST /intent-posts/{postId}/inquiries`

## Relationship To Current Dashboard Prototype

Current dashboard prototype already has:

- project registration / issuance story,
- completed trade aggregation,
- buyer-side retirement story,
- regional metrics and balance scoring.

v2 shows missing trading-system capabilities:

- trading account and operator identity,
- tradable instrument catalog,
- market quote and K-line/tick data,
- order lifecycle before trade execution,
- fund balance/frozen funds,
- exchange-side holding/frozen holding,
- registry-to-exchange quota transfer,
- auction/agreement sessions,
- day/history operational query,
- daily statement generation,
- export and print-preview style audit output.

The most important architectural conclusion:

```text
Dashboard balance = registry/project ledger + exchange deal ledger + retirement ledger projection
Trading system = account/fund/holding/order/deal/session operational source of truth
```

So the dashboard can remain the product牵引入口, but it should be fed by separate bounded contexts instead of directly owning all exchange trading state.

## Recommended Next Extraction Pass

If we want to turn v1/v2 into implementable PRD slices, the next pass should produce:

1. `Trading Account And Instrument Model`
   - customer, operator, trading account, fund account, registry account, instrument.
2. `Order/Deal/Fund/Holding Ledger`
   - order state machine, fill generation, cash/holding freeze and release.
3. `Quota Transfer Between Registry And Exchange`
   - transfer application, validation, settlement, audit trail.
4. `Agreement/Auction Session Workflow`
   - session publishing, participant bidding/order entry, matching result, settlement.
5. `Dashboard Projection Contract`
   - which fields the dashboard consumes from registry, exchange, and retirement ledgers.
