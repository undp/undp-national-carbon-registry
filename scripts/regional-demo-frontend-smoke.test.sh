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
  "S8 演示交易状态机"
  "转入交易上下文"
  "创建挂牌"
  "确认演示成交"
  "演示文本，不具法律效力"
  "S10 融资意向状态机"
  "提交融资意向"
  "模拟审批不代表银行授信"
  "政府回看分层"
  "真实公开数据"
  "模拟交易活动"
  "模拟融资意向"
  "离线/本地回退"
  "操作员恢复台"
  "一键补齐S8"
  "一键补齐S10"
  "复位演示"
)

for term in "${required_component_terms[@]}"; do
  rg -q "${term}" "${COMPONENT}"
done

rg -q "cc-demo-briefing" "${COMPONENT}"
rg -q "cc-demo-briefing" "${STYLES}"

echo "regional demo frontend smoke passed"
