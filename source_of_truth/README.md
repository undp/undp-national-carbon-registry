# Source of Truth

这个目录用于沉淀登记系统、交易系统、清结算和国际参考资料，后续原型、数据模型和 dashboard 口径调整优先从这里取证。

## 目录结构

- `official/`: 官方或准官方规则、公告、网页镜像。
- `manuals/`: 用户手册、开户指引、操作指引。
- `international-reference/`: Verra、Gold Standard、Climate Action Reserve 等国际登记簿参考。
- `extracted-text/`: 从 PDF/HTML/前端静态资源抽取出的可检索文本。优先用于 `rg` 检索。

## 使用原则

1. 业务规则优先级：生态环境部/注册登记机构/交易机构规则 > 用户手册 > 系统前端工作流线索 > 国际参考。
2. dashboard 指标只能使用全量聚合口径；`recent*` 只用于最近列表、飞线或轮播展示。
3. 登记系统是资产权属和注销口径的事实源；交易系统是委托、成交、资金、行情和结算服务事实源。
4. 如果资料之间冲突，先保留冲突并标注来源，不用 demo 数据覆盖真实规则。

## 当前资料清单

| 路径 | 来源 | 覆盖范围 | 状态 |
| --- | --- | --- | --- |
| `official/2023-voluntary-emission-reduction-trading-management-measures-trial.pdf` | https://www.mee.gov.cn/xxgk2018/xxgk/xxgk02/202310/W020231020692880455588.pdf | 总体管理办法；注册登记系统、交易系统、项目登记、减排量登记、交易、注销 | 已下载 |
| `official/2023-voluntary-emission-reduction-trading-settlement-rules-trial.pdf` | https://www.ccer.com.cn/upload/atta/20231116/1700126626497022464.pdf | 交易与结算规则 | 已下载 |
| `official/2023-voluntary-emission-reduction-trading-settlement-rules-trial.html` | https://www.ccer.com.cn/wcm/ccer/html/2311jygz/20231120/183432502.shtml | 交易与结算规则网页版本 | 已下载 |
| `official/2023-voluntary-emission-reduction-registration-rules-trial.html` | https://www.ccn.ac.cn/carbon-market/ccer/210.html | 登记规则网页镜像 | 已下载；PDF 源站 502 |
| `official/2023-validation-verification-implementation-rules.pdf` | https://www.ccn.ac.cn/wp-content/uploads/2024/01/%E3%80%8A%E6%B8%A9%E5%AE%A4%E6%B0%94%E4%BD%93%E8%87%AA%E6%84%BF%E5%87%8F%E6%8E%92%E9%A1%B9%E7%9B%AE%E5%AE%A1%E5%AE%9A%E4%B8%8E%E5%87%8F%E6%8E%92%E9%87%8F%E6%A0%B8%E6%9F%A5%E5%AE%9E%E6%96%BD%E8%A7%84%E5%88%99%E3%80%8B.pdf | 项目审定、减排量核查、机构职责 | 已下载 |
| `official/2023-ncsc-registry-rules-project-guide-news.html` | https://www.ncsc.org.cn/xwdt/gnxw/202311/t20231117_1056637.shtml | 登记规则和项目设计实施指南发布新闻 | 已下载 |
| `official/2023-registry-rules-and-project-design-guide-announcement.html` | https://ccer.cets.org.cn/notice/noticeDetail?bulletinInfoId=1174755335156666368 | 登记规则和项目设计实施指南公告入口 | 已保存；SPA 壳，正文有限 |
| `official/2023-project-design-implementation-guide-announcement.html` | https://ccer.cets.org.cn/notice/noticeDetail?bulletinInfoId=1176838198991654912 | 项目设计与实施指南公告入口 | 已保存；SPA 壳，正文有限 |
| `manuals/2023-registry-system-enterprise-account-opening-guide.pdf` | https://www.ncsc.org.cn/xwdt/gnxw/202308/W020230818646316361965.pdf | 登记系统企业开户、联合开户、独立开户 | 已下载 |
| `manuals/2025-national-ghg-voluntary-emission-reduction-trading-client-manual.pdf` | 本仓库根目录 `全国温室气体自愿减排交易系统用户手册.pdf` | 交易客户端、行情、挂牌协议、成交、资金管理 | 已归档 |
| `extracted-text/ccer-registry-system-spa-workflow-markers.txt` | 从 `https://ccer.cets.org.cn` 前端静态资源抽取 | 登记系统工作流标识：项目登记、核证登记、签发、转移、抵消及注销等 | 已抽取 |
| `extracted-text/ccer-registry-system-spa-api-endpoints.txt` | 从 `https://ccer.cets.org.cn` 前端静态资源抽取 | 登记系统 API 端点线索 | 已抽取 |
| `international-reference/verra-registry-overview.html` | https://verra.org/registry/overview/ | 国际登记簿账户、项目、签发、转让、注销参考 | 已下载 |
| `international-reference/gold-standard-impact-registry.html` | https://www.goldstandard.org/project-developers/impact-registry/ | 国际登记簿项目和影响资产参考 | 已下载 |
| `international-reference/2022-climate-action-reserve-user-guide.pdf` | https://www.climateactionreserve.org/wp-content/uploads/2022/05/Reserve-User-Guide_May2022.pdf | 国际登记簿用户、项目、批次、转让、注销参考 | 已下载 |

## 已知缺口

- 全国温室气体自愿减排注册登记规则 PDF 原始下载链接当前返回 502，已保留 HTML 镜像作为临时证据。
- 项目设计与实施指南正文 PDF 尚未定位到稳定直链；目前只有发布新闻/公告入口。
- 登记系统完整操作手册、表单字段和审批状态仍需继续从官方手册、前端静态资源或录屏补齐。
