#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPONENT="${ROOT_DIR}/web/src/Pages/CommandCenter/CarbonTradingCommandCenter.tsx"
STYLES="${ROOT_DIR}/web/src/Pages/CommandCenter/commandCenter.scss"

required_component_terms=(
  "S12 真实公开指标驾驶舱"
  "来源明细"
  "已核验公开来源"
  "模拟运营信号"
  "演示合同预览"
  "模拟成交状态凭证"
  "融资测算"
  "质押意向申请"
  "模拟审批结果"
)

for term in "${required_component_terms[@]}"; do
  rg -q "${term}" "${COMPONENT}"
done

rg -q "cc-demo-briefing" "${COMPONENT}"
rg -q "cc-demo-briefing" "${STYLES}"

echo "regional demo frontend smoke passed"
