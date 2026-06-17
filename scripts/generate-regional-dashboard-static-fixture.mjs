#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const outputPath = resolve(rootDir, "web/public/regional/dashboard/summary");

const cityByCompanyId = new Map([
  [900001, "信阳市"],
  [900002, "南阳市"],
  [900003, "三门峡市"],
  [900004, "开封市"],
  [900005, "许昌市"],
  [900006, "周口市"],
  [900007, "商丘市"],
  [900008, "驻马店市"],
  [900009, "洛阳市"],
  [900010, "郑州市"],
  [900011, "安阳市"],
  [900012, "新乡市"],
  [900013, "焦作市"],
  [900014, "平顶山市"],
  [900015, "濮阳市"],
]);

const companyName = (companyId) => {
  const n = companyId - 900000;
  if (n <= 10) return `区域项目业主${n}`;
  if (n <= 14) return `区域核证机构${n - 10}`;
  return "区域主管机构";
};

const projectSector = (n) => (n % 3 === 0 ? "林业碳汇" : "可再生能源");
const projectMethod = (n) => (n % 3 === 0 ? "Afforestation" : "Renewable energy");

const projectRows = Array.from({ length: 15 }, (_, index) => {
  const n = index + 1;
  const companyId = 900000 + n;

  return {
    id: `SMOKE-PRJ-${n}`,
    refId: `SMOKE-PRJ-${n}`,
    serialNumber: `SMOKE-SN-${n}`,
    projectName: `区域减排示范项目 ${n}`,
    companyId,
    ownerName: companyName(companyId),
    city: cityByCompanyId.get(companyId),
    province: "河南省",
    sector: projectSector(n),
    sectoralScope: projectMethod(n),
    status: n % 2 === 0 ? "AUTHORIZED" : "AUTHORISED",
    registeredAt: new Date(1780272000000 + n).toISOString(),
    creditEst: 1500,
    creditIssued: n <= 10 ? 1500 : 0,
  };
});

const tradePlan = [
  [1, 900001, 900010, 1],
  [2, 900002, 900009, 2],
  [3, 900003, 900014, 3],
  [4, 900004, 900011, 4],
  [5, 900005, 900012, 5],
  [6, 900006, 900013, 6],
  [7, 900007, 900015, 7],
  [8, 900008, 900015, 8],
  [9, 900001, 900009, 1],
  [10, 900002, 900010, 2],
  [11, 900005, 900014, 5],
  [12, 900007, 900011, 7],
  [13, 900004, 900012, 4],
  [14, 900003, 900013, 3],
  [15, 900008, 900010, 8],
];

const tradeRows = tradePlan.map(([n, sellerCompanyId, buyerCompanyId, projectN]) => {
  const sellerName = companyName(sellerCompanyId);
  const buyerName = companyName(buyerCompanyId);

  return {
    id: n,
    creditTransactionId: `SMOKE-TX-FULL-${n}`,
    creditBlockId: `SMOKE-CB-${projectN}`,
    sellerCompanyId,
    buyerCompanyId,
    sellerName,
    buyerName,
    sellerCity: cityByCompanyId.get(sellerCompanyId),
    buyerCity: cityByCompanyId.get(buyerCompanyId),
    projectRefId: `SMOKE-PRJ-${projectN}`,
    serialNumber: `SMOKE-SN-${projectN}`,
    amount: 300,
    unitPrice: 42,
    totalPrice: 12600,
    currency: "CNY",
    tradeTime: new Date(Date.parse("2026-06-11T00:00:00.000Z") + n * 60000).toISOString(),
    settlementStatus: "SETTLED_OFFLINE",
    sector: "场外协议转让",
    counterparty: `${sellerName} → ${buyerName}`,
  };
});

const retirementPlan = [
  [1, 900010],
  [2, 900009],
  [3, 900014],
  [4, 900011],
  [5, 900012],
  [6, 900013],
  [7, 900015],
  [8, 900015],
  [9, 900010],
  [10, 900009],
];

const emptyScoreBreakdown = () => ({
  base: 66,
  project: 0,
  supply: 0,
  trading: 0,
  retirement: 0,
  closureBonus: 0,
  unclosedDemandPenalty: 0,
});

const governanceBand = (score) => {
  if (score < 60) return "pressure";
  if (score < 70) return "improving";
  if (score < 84) return "balanced";
  return "leading";
};

const governanceScoreBreakdown = (metric) => {
  const hasClosedLoop =
    metric.retiredCredits > 0 && (metric.boughtCredits > 0 || metric.issuedCredits > 0);

  return {
    base: 66,
    project: Math.min(4, metric.projectCount * 1.5),
    supply: Math.min(8, (metric.issuedCredits / 2500) * 8),
    trading: Math.min(6, ((metric.soldCredits + metric.boughtCredits) / 3000) * 5),
    retirement: Math.min(10, (metric.retiredCredits / 200) * 8),
    closureBonus: hasClosedLoop ? 3 : 0,
    unclosedDemandPenalty:
      metric.boughtCredits > 0 && metric.retiredCredits === 0
        ? Math.min(6, metric.boughtCredits / 1000)
        : 0,
  };
};

const metricsByCity = new Map(
  Array.from(cityByCompanyId.values()).map((city) => [
    city,
    {
      city,
      province: "河南省",
      accountCount: 0,
      projectCount: 0,
      issuedCredits: 0,
      soldCredits: 0,
      boughtCredits: 0,
      retiredCredits: 0,
      availableBalance: 0,
      tradeValue: 0,
      governanceScore: 66,
      governanceBand: "neutral",
      governanceScoreBreakdown: emptyScoreBreakdown(),
    },
  ])
);

cityByCompanyId.forEach((city) => {
  metricsByCity.get(city).accountCount += 1;
});

projectRows.forEach((project) => {
  const metric = metricsByCity.get(project.city);
  metric.projectCount += 1;
  metric.issuedCredits += project.creditIssued;
});

tradeRows.forEach((trade) => {
  const sellerMetric = metricsByCity.get(trade.sellerCity);
  const buyerMetric = metricsByCity.get(trade.buyerCity);

  sellerMetric.soldCredits += trade.amount;
  sellerMetric.tradeValue += trade.totalPrice;
  buyerMetric.boughtCredits += trade.amount;
  buyerMetric.tradeValue += trade.totalPrice;
});

retirementPlan.forEach(([, senderId]) => {
  metricsByCity.get(cityByCompanyId.get(senderId)).retiredCredits += 150;
});

const regionalMetrics = Array.from(metricsByCity.values())
  .map((metric) => {
    const availableBalance =
      metric.issuedCredits +
      metric.boughtCredits -
      metric.soldCredits -
      metric.retiredCredits;
    const carbonActivity =
      metric.projectCount +
      metric.issuedCredits +
      metric.soldCredits +
      metric.boughtCredits +
      metric.retiredCredits;
    const breakdown =
      carbonActivity > 0 ? governanceScoreBreakdown(metric) : emptyScoreBreakdown();
    const rawScore =
      breakdown.base +
      breakdown.project +
      breakdown.supply +
      breakdown.trading +
      breakdown.retirement +
      breakdown.closureBonus -
      breakdown.unclosedDemandPenalty;
    const score = carbonActivity > 0 ? Math.max(50, Math.min(94, rawScore)) : 66;

    return {
      ...metric,
      availableBalance,
      governanceScore: score,
      governanceBand: carbonActivity > 0 ? governanceBand(score) : "neutral",
      governanceScoreBreakdown: breakdown,
    };
  })
  .sort((a, b) => b.issuedCredits + b.boughtCredits - (a.issuedCredits + a.boughtCredits));

const summary = {
  dataStatus: "real",
  dataSource: "static-fixture",
  projectionAvailable: true,
  projectionErrors: [],
  sectionStatus: {
    projects: "real",
    issuance: "real",
    trades: "real",
    retirements: "real",
    accounts: "real",
  },
  metrics: {
    totalIssuedCredits: 15000,
    activeProjectCount: 15,
    transferVolume: 4500,
    retiredCredits: 1500,
    averageOtcPrice: 42,
    otcTradeCount: 15,
    otcTradeValue: 189000,
  },
  accountSummary: {
    totalAccounts: 15,
    accountTypes: [
      { label: "市场参与主体", count: 15, value: "15 家" },
      { label: "地方主管机构", count: 1, value: "1 家" },
      { label: "项目业主", count: 10, value: "10 家" },
      { label: "核证机构", count: 4, value: "4 家" },
    ],
  },
  recentProjectRegistrations: projectRows.slice().reverse().slice(0, 10),
  recentTrades: tradeRows.slice().reverse().slice(0, 10),
  supervisoryAlerts: [],
  regionalMetrics,
  generatedAt: "2026-06-15T00:00:00.000Z",
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(`Wrote ${outputPath}`);
