# Regional Demo Operator Guide

Date: 2026-06-18
Scope: Phase 3 formal-presentation runbook for the regional carbon market demo.

## Preconditions

- Use Chrome or Chromium at 1920x1080 when possible.
- Open `/command-center`.
- Keep `REGIONAL_MARKET_DEMO_MODE=true` for backend-only protected regional
  registry routes.
- Keep a local fallback recording outside git for each act if the target network
  is unstable.

## Golden Path

1. Government role:
   - Confirm `S12 真实公开指标驾驶舱` is visible.
   - Click a Zhengzhou S12 card.
   - Expected: source panel shows `郑州市统计局` and verified public-source text.
2. Enterprise role:
   - Click `转入交易上下文`.
   - Expected: trading available shows `1,000 吨`.
   - Click `创建挂牌`.
   - Expected: listing shows `800 吨 · 42 元/吨`.
   - Click `确认演示成交`.
   - Expected: deal shows `800 吨 · 33,600.00 元`.
   - Expected boundaries: `演示文本，不具法律效力` and `不含资金清算或银行结算`.
3. Finance role:
   - Click `提交融资意向`.
   - Expected: assessed amount shows `25,200.00 元`.
   - Expected: `模拟审批不代表银行授信`.
   - Expected: `PLEDGE_LOCKED`.
4. Government role:
   - Confirm `政府回看分层`.
   - Expected: `真实公开数据`, `模拟交易活动`, `模拟融资意向`, and
     `内部评估标签` remain separate.

## Operator Recovery

Switch to `操作` role to show `操作员恢复台`.

- `一键补齐S8`: fills transfer, listing, deal, contract preview, and status
  certificate demo state.
- `一键补齐S10`: fills valuation, financing-intent, simulated review, and pledge
  lock demo state.
- `复位演示`: resets local presentation state and calls backend reset when the
  API is available.

Do not describe operator controls as business features. They are recovery tools
for live presentation only.

## Offline/Fallback Mode

- The cockpit shows `离线/本地回退` status.
- If backend calls fail, S12 briefing and Phase 2 golden path use local static
  demo state with the same truth-status labels.
- Run `bash scripts/regional-demo-offline-smoke.sh` before travel or formal
  presentation.
- Keep fallback recordings outside git:
  - Act 1: S12 source drilldown.
  - Act 2: S8 transaction state machine.
  - Act 3: S10 financing-intent review.
  - Act 4: government return dashboard.

## Troubleshooting

- If the screen shows old state, switch to `操作` role and click `复位演示`.
- If S8 buttons are disabled, check whether S10 has already locked the selected
  asset as `PLEDGE_LOCKED`; reset before replaying S8.
- If the API is down, continue with local fallback state and use the fallback
  recording for the affected act.
- If text is clipped on the projector, reduce browser zoom to 90% and reload.
