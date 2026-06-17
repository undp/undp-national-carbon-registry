# Dashboard SOT 口径核对

核对对象：`GET /regional/dashboard/summary` 后端投影、前端区域大屏展示、smoke 种子和测试。

核对依据：`source_of_truth/` 中的管理办法、交易和结算规则、交易客户端手册、登记系统前端工作流标识，以及 `docs/regional-carbon-market/system-completion-source-reference.md`。

## 总体判断

当前 dashboard 主干口径已经比上一版更接近 SOT：顶部指标使用全量已登记项目、有效 OTC 成交、全量已完成注销；`regionalMetrics` 也已经改为全量项目和有效交易聚合，`recentProjectRegistrations`、`recentTrades` 主要用于列表和飞线展示。

但还不能判断为完整交易系统符合 SOT。已修正的问题包括：地市注销明细不再 `take: 50` 截断；OTC 成交汇总、recentTrades、aggregateTrades 只统计 `SETTLED_OFFLINE`；前端真实 API `dataStatus: real` 且存在 regional projection 时默认不再被 50 条 demo 覆盖；最近项目登记列表只查询 `AUTHORISED` / `AUTHORIZED`；前端区域快照成交量不再把买方量和卖方量双计。剩余主要缺口是：交易系统的 CCER 转入交易账户、交易标的上市、清结算后登记交收链路没有建模。

## SOT 要求摘录

| 要求 | SOT 证据 |
| --- | --- |
| 注册登记系统是项目、减排量登记、持有、变更、注销和权属状态最终依据 | `source_of_truth/extracted-text/2023-voluntary-emission-reduction-trading-management-measures-trial.txt:61`、`:66`、`:68`、`:70`、`:72` |
| 交易机构负责交易系统和集中统一交易与结算服务 | `source_of_truth/extracted-text/2023-voluntary-emission-reduction-trading-management-measures-trial.txt:82`、`:87`、`:89` |
| 交易主体应同时开设注册登记系统和交易系统账户 | `source_of_truth/extracted-text/2023-voluntary-emission-reduction-trading-management-measures-trial.txt:340`、`:342` |
| 核证自愿减排量交易通过交易系统进行，成交结果驱动登记系统变更持有数量和状态 | `source_of_truth/extracted-text/2023-voluntary-emission-reduction-trading-management-measures-trial.txt:344`、`:350`、`:352`、`:356` |
| 抵销和自愿注销应在注册登记系统中予以注销 | `source_of_truth/extracted-text/2023-voluntary-emission-reduction-trading-management-measures-trial.txt:366`、`:370`、`:372`、`:374` |
| 交易账户用于交易，登记账户用于记录登记、持有、变更、注销 | `source_of_truth/extracted-text/2025-national-ghg-voluntary-emission-reduction-trading-client-manual.txt:127`、`:130`、`:132`、`:134` |
| 挂牌协议交易是委托、摘牌、成交流程，卖出需足额持仓，买入需足额资金 | `source_of_truth/extracted-text/2025-national-ghg-voluntary-emission-reduction-trading-client-manual.txt:341`、`:371`、`:377`、`:379`、`:393`、`:399`、`:406` |
| CCER 转入交易系统须先从注册登记系统发起“转移至交易账户”，再转移至交易平台；转出可查转入转出流水 | `source_of_truth/extracted-text/2025-national-ghg-voluntary-emission-reduction-trading-client-manual.txt:583`、`:587`、`:589`、`:591`、`:602`、`:642`、`:648` |
| 登记系统存在签发、持有量转移确认、抵消及注销确认/审批等工作流 | `source_of_truth/extracted-text/ccer-registry-system-spa-workflow-markers.txt:20`、`:23`、`:24`、`:25`、`:36`、`:38`、`:46` |

## 当前符合项

| 核对项 | 当前实现 | 判断 |
| --- | --- | --- |
| 顶部项目数 | `projectProjection()` 对 `AUTHORISED`/`AUTHORIZED` 项目计数，且 recent list 也使用同一过滤条件，见 `backend/services/libs/shared/src/regional-market/regional-market-projection.service.ts:176`、`:181`、`:187` | 基本符合“已登记/授权项目”口径 |
| 顶部签发量 | `issuanceProjection()` 汇总 `project.creditIssued`，失败时 fallback 到 completed issued transaction，见 `regional-market-projection.service.ts:243`、`:261` | demo 口径可用；真实长期应优先签发/登记事实表 |
| 顶部成交量/笔数/金额/均价 | `MarketTradeExecutionService.getTradeSummary()` 汇总 `market_trade_execution_entity`，并过滤 `SETTLED_OFFLINE`；均价为 `SUM(totalPrice) / SUM(amount)`，见 `market-trade-execution.service.ts:6`、`:55`、`:59`、`:63`、`:69` | 符合当前“已执行 OTC + 线下结算 metadata”展示口径 |
| 顶部注销量 | `retirementProjection()` 只统计 `Completed` 注销，见 `regional-market-projection.service.ts:347`、`:350` | 符合“已完成注销”口径 |
| 地市指标不再用最近 10 条 | `getDashboardSummary()` 给 `regionalMetrics` 传入 `aggregateProjectRegistrations` 和 `aggregateTrades`，见 `regional-market-projection.service.ts:108`、`:112`、`:114`、`:115`；`tradeProjection()` 同时查询 `take: 10` 和 `take: null`，见 `:313`、`:315`、`:318` | 符合 |
| 地市买入/卖出/余额公式 | `buildRegionalMetrics()` 按 sellerCity 计卖出、buyerCity 计买入，并计算 `issued + bought - sold - retired`，见 `regional-market-projection.service.ts:593`、`:603`、`:608`、`:624` | 符合 dashboard 投影口径 |
| pending 注销排除 | smoke 和 projection 均按 `Completed` 统计，见 `scripts/regional-market-smoke.sh:409`、`:675`、`:679` | 符合 |
| 账号文案 | 后端从“重点排放单位”改为“市场参与主体/地方主管机构/项目业主/核证机构”，见 `regional-market-projection.service.ts:423` | 符合当前 SOT 的谨慎命名 |
| 前端区域快照成交量 | `buildRegionalSnapshot()` 通过 `singleCountTradeVolume()` 聚合买方总量和卖方总量的较大值，避免跨市成交在区域层面按买卖双方双计 | 符合“已执行 OTC 成交量按单边成交量计一次”的展示口径 |

## 不符合或有风险项

### Resolved: 地市注销明细不再被截断

`retirementProjection()` 的总注销量汇总全量完成注销，`retirementContextProjection()` 也不再设置 `take` 截断：

- 总量：`regional-market-projection.service.ts:347`
- 地市明细：`regional-market-projection.service.ts:485`、`:487`

后端单测已覆盖 60 条完成注销的地市聚合，避免顶部总量与地图地市合计再次因 50 条限制不一致。

### Resolved: 成交统计过滤有效 OTC metadata

`MarketTradeExecutionService.getTradeSummary()`、`queryTrades({ take: 10 })` 和 `queryTrades({ take: null })` 现在共用 `SETTLED_OFFLINE` 口径：

- `market-trade-execution.service.ts:6`
- `market-trade-execution.service.ts:48`
- `market-trade-execution.service.ts:69`

这能排除 `RECONCILIATION_REQUIRED` 等非最终 OTC metadata 对成交量、成交额、均价和地市买卖聚合的污染。

中期仍应新增 `ClearingResult` 和 `RegistryHoldingChange`，把 dashboard 成交量定义为“已成交”，余额定义为“登记系统已交收/已变更持仓”。

### P0: 交易系统转入/转出和标的物上市链路未建模

交易客户端手册明确：交易标的首次交易前需要标的物维护；CCER 转入交易系统必须从注册登记系统发起“转移至交易账户”，再“转移至交易平台”。当前 dashboard 只有 `MarketTradeExecutionEntity`，没有：

- `RegistryAccountBinding`
- `TradingInstrument`
- `CcerTransferToTradingAccount`
- `TradingAccountHolding`
- `ClearingResult`

因此当前“卖出前足额持仓、买入前足额资金、成交后交收”都没有系统约束，只是 demo 种子自洽。

建议：dashboard 原型可以继续显示成交结果，但文案不要暗示已经具备完整交易系统能力；下一步应补交易账户绑定、交易标的、交易账户持仓和清结算接口。

### Resolved: 前端真实 API 接通后默认优先真实数据

前端逻辑已改为：

- `demoProgress` 初始为 `demoEvents.length`，`isDemoPlaying` 初始为 `false`
- 当 `dashboardSummary.dataStatus === "real"` 且 regional projection 存在时，初始 `isPlaybackActive` 为 false，页面直接使用真实 projection
- 50 条故事仍可通过播放/重播按钮显式进入演示模式

这保留离线演示能力，但不会在真实 API 接通后自动覆盖真实口径。

### Resolved: 前端 `regionalSnapshot.tradeVolume` 不再双计

`buildRegionalSnapshot()` 之前把地市 `boughtCredits + soldCredits` 相加作为 `tradeVolume`，会得到成交量的 2 倍。当前已改为调用 `singleCountTradeVolume()`：

- `web/src/Pages/CommandCenter/regionalSnapshotMath.ts`
- `web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx`
- `scripts/command-center-regional-snapshot.test.mjs`

新逻辑分别汇总区域买入量和卖出量，再取较大单边值。内部跨市成交不会按买卖双方双计；如果未来出现只有买方或只有卖方地市归属的数据，也不会被压成 0。新增脚本覆盖内部镜像、buyer-only、seller-only、空数组、零值、异常负值和不平衡数据。

### Resolved: 最近项目登记列表过滤已登记/已授权状态

`projectProjection()` 的 `activeProjectCount`、`recentProjectRegistrations` 和 `aggregateProjectRegistrations` 均过滤授权阶段：

- `regional-market-projection.service.ts:181`
- `regional-market-projection.service.ts:187`
- `regional-market-projection.service.ts:194`

因此前端“最近项目登记”不会把草稿、公示中、审核中项目表达成已登记项目。

### P2: 评分公式是监管展示公式，不是 SOT 官方公式

`governanceScoreBreakdown()` 使用 base 66、供给、交易、注销、闭环 bonus、未闭环 penalty：

- `regional-market-projection.service.ts:676`
- `regional-market-projection.service.ts:680`
- `regional-market-projection.service.ts:687`

SOT 没有官方“地市评分”公式。当前公式可以作为产品化解释，但必须标注为内部演示/监管研判指标，不能声称来自官方规则。

建议：在 API 或前端加 `scoreMethodologyVersion: "demo-v1"`，并在文档中固定公式和适用边界。

## 当前 50 条闭环故事核对

`scripts/regional-market-smoke.sh` 的 demo 种子与前端 demo 故事基本一致：

- 15 个项目，10 个项目签发，每个 1,500 吨：`scripts/regional-market-smoke.sh:243`、`:295`、`:301`、`:303`
- 15 笔成交，每笔 300 吨，合计 4,500 吨：`scripts/regional-market-smoke.sh:451`、`:470`、`:495`
- 10 笔完成注销，每笔 150 吨，合计 1,500 吨：`scripts/regional-market-smoke.sh:354`、`:375`、`:396`
- 郑州签发 1,500、买入 900、注销 300、余额 2,100 的 smoke 校验存在：`scripts/regional-market-smoke.sh:572`、`:573`、`:574`、`:575`、`:576`

需要注意：后端 unit test 里另有一个 synthetic case 仍让郑州买入 4,500、余额 5,200，用于验证“全量不是最近 10 条”的逻辑，见 `regional-market-projection.service.spec.ts:536`、`:539`、`:612`、`:614`、`:616`。这不是当前 smoke demo 故事，但读测试时容易误解，建议补注释。

## 结论

当前 dashboard 可以作为“区域登记簿生命周期 + 已执行场外协议成交结果”的监管展示原型，但还不是完全符合 SOT 的交易系统/登记系统闭环实现。

必须先修的口径问题：

1. ~~地市注销明细去掉 `take: 50` 截断，改为全量聚合。~~ 已完成。
2. ~~成交汇总和地市买卖聚合增加有效状态过滤，至少排除失败/撤销/未生效记录。~~ 已完成，当前白名单为 `SETTLED_OFFLINE`。
3. ~~真实 API 接通时前端默认展示真实数据，demo 播放变成显式模式。~~ 已完成。
4. ~~最近项目登记列表过滤已登记/已授权状态。~~ 已完成。

随后补模型问题。这些问题不阻断当前“区域登记簿生命周期 + 已执行 OTC 成交 metadata”dashboard PoC，但阻断“完整符合 SOT 的交易系统/登记系统闭环”表述：

1. 建模登记账户与交易账户绑定。
2. 建模 CCER 转入交易账户、转入交易平台、转出登记系统。
3. 建模交易标的上市、交易账户持仓、清算结果、登记交收变更。
4. 固定 dashboard 评分公式版本，明确它是内部研判指标，不是官方规则。
