#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUMMARY_FIXTURE="$ROOT_DIR/web/public/regional/dashboard/summary"
API_ADAPTER="$ROOT_DIR/web/src/Pages/CommandCenter/regionalMarketApi.ts"
WEB_ENTRYPOINT="$ROOT_DIR/web/docker-entrypoint.sh"
WEB_DOCKERFILE="$ROOT_DIR/web/Dockerfile"

node - "$SUMMARY_FIXTURE" "$API_ADAPTER" "$WEB_ENTRYPOINT" "$WEB_DOCKERFILE" <<'NODE'
const fs = require("fs");

const [summaryPath, apiAdapterPath, entrypointPath, dockerfilePath] = process.argv.slice(2);
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

assert(fs.existsSync(summaryPath), "static dashboard summary fixture should exist");

if (fs.existsSync(summaryPath)) {
  const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
  const metrics = summary.metrics || {};

  assert(summary.dataStatus === "real", "fixture dataStatus should be real");
  assert(summary.projectionAvailable === true, "fixture projectionAvailable should be true");
  assert(metrics.totalIssuedCredits === 15000, "fixture should include 15000 issued credits");
  assert(metrics.activeProjectCount === 15, "fixture should include 15 active projects");
  assert(metrics.transferVolume === 4500, "fixture should include 4500 transferred credits");
  assert(metrics.retiredCredits === 1500, "fixture should include 1500 retired credits");
  assert(metrics.otcTradeCount === 15, "fixture should include 15 OTC trades");
  assert(metrics.averageOtcPrice === 42, "fixture should preserve the 42 CNY average price");
  assert(summary.accountSummary?.totalAccounts === 15, "fixture should include 15 accounts");
  assert(summary.recentProjectRegistrations?.length === 10, "fixture should expose 10 recent projects");
  assert(summary.recentTrades?.length === 10, "fixture should expose 10 recent trades");

  const regionalMetrics = summary.regionalMetrics || [];
  const zhengzhou = regionalMetrics.find((metric) => metric.city === "郑州市");
  const issued = regionalMetrics.reduce((total, metric) => total + Number(metric.issuedCredits || 0), 0);
  const sold = regionalMetrics.reduce((total, metric) => total + Number(metric.soldCredits || 0), 0);
  const bought = regionalMetrics.reduce((total, metric) => total + Number(metric.boughtCredits || 0), 0);
  const retired = regionalMetrics.reduce((total, metric) => total + Number(metric.retiredCredits || 0), 0);

  assert(issued === metrics.totalIssuedCredits, "regional issued total should match KPI");
  assert(sold === metrics.transferVolume, "regional sold total should match transfer volume");
  assert(bought === metrics.transferVolume, "regional bought total should match transfer volume");
  assert(retired === metrics.retiredCredits, "regional retired total should match retired KPI");
  assert(Boolean(zhengzhou), "fixture should include Zhengzhou metrics");
  assert(zhengzhou?.issuedCredits === 1500, "Zhengzhou issuedCredits should be 1500");
  assert(zhengzhou?.boughtCredits === 900, "Zhengzhou boughtCredits should be 900");
  assert(zhengzhou?.retiredCredits === 300, "Zhengzhou retiredCredits should be 300");
  assert(zhengzhou?.availableBalance === 2100, "Zhengzhou availableBalance should be 2100");
}

const apiAdapter = fs.readFileSync(apiAdapterPath, "utf8");
assert(
  apiAdapter.includes('?? ""') || apiAdapter.includes('|| ""'),
  "regional API base should default to same-origin for static Railway deployment"
);

const entrypoint = fs.readFileSync(entrypointPath, "utf8");
assert(
  entrypoint.includes('PORT="${PORT:-3030}"') &&
    entrypoint.includes("/etc/nginx/conf.d/default.conf"),
  "web container should make nginx listen on Railway's PORT with a 3030 fallback"
);

const dockerfile = fs.readFileSync(dockerfilePath, "utf8");
assert(
  dockerfile.includes("ARG VITE_REGIONAL_MARKET_API_BASE") &&
    dockerfile.includes("ENV VITE_REGIONAL_MARKET_API_BASE"),
  "web Dockerfile should allow live regional API override at build time"
);

if (failures.length) {
  console.error(failures.map((failure) => `FAIL: ${failure}`).join("\n"));
  process.exit(1);
}
NODE

echo "OK: regional dashboard static fixture is self-contained"
