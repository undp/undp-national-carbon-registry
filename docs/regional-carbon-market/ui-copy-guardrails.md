# Phase Zero Demo UI Copy Guardrails

Status: Phase 0 baseline

## 1. Required Labels

| Data/Screen | Required Label |
| --- | --- |
| S12 verified public indicators | `真实公开数据` |
| S8 transaction-state outputs | `模拟运营信号` |
| S10 financing-intent outputs | `模拟运营信号` |
| Internal assessment/warning-like tags | `内部研判` or `内部研判指标` |
| Seeded organizations/accounts/assets | `演示数据` |
| Non-golden-path modules | `正式期建设` |

## 2. Preferred Terms

- `区域绿色权益演示资产`
- `演示登记账户`
- `演示交易账户`
- `演示合同预览`
- `模拟成交状态凭证`
- `融资测算`
- `质押意向申请`
- `模拟审批结果`
- `内部研判指标`
- `ESG demo-v1`

## 3. Prohibited Affirmative Wording

These terms must not appear in affirmative user-facing copy:

- `官方 CCER 交易`
- `核证自愿减排量交易`
- `真实登记结算`
- `真实清算`
- `银行放款`
- `法律有效电子合同`
- `官方预警`
- `交易账户真实持仓`
- `交易平台正式上线`

If a document must mention these terms for review or negation, add an explicit
allowlist entry in `docs/regional-carbon-market/redline-term-allowlist.txt`.

## 4. Required Disclaimers

| Screen/Artifact | Copy |
| --- | --- |
| Contract preview | `演示文本，不具法律效力` |
| Status certificate | `模拟成交状态凭证，仅用于阶段零演示` |
| Valuation | `融资测算结果仅用于演示` |
| Finance review | `模拟审批不代表银行授信` |
| ESG | `ESG demo-v1 为内部演示模型` |
| Supervision return | `以下交易/融资数据为模拟运营信号` |

## 5. Placeholder Rule

Blueprint modules outside the golden path must render a stable placeholder:

```text
正式期建设
```

They must not call missing APIs or display blank/error pages.
