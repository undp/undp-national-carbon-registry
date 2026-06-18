# S12 Indicator Source Catalog

Status: Phase 0 baseline catalog  
Scope: first verified public-data candidates for Henan/Zhengzhou S12 cockpit  
Rule: a value may be shown as real public data only when `verified=true`.

## 1. Verification Fields

Each indicator seed row must carry:

- `sourceLabel`
- `sourceUrl` or `sourceDocument`
- `sourceYear`
- `caliber`
- `methodologyNote`
- `verified`
- `verifiedBy`
- `verifiedAt`

## 2. Initial Verified Indicators

| ID | Region | Indicator | Period | Value | Unit | Source | Caliber | Methodology Note | Verified |
| --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- |
| `s12-henan-gdp-2025` | 河南省 | 地区生产总值 | 2025 | 66632.79 | 亿元 | 河南省统计局，`2025年河南省国民经济和社会发展统计公报`，https://tjj.henan.gov.cn/2026/04-09/3341308.html | 初步核算，绝对数按现价，增长速度按不变价格计算。 | 年度宏观公开指标，用于S12经济底座展示。 | true |
| `s12-henan-industrial-energy-consumption-2025` | 河南省 | 规模以上工业综合能源消费量增速 | 2025 | -0.6 | % | 河南省统计局，`2025年河南省国民经济和社会发展统计公报`，https://tjj.henan.gov.cn/2026/04-09/3341308.html | 规模以上工业综合能源消费量同比变化。 | 能源消费强度相关公开指标；不得替代全社会碳排放核算。 | true |
| `s12-zhengzhou-gdp-2025` | 郑州市 | 地区生产总值 | 2025 | 15244.6 | 亿元 | 郑州市统计局，`2025年郑州市国民经济和社会发展统计公报`，https://tjj.zhengzhou.gov.cn/tjgb/10017864.jhtml | 初步核算，绝对数按现价，增长速度按不变价格计算。 | 重点地市经济底座指标。 | true |
| `s12-zhengzhou-power-consumption-2025` | 郑州市 | 全社会用电量 | 2025 | 726.6 | 亿千瓦时 | 郑州市统计局，`2025年郑州市国民经济和社会发展统计公报`，https://tjj.zhengzhou.gov.cn/tjgb/10017864.jhtml | 年度全社会用电量，同比增速在来源公报中列示。 | 能源活动相关公开指标；不等同于碳排放量。 | true |
| `s12-zhengzhou-renewable-installed-capacity-share-2025` | 郑州市 | 可再生能源装机容量占比 | 2025 | 25.6 | % | 郑州市统计局，`2025年郑州市国民经济和社会发展统计公报`，https://tjj.zhengzhou.gov.cn/tjgb/10017864.jhtml | 可再生能源装机容量占发电装机容量的比重。 | 绿色能源供给结构指标。 | true |
| `s12-henan-afforestation-area-2025` | 河南省 | 完成造林面积 | 2025 | 44.80 | 千公顷 | 河南省统计局，`2025年河南省国民经济和社会发展统计公报`，https://tjj.henan.gov.cn/2026/04-09/3341308.html | 年度完成造林面积，来源公报资源、环境和应急管理章节。 | 生态/碳汇相关公开指标；不等同于经核算碳汇量。 | true |

## 3. Verification Log

- 2026-06-17: Codex verified the Henan Statistics Bureau page with `curl -L -A
  'Mozilla/5.0' https://tjj.henan.gov.cn/2026/04-09/3341308.html`; the page
  contains the Henan GDP, industrial energy consumption, renewable installed
  capacity, afforestation, and resource/environment paragraphs used above.
- 2026-06-17: Codex verified the Zhengzhou Statistics Bureau page through web
  fetch; the page contains Zhengzhou GDP, population, industrial energy
  consumption, electricity consumption, and renewable generation metrics.
- None of these indicators is a direct carbon-emission inventory. UI labels must
  call them public regional indicators, energy indicators, or internal
  assessment inputs.

Seed rows created from this catalog should set:

```text
verifiedBy = "Codex source check, 2026-06-17"
verifiedAt = "2026-06-17T00:00:00+08:00"
```

## 4. Reset Rule

`POST /regional/demo/reset` must preserve verified S12 source records and
restore their seed values. Demo S8/S10 transaction and finance state resets
separately.
