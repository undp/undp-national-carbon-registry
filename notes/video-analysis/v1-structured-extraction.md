# v1.mp4 Structured Business Extraction

## Source And Method

- Source file: `/Users/cy/carbon/undp-national-carbon-registry/v1.mp4`
- Duration: 206.4s
- Resolution: 960x544
- Audio: effectively silent; no useful speech transcription.
- Extraction method: sampled 69 frames at 1 frame per 3 seconds, generated a contact sheet, then manually inspected representative frames. OCR was attempted with `chi_sim+eng`, but returned no usable text because UI text is small and low-contrast.

## High-Level Identification

The recording shows a desktop/web trading client titled `全国碳排放权交易`. It appears to be a carbon allowance trading terminal rather than a registry or project-management system.

The visible business scope is:

- market quotation browsing,
- contract/instrument selection,
- buy order entry,
- sell order entry,
- order cancellation/withdrawal entry,
- holdings view,
-委托/成交 query views,
- K-line and tick/分笔 market views,
- historical order/deal query.

This video is useful for reverse-engineering the trading-facing subsystem, especially order entry, market data, account position, order status, and deal history.

## Approximate Timeline

| Time | Observed UI State | Business Meaning |
| --- | --- | --- |
| 00:00-00:30 | Market list plus `买入挂单` form. Contract list includes `CEA`, `CEA21`, `CEA22`, `CEA23`, `CEA24`, `CEA25`; selected instrument changes to `CEA25 碳排放配额25`. | User selects a tradable carbon instrument and prepares a buy order. |
| 00:30-01:15 | K-line / quote view for `CEA25 碳排放配额25`; chart, bid/ask ladder, latest price, open/high/low, volume, turnover. | User inspects market trend and quote depth before trading. |
| 01:15-01:45 | Depth/distribution or position-like panel for `CEA25`; right side shows quote details and recent prints. Bottom tabs include `持仓`, `委托`, `成交`. | User checks market depth and account-related tabs. |
| 01:45-02:20 | Query section opens; left menu shows `资金持仓`, `当日委托`, `当日成交`, `历史成交`, `历史委托`. Historical query filters appear. | User reviews account/order/deal history. |
| 02:20-03:05 | `卖出挂单` form is selected; same instrument `CEA25`; bid/ask ladder remains visible. | User switches from buy to sell order entry. |
| 03:05-03:26 | Returns toward market list / sell form view. | Session ends around trading and query workflow; no final submit confirmation is clearly visible. |

## Main Navigation And Pages

### Top Navigation

Visible top-level functions:

- `买入申报`
- `卖出申报`
- `持仓`
- `分时`
- `K线`
- `分笔`
- `F10`

Visible mode buttons on the top right:

- `行情`
- `交易`
- `行情+交易`
- `交易代码管理`
- likely `合约信息查询` or similar contract information query

### Left Navigation

Trading section:

- `挂单交易`
  - `买入挂单`
  - `卖出挂单`
  - `撤销挂单`

Query section:

- `资金持仓`
- `当日委托`
- `当日成交`
- `历史成交`
- `历史委托`

## Business Objects

| Object | Evidence From UI | Notes For Our System |
| --- | --- | --- |
| Instrument / Contract | `CEA`, `CEA21` ... `CEA25`, name `碳排放配额25` | Equivalent to a tradable carbon product. In our regional system this maps to credit asset class / vintage / project-credit instrument. |
| Market Quote | latest price,涨跌/涨幅, open, previous close, high, low, bid/ask price and quantity, volume, turnover, update time | Requires market-data read model. For our current OTC prototype, only partial equivalents exist: unitPrice, totalPrice, tradeTime. |
| Trading Account | field `交易账号`; account type dropdown | Distinct from organization/company. Needs account binding and permission model. |
| Account Type | field `账户类型`, visible value like `一般账户` | Suggests trading account categories. Should not be collapsed into generic company role. |
| Buy Order | `买入挂单` form with instrument, account, price, quantity, submit button | This is order-entry behavior, not just completed OTC transfer. |
| Sell Order | `卖出挂单` form with similar fields | Requires sell-side available position validation. |
| Cancel Order | `撤销挂单` entry and order tabs | Requires order status and cancellation workflow. |
| Position / Holding | `持仓` tab and query menu `资金持仓` | Needs holdings projection: available quantity, frozen quantity, market value, cost. |
| Entrust / Order | `当日委托`, `历史委托`; table columns include order time, order id, instrument, direction, price, quantity, executed quantity, order status | Core object for order lifecycle. |
| Deal / Trade Fill | `当日成交`, `历史成交`; table columns include deal date/time, counterparty account/name, direction, price, quantity, amount, fees | Completed execution/fill object. |
| Fee | Historical deal table appears to include settlement/trading fee columns | Production trading workflows need fee model; current regional OTC smoke does not. |

## Candidate Entities

```text
TradingInstrument
  code
  name
  market
  vintage / complianceYear
  status
  priceTick
  quantityUnit

TradingAccount
  accountId
  accountType
  organizationId
  status
  permissions

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
  updateTime

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

Holding
  tradingAccountId
  instrumentCode
  totalQuantity
  availableQuantity
  frozenQuantity
  costPrice
  marketValue

FundPosition
  tradingAccountId
  availableCash
  frozenCash
  totalAssets
```

## Candidate State Machines

### Order

```text
Draft
  -> Submitted
  -> PartiallyFilled
  -> Filled
  -> PartiallyCancelled
  -> Cancelled
  -> Rejected
```

Key inferred rules:

- Buy order requires sufficient available funds.
- Sell order requires sufficient available holding.
- Submitted but unfilled quantity can be cancelled.
- Filled quantity is immutable and should appear in deal history.
- Cancelled quantity should release frozen funds or holdings.

### Holding

```text
Available
  -> FrozenForSellOrder
  -> Sold
  -> ReleasedAfterCancel
```

### Fund

```text
AvailableCash
  -> FrozenForBuyOrder
  -> SettledAfterFill
  -> ReleasedAfterCancel
```

## Form Fields And Validation Rules

### Buy Order Form

Observed fields:

- `标的物代码`
- `标的物名称`
- `账户类型`
- `交易账号`
- `委托价格`
- `可用资金`
- `可买数量`
- `委托数量`
- quick quantity buttons: `1/2`, `1/3`, `1/4`, `1/5`
- submit button: `买入`

Likely validations:

- instrument code required and must be tradable;
- trading account required;
- order price required and must comply with tick/price-limit rules;
- order quantity required and must be positive;
- buy quantity must not exceed `可买数量`;
- buy cash requirement must not exceed `可用资金`;
- inactive or closed market instruments cannot be submitted.

### Sell Order Form

Observed fields mirror buy form:

- `标的物代码`
- `标的物名称`
- `账户类型`
- `交易账号`
- `委托价格`
- `可用资金` or account-related display field
- `可卖数量`
- `委托数量`
- quick quantity buttons
- submit button: `卖出`

Likely validations:

- sell quantity must not exceed available holding;
- sell order freezes holding until filled/cancelled;
- price and quantity follow instrument market rules.

### Historical Query Forms

Observed filters:

- start date
- end date
- instrument code
- buy/sell direction
- query button
- clear button

Tables appear to include:

- order/deal date and time,
- order/deal number,
- instrument code,
- instrument name,
- buy/sell direction,
- order/deal price,
- order/deal quantity,
- executed quantity,
- counterparty account or name,
- fees,
- order status,
- market.

## API Backlog Suggested By Video

### Market Data

```http
GET /trading/instruments
GET /trading/instruments/:code/quote
GET /trading/instruments/:code/order-book
GET /trading/instruments/:code/kline
GET /trading/instruments/:code/ticks
```

### Order Entry

```http
POST /trading/orders
POST /trading/orders/:id/cancel
GET /trading/orders/today
GET /trading/orders/history
```

### Deals

```http
GET /trading/deals/today
GET /trading/deals/history
```

### Account And Positions

```http
GET /trading/accounts
GET /trading/accounts/:id/funds
GET /trading/accounts/:id/holdings
```

## Mapping To Current Regional Dashboard Prototype

| Video Business Capability | Current Prototype Equivalent | Gap |
| --- | --- | --- |
| Market quote list | Static/demo top market panels and OTC trade rows | No live order book or quote engine. |
| Buy/sell order entry | `executeOtcTrade` records completed OTC metadata | Missing order lifecycle and matching/acceptance states. |
| Holdings / available quantity | regional `availableBalance` city aggregate | Missing per-account, per-instrument holdings. |
| Order history | recentTrades table only shows completed OTC rows | Missing submitted/cancelled/rejected/partial order history. |
| Deal history | market_trade_execution_entity completed trades | Missing fill/deal granularity and counterparty fee model. |
| Fees | none | Need trading/settlement fee model if imitating exchange-like terminal. |
| K-line/tick data | none | Need market data store or synthetic projection. |

## Development Implications

This video points to a trading terminal, not just a registry dashboard. If this capability is in scope, the backend should not be expanded by adding columns to dashboard tables. It should add a separate trading bounded context:

- instruments,
- trading accounts,
- funds,
- holdings,
- orders,
- fills/deals,
- cancellations,
- market data snapshots.

The dashboard should consume projections from these entities, not own their lifecycle.

## First-Round Open Questions

1. Is the target system intended to support exchange-style order entry, or only OTC agreement transfer with dashboard visualization?
2. Do we need funds/cash account modeling, or will cash settlement remain offline?
3. Should `CEA25` style compliance allowance instruments be modeled separately from voluntary project credits?
4. Are order book, K-line, and tick views required for prototype, or are they only reference material?
5. Should account type and trading account be separate from registry organization/company?
6. Is fee calculation required for the first prototype?

