import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Pause,
  Play,
  CheckCircle2,
  CircleDashed,
  Database,
  FileText,
  Leaf,
  MessageSquareWarning,
  Route,
  ShieldCheck,
} from "lucide-react";
import {
  fetchRegionalDemoIndicatorSource,
  fetchRegionalDemoIndicators,
  fetchRegionalDashboardSummary,
  loginRegionalDemo,
  switchRegionalDemoRole,
  type DemoIndicatorSource,
  type DemoRegionIndicator,
  type DemoRole,
  type DemoSession,
  type RegionalDashboardSummary,
} from "./regionalMarketApi";
import { singleCountTradeVolume } from "./regionalSnapshotMath";
import rawHenanGeoJson from "china-map-geojson/lib/province/he_nan_geo";
import "./commandCenter.scss";

type AccountType = {
  label: string;
  value: string;
};

type ProjectRow = {
  id: string;
  name: string;
  owner: string;
  method: string;
  credits: string;
};

type TradeRow = {
  date: string;
  counterparty?: string;
  volume: string;
  amount: string;
  average: string;
  sector: string;
};

type SectionKey = "accounts" | "projects" | "issuance" | "trades" | "retirements";
type AssetChainVariant = "classic" | "immersive";
type ProjectedRegion = {
  name: string;
  path: string;
  className: string;
  fill: string;
};

type MapMarker = {
  city: string;
  label: string;
  scoreLabel?: string;
  value: string;
  coordinate: [number, number];
  active: boolean;
  band: GovernanceBand;
};

type DemoEventType = "REGISTER" | "ISSUE" | "TRADE" | "RETIRE";
type GovernanceBand = "neutral" | "pressure" | "improving" | "balanced" | "leading";

type GovernanceScoreBreakdown = {
  base: number;
  project: number;
  supply: number;
  trading: number;
  retirement: number;
  closureBonus: number;
  unclosedDemandPenalty: number;
};

type TradeFlow = {
  id: string;
  sellerCity: string;
  buyerCity: string;
  volume: number;
};

type CityBaseline = {
  name: string;
  coordinate: [number, number];
  role: "高排放履约" | "项目供给" | "综合流转";
  baselinePressure: number;
  startingScore: number;
  sector: string;
};

type DemoEvent = {
  seq: number;
  type: DemoEventType;
  cityName: string;
  projectName: string;
  method: string;
  accountOwner?: string;
  projectOwner?: string;
  buyer?: string;
  seller?: string;
  buyerCity?: string;
  sellerCity?: string;
  governanceNote: string;
  credits: number;
  tradeVolume: number;
  tradeValue: number;
  retiredCredits: number;
  timestamp: string;
};

type DemoCityState = CityBaseline & {
  accounts: number;
  projects: number;
  issuedCredits: number;
  soldCredits: number;
  boughtCredits: number;
  retiredCredits: number;
  availableBalance: number;
  tradeValue: number;
  score: number;
  band: GovernanceBand;
  scoreBreakdown: GovernanceScoreBreakdown;
  latestEvent?: DemoEvent;
};

type DemoSnapshot = {
  appliedCount: number;
  accounts: number;
  projects: number;
  issuedCredits: number;
  tradeCount: number;
  tradeVolume: number;
  tradeValue: number;
  retiredCredits: number;
  activeCities: string[];
  cityStates: DemoCityState[];
  recentProjects: ProjectRow[];
  recentTrades: TradeRow[];
  tradeFlows: TradeFlow[];
  latestEvent?: DemoEvent;
};

const sectionLabels: Record<SectionKey, string> = {
  accounts: "开户",
  projects: "项目",
  issuance: "签发",
  trades: "成交",
  retirements: "注销",
};

const assetChainVariant: AssetChainVariant = "immersive";
const henanGeoJson = rawHenanGeoJson as {
  features: Array<{
    properties: {
      name: string;
      cp?: [number, number];
    };
    geometry: {
      type: "Polygon" | "MultiPolygon";
      coordinates: unknown;
    };
  }>;
};

const fallbackAccountTypes: AccountType[] = [
  { label: "市场参与主体", value: "1,430 家" },
  { label: "地方主管机构", value: "48 家" },
  { label: "项目业主", value: "172 家" },
  { label: "核证机构", value: "1,688 家" },
];

const fallbackProjectRows: ProjectRow[] = [
  {
    id: "11",
    name: "海上风电场减排项目",
    owner: "瓯海有限公司",
    method: "海上风力发电",
    credits: "2,524,717",
  },
  {
    id: "12",
    name: "林业碳汇造林项目",
    owner: "绿源生态发展有限公司",
    method: "造林碳汇",
    credits: "1,276,244",
  },
  {
    id: "13",
    name: "300MW 风电项目",
    owner: "苏交控新能源有限公司",
    method: "并网风电",
    credits: "1,087,010",
  },
];

const fallbackTradeRows: TradeRow[] = [
  {
    date: "2026-06-10",
    counterparty: "生态项目业主 → 控排企业",
    volume: "48,500",
    amount: "4,177,850.00",
    average: "86.14",
    sector: "场外协议转让",
  },
  {
    date: "2026-06-09",
    counterparty: "新能源项目业主 → 履约主体",
    volume: "132,000",
    amount: "11,418,000.00",
    average: "86.50",
    sector: "场外协议转让",
  },
  {
    date: "2026-06-08",
    counterparty: "林业碳汇业主 → 履约主体",
    volume: "8,400",
    amount: "720,300.00",
    average: "85.75",
    sector: "场外协议转让",
  },
];

const fallbackDemoIndicators: DemoRegionIndicator[] = [
  {
    id: "s12-henan-gdp-2025",
    regionCode: "410000",
    regionName: "河南省",
    indicatorCode: "GDP_CURRENT_PRICE",
    indicatorName: "地区生产总值",
    dimension: "economy",
    period: "2025",
    value: 66632.79,
    targetValue: null,
    unit: "亿元",
    caliber: "初步核算，绝对数按现价，增长速度按不变价格计算。",
    sourceLabel: "河南省统计局 2025年河南省国民经济和社会发展统计公报",
    sourceUrl: "https://tjj.henan.gov.cn/2026/04-09/3341308.html",
    sourceDocument: null,
    sourceYear: 2026,
    verified: true,
    verifiedBy: "Phase 0 source catalog",
    verifiedAt: "2026-06-17T00:00:00+08:00",
    methodologyNote: "年度宏观公开指标，用于S12经济底座展示。",
    truthStatus: "REAL_PUBLIC_DATA",
    displayOrder: 10,
  },
  {
    id: "s12-zhengzhou-gdp-2025",
    regionCode: "410100",
    regionName: "郑州市",
    indicatorCode: "GDP_CURRENT_PRICE",
    indicatorName: "地区生产总值",
    dimension: "economy",
    period: "2025",
    value: 15244.6,
    targetValue: null,
    unit: "亿元",
    caliber: "初步核算，绝对数按现价，增长速度按不变价格计算。",
    sourceLabel: "郑州市统计局 2025年郑州市国民经济和社会发展统计公报",
    sourceUrl: "https://tjj.zhengzhou.gov.cn/tjgb/10017864.jhtml",
    sourceDocument: null,
    sourceYear: 2026,
    verified: true,
    verifiedBy: "Phase 0 source catalog",
    verifiedAt: "2026-06-17T00:00:00+08:00",
    methodologyNote: "重点地市经济底座指标。",
    truthStatus: "REAL_PUBLIC_DATA",
    displayOrder: 30,
  },
  {
    id: "s12-henan-afforestation-area-2025",
    regionCode: "410000",
    regionName: "河南省",
    indicatorCode: "AFFORESTATION_AREA",
    indicatorName: "完成造林面积",
    dimension: "ecology",
    period: "2025",
    value: 44.8,
    targetValue: null,
    unit: "千公顷",
    caliber: "年度完成造林面积，来源公报资源、环境和应急管理章节。",
    sourceLabel: "河南省统计局 2025年河南省国民经济和社会发展统计公报",
    sourceUrl: "https://tjj.henan.gov.cn/2026/04-09/3341308.html",
    sourceDocument: null,
    sourceYear: 2026,
    verified: true,
    verifiedBy: "Phase 0 source catalog",
    verifiedAt: "2026-06-17T00:00:00+08:00",
    methodologyNote: "生态/碳汇相关公开指标；不等同于经核算碳汇量。",
    truthStatus: "REAL_PUBLIC_DATA",
    displayOrder: 50,
  },
];

const demoRoles: Array<{
  role: DemoRole;
  label: string;
  account: string;
}> = [
  { role: "GOVERNMENT", label: "政府", account: "gov_demo" },
  { role: "ENTERPRISE", label: "企业", account: "enterprise_demo" },
  { role: "FINANCE", label: "金融", account: "finance_demo" },
  { role: "OPERATOR", label: "操作", account: "operator_demo" },
];

const fallbackDemoSession: DemoSession = {
  sessionId: "demo-session-gov",
  user: {
    id: "demo-user-gov",
    account: "gov_demo",
    role: "GOVERNMENT",
    organizationId: "demo-org-government",
    organizationName: "河南省区域碳市场演示监管端",
  },
};

const henanDemoCities: CityBaseline[] = [
  {
    name: "郑州市",
    coordinate: [113.6254, 34.7466],
    role: "高排放履约",
    baselinePressure: 88,
    startingScore: 54,
    sector: "电力与交通",
  },
  {
    name: "洛阳市",
    coordinate: [112.454, 34.6197],
    role: "高排放履约",
    baselinePressure: 82,
    startingScore: 58,
    sector: "建材与装备制造",
  },
  {
    name: "南阳市",
    coordinate: [112.5283, 32.9908],
    role: "项目供给",
    baselinePressure: 52,
    startingScore: 73,
    sector: "林业碳汇",
  },
  {
    name: "信阳市",
    coordinate: [114.0913, 32.1486],
    role: "项目供给",
    baselinePressure: 46,
    startingScore: 77,
    sector: "生态碳汇",
  },
  {
    name: "开封市",
    coordinate: [114.3076, 34.7972],
    role: "综合流转",
    baselinePressure: 64,
    startingScore: 66,
    sector: "农业减排",
  },
  {
    name: "许昌市",
    coordinate: [113.852, 34.0357],
    role: "综合流转",
    baselinePressure: 67,
    startingScore: 64,
    sector: "分布式能源",
  },
  {
    name: "新乡市",
    coordinate: [113.9268, 35.303],
    role: "高排放履约",
    baselinePressure: 78,
    startingScore: 59,
    sector: "化工与建材",
  },
  {
    name: "焦作市",
    coordinate: [113.2418, 35.2159],
    role: "高排放履约",
    baselinePressure: 76,
    startingScore: 60,
    sector: "工业锅炉",
  },
  {
    name: "平顶山市",
    coordinate: [113.1927, 33.7662],
    role: "高排放履约",
    baselinePressure: 80,
    startingScore: 57,
    sector: "煤电与化工",
  },
  {
    name: "驻马店市",
    coordinate: [114.0223, 33.0114],
    role: "综合流转",
    baselinePressure: 58,
    startingScore: 69,
    sector: "农业甲烷减排",
  },
  {
    name: "商丘市",
    coordinate: [115.6563, 34.4143],
    role: "综合流转",
    baselinePressure: 61,
    startingScore: 67,
    sector: "可再生能源",
  },
  {
    name: "周口市",
    coordinate: [114.6969, 33.6258],
    role: "综合流转",
    baselinePressure: 60,
    startingScore: 68,
    sector: "农业废弃物利用",
  },
  {
    name: "安阳市",
    coordinate: [114.3925, 36.0988],
    role: "高排放履约",
    baselinePressure: 85,
    startingScore: 55,
    sector: "钢铁与焦化",
  },
  {
    name: "三门峡市",
    coordinate: [111.1941, 34.7773],
    role: "项目供给",
    baselinePressure: 55,
    startingScore: 71,
    sector: "水电与林业",
  },
  {
    name: "濮阳市",
    coordinate: [115.0293, 35.7618],
    role: "高排放履约",
    baselinePressure: 75,
    startingScore: 61,
    sector: "石化",
  },
  {
    name: "漯河市",
    coordinate: [114.0165, 33.5815],
    role: "综合流转",
    baselinePressure: 56,
    startingScore: 70,
    sector: "食品工业节能",
  },
  {
    name: "鹤壁市",
    coordinate: [114.2973, 35.7482],
    role: "高排放履约",
    baselinePressure: 73,
    startingScore: 62,
    sector: "煤化工",
  },
];

const projectRegistrations = [
  ["信阳市", "信阳大别山林业碳汇项目", "信阳绿源林业发展有限公司", "林业碳汇"],
  ["南阳市", "南阳伏牛山生态修复项目", "南阳生态建设集团", "造林碳汇"],
  ["三门峡市", "黄河流域水土保持减排项目", "三门峡绿能发展有限公司", "生态修复"],
  ["开封市", "开封农田秸秆资源化项目", "开封循环农业科技有限公司", "农业减排"],
  ["许昌市", "许昌分布式光伏减排项目", "许昌新能投资有限公司", "可再生能源"],
  ["周口市", "周口农业废弃物利用项目", "周口绿色农业发展有限公司", "农业减排"],
  ["商丘市", "商丘风光互补减排项目", "商丘新能源开发有限公司", "可再生能源"],
  ["驻马店市", "驻马店养殖甲烷回收项目", "驻马店牧原低碳科技有限公司", "甲烷减排"],
  ["洛阳市", "洛阳工业余热利用项目", "洛阳节能服务有限公司", "工业节能"],
  ["郑州市", "郑州公共交通电动化项目", "郑州公交低碳运营有限公司", "交通减排"],
  ["安阳市", "安阳钢铁余热回收项目", "安阳低碳冶金服务有限公司", "工业节能"],
  ["新乡市", "新乡园区蒸汽系统优化项目", "新乡高新区能源服务有限公司", "工业节能"],
  ["焦作市", "焦作矿区瓦斯利用项目", "焦作清洁能源有限公司", "甲烷利用"],
  ["平顶山市", "平顶山煤电灵活性改造项目", "平顶山节能科技有限公司", "电力节能"],
  ["濮阳市", "濮阳石化火炬气回收项目", "濮阳清洁生产服务有限公司", "工业减排"],
] as const;

const issuancePlan = [
  ["信阳市", 1500],
  ["南阳市", 1500],
  ["三门峡市", 1500],
  ["开封市", 1500],
  ["许昌市", 1500],
  ["驻马店市", 1500],
  ["商丘市", 1500],
  ["周口市", 1500],
  ["洛阳市", 1500],
  ["郑州市", 1500],
] as const;

const tradePlan = [
  ["信阳市", "郑州市", "信阳绿源林业发展有限公司", "郑州热电集团有限公司"],
  ["南阳市", "洛阳市", "南阳生态建设集团", "洛阳水泥有限公司"],
  ["三门峡市", "平顶山市", "三门峡绿能发展有限公司", "平顶山煤电有限公司"],
  ["开封市", "安阳市", "开封循环农业科技有限公司", "安阳钢铁集团有限公司"],
  ["许昌市", "新乡市", "许昌新能投资有限公司", "新乡化工园区能源有限公司"],
  ["周口市", "焦作市", "周口绿色农业发展有限公司", "焦作煤电集团有限公司"],
  ["商丘市", "濮阳市", "商丘新能源开发有限公司", "濮阳石化有限公司"],
  ["驻马店市", "濮阳市", "驻马店牧原低碳科技有限公司", "濮阳煤化工有限公司"],
  ["信阳市", "洛阳市", "信阳绿源林业发展有限公司", "洛阳装备制造集团"],
  ["南阳市", "郑州市", "南阳生态建设集团", "郑州轨道交通集团"],
  ["许昌市", "平顶山市", "许昌新能投资有限公司", "平顶山化工有限公司"],
  ["商丘市", "安阳市", "商丘新能源开发有限公司", "安阳焦化有限公司"],
  ["开封市", "新乡市", "开封循环农业科技有限公司", "新乡建材集团"],
  ["三门峡市", "焦作市", "三门峡绿能发展有限公司", "焦作热力有限公司"],
  ["驻马店市", "郑州市", "驻马店牧原低碳科技有限公司", "郑州航空港能源有限公司"],
] as const;

const retirementPlan = [
  ["郑州市", "郑州热电集团有限公司"],
  ["洛阳市", "洛阳水泥有限公司"],
  ["平顶山市", "平顶山煤电有限公司"],
  ["安阳市", "安阳钢铁集团有限公司"],
  ["新乡市", "新乡化工园区能源有限公司"],
  ["焦作市", "焦作煤电集团有限公司"],
  ["濮阳市", "濮阳石化有限公司"],
  ["濮阳市", "濮阳煤化工有限公司"],
  ["郑州市", "郑州轨道交通集团"],
  ["洛阳市", "洛阳装备制造集团"],
] as const;

const getProjectMeta = (cityName: string) =>
  projectRegistrations.find(([city]) => city === cityName) ?? projectRegistrations[0];

const makeTimestamp = (seq: number) =>
  `2026-06-${String(10 + Math.ceil(seq / 8)).padStart(2, "0")}`;

const compactCounterparty = (event: DemoEvent) =>
  event.seller && event.buyer
    ? `${event.seller} → ${event.buyer}`
    : `${(event.sellerCity ?? "供给地").replace("市", "")}→${(
        event.buyerCity ?? "履约地"
      ).replace("市", "")}`;

const demoEvents: DemoEvent[] = [
  ...projectRegistrations.map(([cityName, projectName, owner, method], index) => ({
    seq: index + 1,
    type: "REGISTER" as const,
    cityName,
    projectName,
    method,
    accountOwner: owner,
    projectOwner: owner,
    governanceNote: `${cityName}新增${method}项目，形成后续签发供给。`,
    credits: 1000,
    tradeVolume: 0,
    tradeValue: 0,
    retiredCredits: 0,
    timestamp: makeTimestamp(index + 1),
  })),
  ...issuancePlan.map(([cityName, credits], index) => {
    const [, projectName, owner, method] = getProjectMeta(cityName);
    const seq = index + 16;

    return {
      seq,
      type: "ISSUE" as const,
      cityName,
      projectName,
      method,
      projectOwner: owner,
      seller: owner,
      sellerCity: cityName,
      governanceNote: `${cityName}项目完成减排量签发，增加可交易供给。`,
      credits,
      tradeVolume: 0,
      tradeValue: 0,
      retiredCredits: 0,
      timestamp: makeTimestamp(seq),
    };
  }),
  ...tradePlan.map(([sellerCity, buyerCity, seller, buyer], index) => {
    const [, projectName, , method] = getProjectMeta(sellerCity);
    const seq = index + 26;

    return {
      seq,
      type: "TRADE" as const,
      cityName: buyerCity,
      projectName,
      method,
      seller,
      buyer,
      sellerCity,
      buyerCity,
      governanceNote: `${sellerCity}供给流向${buyerCity}履约主体，买方治理缺口收窄。`,
      credits: 0,
      tradeVolume: 300,
      tradeValue: 12600,
      retiredCredits: 0,
      timestamp: makeTimestamp(seq),
    };
  }),
  ...retirementPlan.map(([cityName, buyer], index) => {
    const seq = index + 41;

    return {
      seq,
      type: "RETIRE" as const,
      cityName,
      projectName: `${cityName}履约注销批次`,
      method: "履约注销",
      buyer,
      buyerCity: cityName,
      governanceNote: `${cityName}控排主体完成注销抵销，治理指数上修。`,
      credits: 0,
      tradeVolume: 0,
      tradeValue: 0,
      retiredCredits: 150,
      timestamp: makeTimestamp(seq),
    };
  }),
];

const formatClock = (date: Date) =>
  date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

const formatNumber = (value?: number, fractionDigits = 0) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString("zh-CN", {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      })
    : undefined;

const formatCnyWan = (value?: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? `${formatNumber(value / 10000, 2)} 万元`
    : undefined;

const formatPercent = (numerator?: number, denominator?: number) => {
  if (
    typeof numerator !== "number" ||
    typeof denominator !== "number" ||
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator === 0
  ) {
    return undefined;
  }

  return `${formatNumber((numerator / denominator) * 100, 1)}%`;
};

const localizeDemoText = (value: unknown, fallback = "-") => {
  const text = String(value ?? fallback);
  const dictionary: Record<string, string> = {
    "Smoke Regional Solar Project": "区域光伏减排示范项目",
    "Smoke Regional Forest Project": "区域林业碳汇示范项目",
    "Smoke Regional Wind Project": "区域风电减排示范项目",
    Forestry: "林业碳汇",
    Energy: "可再生能源",
  };

  if (text.includes("Smoke Regional")) {
    return text.toLowerCase().includes("forest")
      ? "区域林业碳汇示范项目"
      : "区域减排示范项目";
  }

  return dictionary[text] ?? text;
};

const localizeCompanyName = (value: unknown, fallback = "-") =>
  String(value ?? fallback)
    .replace(/Smoke Project Developer\s*(\d+)/gi, "区域项目业主$1")
    .replace(/Smoke Independent Certifier\s*(\d+)/gi, "区域核证机构$1")
    .replace(/Smoke Designated National Authority\s*(\d+)/gi, "区域主管机构$1")
    .replace(/Smoke Company\s*(\d+)/gi, "区域参与主体$1")
    .replace(/Smoke/gi, "区域");

const localizeCounterparty = (value: unknown, fallback = "卖方 → 买方") =>
  localizeCompanyName(value, fallback);

const getDemoStageLabel = (progress: number) => {
  if (progress === 0) {
    return "阶段 0 · 系统就绪";
  }
  if (progress <= 5) {
    return "阶段 1 · 单条溯源";
  }
  if (progress <= 35) {
    return "阶段 2 · 多源汇聚";
  }
  return "阶段 3 · 省域定格";
};

const getGovernanceBand = (score: number): GovernanceBand => {
  if (score < 60) {
    return "pressure";
  }
  if (score < 70) {
    return "improving";
  }
  if (score < 84) {
    return "balanced";
  }
  return "leading";
};

const clampScore = (score: number) => Math.max(50, Math.min(94, score));

const emptyScoreBreakdown = (): GovernanceScoreBreakdown => ({
  base: 66,
  project: 0,
  supply: 0,
  trading: 0,
  retirement: 0,
  closureBonus: 0,
  unclosedDemandPenalty: 0,
});

const calculateScoreBreakdown = (city: DemoCityState): GovernanceScoreBreakdown => {
  const hasClosedLoop =
    city.retiredCredits > 0 && (city.boughtCredits > 0 || city.issuedCredits > 0);

  return {
    base: 66,
    project: Math.min(4, city.projects * 1.5),
    supply: Math.min(8, (city.issuedCredits / 2500) * 8),
    trading: Math.min(6, ((city.soldCredits + city.boughtCredits) / 3000) * 5),
    retirement: Math.min(10, (city.retiredCredits / 200) * 8),
    closureBonus: hasClosedLoop ? 3 : 0,
    unclosedDemandPenalty:
      city.boughtCredits > 0 && city.retiredCredits === 0
        ? Math.min(6, city.boughtCredits / 1000)
        : 0,
  };
};

const scoreFromBreakdown = (breakdown: GovernanceScoreBreakdown) =>
  clampScore(
    breakdown.base +
      breakdown.project +
      breakdown.supply +
      breakdown.trading +
      breakdown.retirement +
      breakdown.closureBonus -
      breakdown.unclosedDemandPenalty
  );

const hasCityCarbonActivity = (city: DemoCityState) =>
  city.accounts +
    city.projects +
    city.issuedCredits +
    city.soldCredits +
    city.boughtCredits +
    city.retiredCredits >
  0;

const makeInitialCityStates = () =>
  henanDemoCities.map<DemoCityState>((city) => ({
    ...city,
    accounts: 0,
    projects: 0,
    issuedCredits: 0,
    soldCredits: 0,
    boughtCredits: 0,
    retiredCredits: 0,
    availableBalance: 0,
    tradeValue: 0,
    score: 66,
    band: "neutral",
    scoreBreakdown: emptyScoreBreakdown(),
  }));

const recalculateCityScore = (city: DemoCityState) => {
  city.availableBalance =
    city.issuedCredits + city.boughtCredits - city.soldCredits - city.retiredCredits;

  if (!hasCityCarbonActivity(city)) {
    city.score = 66;
    city.band = "neutral";
    city.scoreBreakdown = emptyScoreBreakdown();
    return;
  }

  const scoreBreakdown = calculateScoreBreakdown(city);
  const score = scoreFromBreakdown(scoreBreakdown);

  city.score = score;
  city.band = getGovernanceBand(score);
  city.scoreBreakdown = scoreBreakdown;
};

const buildDemoSnapshot = (progress: number): DemoSnapshot => {
  const appliedEvents = demoEvents.slice(0, progress);
  const registeredEvents = appliedEvents.filter((event) => event.type === "REGISTER");
  const tradeEvents = appliedEvents.filter((event) => event.type === "TRADE");
  const cityStates = makeInitialCityStates();
  const stateByCity = new Map(cityStates.map((city) => [city.name, city]));

  appliedEvents.forEach((event) => {
    const primaryCity = stateByCity.get(event.cityName);

    if (primaryCity) {
      primaryCity.latestEvent = event;
      if (event.type === "REGISTER") {
        primaryCity.accounts += 1;
        primaryCity.projects += 1;
      }
      if (event.type === "ISSUE") {
        primaryCity.issuedCredits += event.credits;
      }
      if (event.type === "RETIRE") {
        primaryCity.retiredCredits += event.retiredCredits;
      }
    }

    if (event.type === "TRADE") {
      const sellerCity = event.sellerCity ? stateByCity.get(event.sellerCity) : undefined;
      const buyerCity = event.buyerCity ? stateByCity.get(event.buyerCity) : undefined;

      if (sellerCity) {
        sellerCity.soldCredits += event.tradeVolume;
        sellerCity.tradeValue += event.tradeValue;
        sellerCity.latestEvent = event;
      }
      if (buyerCity) {
        buyerCity.boughtCredits += event.tradeVolume;
        buyerCity.tradeValue += event.tradeValue;
        buyerCity.latestEvent = event;
      }
    }
  });

  cityStates.forEach(recalculateCityScore);

  const activeCities = Array.from(
    new Set(
      appliedEvents.flatMap((event) =>
        [event.cityName, event.sellerCity, event.buyerCity].filter(Boolean)
      )
    )
  ) as string[];
  const issuedCredits = appliedEvents.reduce(
    (total, event) => total + (event.type === "ISSUE" ? event.credits : 0),
    0
  );
  const tradeVolume = tradeEvents.reduce(
    (total, event) => total + event.tradeVolume,
    0
  );
  const tradeValue = tradeEvents.reduce(
    (total, event) => total + event.tradeValue,
    0
  );
  const retiredCredits = appliedEvents.reduce(
    (total, event) => total + event.retiredCredits,
    0
  );

  return {
    appliedCount: progress,
    accounts: Math.min(progress, 15),
    projects: registeredEvents.length,
    issuedCredits,
    tradeCount: tradeEvents.length,
    tradeVolume,
    tradeValue,
    retiredCredits,
    activeCities,
    cityStates,
    recentProjects: registeredEvents
      .reverse()
      .map((event) => ({
        id: String(event.seq),
        name: event.projectName,
        owner: event.projectOwner ?? event.accountOwner ?? event.cityName,
        method: event.method,
        credits: formatNumber(event.credits) ?? "0",
      })),
    recentTrades: tradeEvents
      .reverse()
      .map((event) => ({
        date: event.timestamp,
        counterparty: compactCounterparty(event),
        volume: formatNumber(event.tradeVolume) ?? "0",
        amount: formatNumber(event.tradeValue, 2) ?? "0.00",
        average:
          event.tradeVolume > 0
            ? formatNumber(event.tradeValue / event.tradeVolume, 2) ?? "0.00"
            : "0.00",
        sector: "场外协议转让",
      })),
    tradeFlows: tradeEvents
      .filter((event) => event.sellerCity && event.buyerCity)
      .reverse()
      .map((event) => ({
        id: String(event.seq),
        sellerCity: event.sellerCity as string,
        buyerCity: event.buyerCity as string,
        volume: event.tradeVolume,
      })),
    latestEvent: appliedEvents[appliedEvents.length - 1],
  };
};

const buildRegionalSnapshot = (
  regionalMetrics?: RegionalDashboardSummary["regionalMetrics"],
  recentTrades?: RegionalDashboardSummary["recentTrades"]
): DemoSnapshot | undefined => {
  if (!regionalMetrics?.length) {
    return undefined;
  }

  const baselineByCity = new Map(henanDemoCities.map((city) => [city.name, city]));
  const cityStates = regionalMetrics
    .map((metric) => {
      const cityName = String(metric.city ?? "");
      const baseline = baselineByCity.get(cityName);

      if (!cityName || !baseline) {
        return undefined;
      }

      const activity =
        (metric.accountCount ?? 0) +
        (metric.projectCount ?? 0) +
        (metric.issuedCredits ?? 0) +
        (metric.soldCredits ?? 0) +
        (metric.boughtCredits ?? 0) +
        (metric.retiredCredits ?? 0);
      const score = activity > 0 ? metric.governanceScore ?? baseline.startingScore : 66;

      return {
        ...baseline,
        accounts: metric.accountCount ?? 0,
        projects: metric.projectCount ?? 0,
        issuedCredits: metric.issuedCredits ?? 0,
        soldCredits: metric.soldCredits ?? 0,
        boughtCredits: metric.boughtCredits ?? 0,
        retiredCredits: metric.retiredCredits ?? 0,
        availableBalance:
          metric.availableBalance ??
          (metric.issuedCredits ?? 0) +
            (metric.boughtCredits ?? 0) -
            (metric.soldCredits ?? 0) -
            (metric.retiredCredits ?? 0),
        tradeValue: metric.tradeValue ?? 0,
        score,
        band: activity > 0 ? metric.governanceBand ?? getGovernanceBand(score) : "neutral",
        scoreBreakdown: metric.governanceScoreBreakdown ?? emptyScoreBreakdown(),
      };
    })
    .filter(Boolean) as DemoCityState[];

  const activeCities = cityStates.map((city) => city.name);

  return {
    appliedCount: regionalMetrics.length,
    accounts: cityStates.reduce((total, city) => total + city.accounts, 0),
    projects: cityStates.reduce((total, city) => total + city.projects, 0),
    issuedCredits: cityStates.reduce((total, city) => total + city.issuedCredits, 0),
    tradeCount: 0,
    tradeVolume: singleCountTradeVolume(cityStates),
    tradeValue: cityStates.reduce((total, city) => total + city.tradeValue, 0),
    retiredCredits: cityStates.reduce((total, city) => total + city.retiredCredits, 0),
    activeCities,
    cityStates: [
      ...cityStates,
      ...henanDemoCities
        .filter((city) => !activeCities.includes(city.name))
        .map<DemoCityState>((city) => ({
          ...city,
          accounts: 0,
          projects: 0,
          issuedCredits: 0,
          soldCredits: 0,
          boughtCredits: 0,
          retiredCredits: 0,
          availableBalance: 0,
          tradeValue: 0,
          score: 66,
          band: "neutral",
          scoreBreakdown: emptyScoreBreakdown(),
        })),
    ],
    recentProjects: [],
    recentTrades: [],
    tradeFlows: (recentTrades ?? [])
      .map((trade, index) => {
        const sellerCity = String(trade.sellerCity ?? "");
        const buyerCity = String(trade.buyerCity ?? "");
        if (!sellerCity || !buyerCity) {
          return undefined;
        }

        return {
          id: String(trade.id ?? `${sellerCity}-${buyerCity}-${index}`),
          sellerCity,
          buyerCity,
          volume: Number(trade.amount ?? 0),
        };
      })
      .filter(Boolean) as TradeFlow[],
  };
};

const toProjectRows = (
  registrations?: RegionalDashboardSummary["recentProjectRegistrations"]
): ProjectRow[] => {
  if (!registrations?.length) {
    return fallbackProjectRows;
  }

  return registrations.slice(0, 12).map((project, index) => ({
    id: String(index + 1),
    name: localizeDemoText(project.name ?? project.title ?? project.projectName),
    owner: localizeCompanyName(project.owner ?? project.companyName ?? project.ownerName),
    method: localizeDemoText(project.method ?? project.sector ?? project.methodology),
    credits: String(
      formatNumber(Number(project.credits ?? project.creditIssued ?? 0)) ?? "0"
    ),
  }));
};

const toTradeRows = (
  trades?: RegionalDashboardSummary["recentTrades"]
): TradeRow[] => {
  if (!trades?.length) {
    return fallbackTradeRows;
  }

  return trades.slice(0, 12).map((trade) => {
    const amount = Number(trade.amount ?? 0);
    const unitPrice = Number(trade.unitPrice ?? trade.averagePrice ?? 0);
    const totalPrice = Number(trade.totalPrice ?? amount * unitPrice);
    const counterparty =
      localizeCounterparty(
        trade.counterparty ??
          (trade.sellerName && trade.buyerName
            ? `${trade.sellerName} → ${trade.buyerName}`
            : "")
      ).trim() || "卖方 → 买方";

    return {
      date: String(trade.tradeTime ?? trade.date ?? "").slice(0, 10) || "-",
      counterparty,
      volume: formatNumber(amount) ?? "0",
      amount: formatNumber(totalPrice, 2) ?? "0.00",
      average: formatNumber(unitPrice, 2) ?? "0.00",
      sector: String(trade.sector ?? trade.projectSector ?? "场外协议转让"),
    };
  });
};

const toAccountTypes = (
  accountSummary?: RegionalDashboardSummary["accountSummary"]
): AccountType[] => {
  if (!accountSummary?.accountTypes?.length) {
    return fallbackAccountTypes;
  }

  return accountSummary.accountTypes.map((item) => ({
    label: String(item.label ?? "-"),
    value:
      item.value ??
      `${formatNumber(Number(item.count ?? 0)) ?? "0"} 家`,
  }));
};

const toDemoAccountTypes = (demoSnapshot: DemoSnapshot): AccountType[] => [
  {
    label: "市场参与主体",
    value: `${formatNumber(demoSnapshot.accounts) ?? "0"} 家`,
  },
  {
    label: "履约活跃地市",
    value: `${
      formatNumber(
        demoSnapshot.cityStates.filter(
          (city) => city.boughtCredits > 0 || city.retiredCredits > 0
        ).length
      ) ?? "0"
    } 家`,
  },
  {
    label: "项目业主",
    value: `${formatNumber(demoSnapshot.projects) ?? "0"} 家`,
  },
  {
    label: "成交闭环批次",
    value: `${formatNumber(demoSnapshot.tradeCount) ?? "0"} 笔`,
  },
];

const getSectionStatus = (
  summary: RegionalDashboardSummary | undefined,
  key: SectionKey,
  hasRealRegionalProjection: boolean
) =>
  hasRealRegionalProjection && summary?.sectionStatus?.[key] === "real"
    ? "real"
    : "fallback";

const rotateRows = <T,>(rows: T[], visibleCount: number, tick: number) => {
  if (rows.length <= visibleCount) {
    return rows;
  }

  const start = tick % rows.length;
  return Array.from({ length: visibleCount }, (_, index) => rows[(start + index) % rows.length]);
};

const Panel = ({
  title,
  eyebrow,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <section className={`cc-panel ${className}`}>
    <div className="cc-panel__head">
      <h2>{title}</h2>
      {eyebrow}
    </div>
    {children}
  </section>
);

const StatusPill = ({
  status,
  label,
}: {
  status: "real" | "fallback";
  label: string;
}) => (
  <span className={`cc-status-pill cc-status-pill--${status}`}>
    {status === "real" ? <CheckCircle2 size={13} /> : <CircleDashed size={13} />}
    {label} · {status === "real" ? "实时" : "待接入"}
  </span>
);

const KpiTile = ({
  label,
  value,
  source,
  status,
}: {
  label: string;
  value: string;
  source: string;
  status: "real" | "fallback";
}) => (
  <div className={`cc-kpi cc-kpi--${status}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>
        {status === "real" ? source : `待接入真实数据 · ${source}`}
      </small>
  </div>
);

const EmptyTableRow = ({ colSpan, label }: { colSpan: number; label: string }) => (
  <tr>
    <td className="cc-table__empty" colSpan={colSpan}>
      {label}
    </td>
  </tr>
);

const assetChainNodes: Array<{
  key: SectionKey;
  title: string;
  subtitle: string;
  note: string;
}> = [
  { key: "accounts", title: "开户", subtitle: "参与者生态", note: "账户主体" },
  { key: "projects", title: "项目注册", subtitle: "资产来源", note: "登记项目" },
  { key: "issuance", title: "减排量签发", subtitle: "可流转供给", note: "累计签发" },
  { key: "trades", title: "场外协议成交", subtitle: "线下资金结算", note: "已执行成交" },
  { key: "retirements", title: "注销/抵销", subtitle: "完成影响", note: "已注销" },
];

const flattenCoordinates = (coordinates: unknown): [number, number][] => {
  if (!Array.isArray(coordinates)) {
    return [];
  }

  if (
    coordinates.length >= 2 &&
    typeof coordinates[0] === "number" &&
    typeof coordinates[1] === "number"
  ) {
    return [[coordinates[0], coordinates[1]]];
  }

  return coordinates.flatMap((item) => flattenCoordinates(item));
};

const createHenanProjection = () => {
  const points = henanGeoJson.features.flatMap((feature) =>
    flattenCoordinates(feature.geometry.coordinates)
  );
  const longitudes = points.map(([longitude]) => longitude);
  const latitudes = points.map(([, latitude]) => latitude);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const width = 760;
  const height = 520;
  const padding = 26;
  const scale = Math.min(
    (width - padding * 2) / (maxLongitude - minLongitude),
    (height - padding * 2) / (maxLatitude - minLatitude)
  );
  const mapWidth = (maxLongitude - minLongitude) * scale;
  const mapHeight = (maxLatitude - minLatitude) * scale;
  const offsetX = (width - mapWidth) / 2;
  const offsetY = (height - mapHeight) / 2;

  return {
    width,
    height,
    project: ([longitude, latitude]: [number, number]) => ({
      x: offsetX + (longitude - minLongitude) * scale,
      y: offsetY + (maxLatitude - latitude) * scale,
    }),
  };
};

const coordinatesToPath = (
  coordinates: unknown,
  project: ReturnType<typeof createHenanProjection>["project"]
) => {
  if (!Array.isArray(coordinates)) {
    return "";
  }

  const rings =
    typeof coordinates?.[0]?.[0] === "number"
      ? [coordinates as [number, number][]]
      : (coordinates as unknown[]).flatMap((item) => {
          if (!Array.isArray(item)) {
            return [];
          }
          return typeof item?.[0]?.[0] === "number"
            ? [item as [number, number][]]
            : (item as [number, number][][]);
        });

  return rings
    .map((ring) =>
      ring
        .map((coordinate, index) => {
          const point = project(coordinate);
          return `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
        })
        .join(" ")
        .concat(" Z")
    )
    .join(" ");
};

const hexToRgb = (hex: string) => {
  const value = hex.replace("#", "");
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
};

const interpolateColor = (from: string, to: string, ratio: number) => {
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  const t = Math.max(0, Math.min(1, ratio));
  const channel = (a: number, b: number) =>
    Math.round(a + (b - a) * t).toString(16).padStart(2, "0");

  return `#${channel(start.r, end.r)}${channel(start.g, end.g)}${channel(
    start.b,
    end.b
  )}`;
};

const governanceFill = (city?: DemoCityState) => {
  if (!city || city.band === "neutral") {
    return "#dcefeb";
  }
  if (city.score < 70) {
    return interpolateColor("#efd4a5", "#e0ae83", (city.score - 50) / 20);
  }
  if (city.score < 84) {
    return interpolateColor("#cde8d2", "#74bf88", (city.score - 70) / 14);
  }

  return interpolateColor("#6fbd83", "#229f62", (city.score - 84) / 10);
};

const scoreBreakdownLabel = (city: DemoCityState) => {
  const parts = [
    city.scoreBreakdown.supply > 0
      ? `供给+${formatNumber(city.scoreBreakdown.supply, 1)}`
      : undefined,
    city.scoreBreakdown.trading > 0
      ? `流转+${formatNumber(city.scoreBreakdown.trading, 1)}`
      : undefined,
    city.scoreBreakdown.retirement > 0
      ? `注销+${formatNumber(city.scoreBreakdown.retirement, 1)}`
      : undefined,
    city.scoreBreakdown.unclosedDemandPenalty > 0
      ? `未闭环-${formatNumber(city.scoreBreakdown.unclosedDemandPenalty, 1)}`
      : undefined,
  ].filter(Boolean);

  return parts.length ? parts.join(" / ") : city.role;
};

const routePath = (
  from: ReturnType<ReturnType<typeof createHenanProjection>["project"]>,
  to: ReturnType<ReturnType<typeof createHenanProjection>["project"]>
) => {
  const midX = (from.x + to.x) / 2;
  const midY = Math.min(from.y, to.y) - 64;

  return `M${from.x.toFixed(1)} ${from.y.toFixed(1)} Q${midX.toFixed(1)} ${midY.toFixed(
    1
  )} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
};

const RegionalGovernanceMap = ({
  statuses,
  values,
  demoSnapshot,
  carouselTick,
  isDemoPlayback,
}: {
  statuses: Record<SectionKey, "real" | "fallback">;
  values: Record<SectionKey, string>;
  demoSnapshot: DemoSnapshot;
  carouselTick: number;
  isDemoPlayback: boolean;
}) => {
  const projection = useMemo(() => createHenanProjection(), []);
  const stateByCity = useMemo(
    () => new Map(demoSnapshot.cityStates.map((city) => [city.name, city])),
    [demoSnapshot.cityStates]
  );
  const regions = useMemo<ProjectedRegion[]>(
    () =>
      henanGeoJson.features.map((feature) => {
        const cityState = stateByCity.get(feature.properties.name);

        return {
          name: feature.properties.name,
          path: coordinatesToPath(feature.geometry.coordinates, projection.project),
          className: `cc-henan-map__region cc-henan-map__region--${
            cityState?.band ?? "neutral"
          }`,
          fill: governanceFill(cityState),
        };
      }),
    [projection, stateByCity]
  );
  const activeTradeFlow = useMemo(
    () => rotateRows(demoSnapshot.tradeFlows, 1, carouselTick)[0],
    [carouselTick, demoSnapshot.tradeFlows]
  );
  const activeRoute = useMemo(() => {
    if (!activeTradeFlow) {
      return undefined;
    }

    const seller = stateByCity.get(activeTradeFlow.sellerCity);
    const buyer = stateByCity.get(activeTradeFlow.buyerCity);

    if (!seller || !buyer) {
      return undefined;
    }

    const from = projection.project(seller.coordinate);
    const to = projection.project(buyer.coordinate);

    return {
      ...activeTradeFlow,
      from,
      to,
      path: routePath(from, to),
    };
  }, [activeTradeFlow, projection, stateByCity]);
  const markers = useMemo<MapMarker[]>(() => {
    const activeCities = demoSnapshot.cityStates
      .filter((city) => demoSnapshot.activeCities.includes(city.name))
      .sort((a, b) => {
        const activityA =
          a.projects +
          a.issuedCredits / 1000 +
          a.boughtCredits / 300 +
          a.soldCredits / 300 +
          a.retiredCredits / 150;
        const activityB =
          b.projects +
          b.issuedCredits / 1000 +
          b.boughtCredits / 300 +
          b.soldCredits / 300 +
          b.retiredCredits / 150;

        return activityB - activityA;
      });

    return rotateRows(activeCities, 5, carouselTick).map((city) => {
      const balanceValue = `${formatNumber(city.availableBalance)} 吨`;

      return {
        city: city.name,
        label: "期末余额",
        value: `${balanceValue} · ${formatNumber(city.score, 0)} 分`,
        scoreLabel: scoreBreakdownLabel(city),
        coordinate: city.coordinate,
        active: demoSnapshot.activeCities.includes(city.name),
        band: city.band,
      };
    });
  }, [carouselTick, demoSnapshot.activeCities, demoSnapshot.cityStates]);
  const isReal = Object.values(statuses).every((status) => status === "real");
  const mapSubtitle = isDemoPlayback
    ? `第 ${demoSnapshot.appliedCount}/50 条事实数据正在汇聚到省域视图`
    : `${demoSnapshot.activeCities.length} 个地市指标已汇聚到省域视图`;
  const latestDirection =
    demoSnapshot.latestEvent?.type === "TRADE" &&
    demoSnapshot.latestEvent.sellerCity &&
    demoSnapshot.latestEvent.buyerCity
      ? `${demoSnapshot.latestEvent.sellerCity} → ${demoSnapshot.latestEvent.buyerCity}`
      : demoSnapshot.latestEvent?.cityName;

  return (
    <div className="cc-regional-map">
      <div className="cc-regional-map__head">
        <div>
          <strong>河南省碳治理态势</strong>
          <span>{mapSubtitle}</span>
        </div>
        <b>{isDemoPlayback ? "演示回放" : isReal ? "实时汇总" : "待接入真实汇总"}</b>
      </div>
      <div className="cc-regional-map__stage">
        <svg
          className="cc-henan-map"
          viewBox={`0 0 ${projection.width} ${projection.height}`}
          role="img"
          aria-label="河南省碳治理业务数据汇总地图"
        >
          <defs>
            <linearGradient id="ccHenanRegion" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#dff2dc" />
              <stop offset="100%" stopColor="#8fcf9a" />
            </linearGradient>
            <filter id="ccHenanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g>
            {regions.map((region) => (
              <path
                key={region.name}
                className={region.className}
                d={region.path}
                style={{ fill: region.fill }}
              >
                <title>{region.name}</title>
              </path>
            ))}
          </g>
          {activeRoute && (
            <g className="cc-henan-map__trade-flow" aria-label="跨地市场外协议成交流向">
              <path className="cc-henan-map__trade-route-shadow" d={activeRoute.path} />
              <path className="cc-henan-map__trade-route" d={activeRoute.path} />
              <circle
                className="cc-henan-map__trade-terminal cc-henan-map__trade-terminal--from"
                cx={activeRoute.from.x}
                cy={activeRoute.from.y}
                r="5"
              />
              <circle
                className="cc-henan-map__trade-terminal cc-henan-map__trade-terminal--to"
                cx={activeRoute.to.x}
                cy={activeRoute.to.y}
                r="6"
              />
              {["0s", "-0.9s", "-1.8s", "-2.7s"].map((begin) => (
                <circle key={begin} className="cc-henan-map__trade-dot" r="3">
                  <animateMotion
                    begin={begin}
                    dur="3.6s"
                    path={activeRoute.path}
                    repeatCount="indefinite"
                  />
                </circle>
              ))}
            </g>
          )}
          <path
            className="cc-henan-map__outline"
            d={regions.map((region) => region.path).join(" ")}
          />
          {markers.map((marker) => {
            const point = projection.project(marker.coordinate);

            return (
              <g
                key={marker.city}
                className={`cc-henan-map__marker ${
                  marker.active ? "is-active" : "is-pending"
                } cc-henan-map__marker--${marker.band}`}
                transform={`translate(${point.x.toFixed(1)} ${point.y.toFixed(1)})`}
              >
                <circle r="20" />
                <circle r="7" />
              </g>
            );
          })}
        </svg>
        <div className="cc-regional-map__metrics">
          {markers.map((marker) => (
            <div key={marker.city} className={marker.active ? "is-active" : ""}>
              <span>{marker.city}</span>
              <strong>{marker.value}</strong>
              <small>{marker.scoreLabel ?? marker.label}</small>
            </div>
          ))}
        </div>
        {demoSnapshot.latestEvent && (
          <div className="cc-regional-map__pulse">
            <span>最新汇入</span>
            <strong>
              {latestDirection} ·{" "}
              {{
                REGISTER: "项目登记",
                ISSUE: "减排量签发",
                TRADE: "协议成交",
                RETIRE: "注销抵销",
              }[demoSnapshot.latestEvent.type]}
            </strong>
          </div>
        )}
        <div className="cc-regional-map__summary">
          <strong>{values.issuance}</strong>
          <span>累计减排量签发</span>
          <small>暖色=压力｜绿色=改善</small>
        </div>
      </div>
    </div>
  );
};

const ClassicAssetChain = ({
  statuses,
  values,
}: {
  statuses: Record<SectionKey, "real" | "fallback">;
  values: Record<SectionKey, string>;
}) => {
  return (
    <div className="cc-asset-chain cc-asset-chain--classic">
      <div className="cc-asset-chain__note">
        <Route size={16} />
        <strong>实时资产链路</strong>
        <span>账户 → 项目 → 签发 → 场外协议成交 → 注销</span>
      </div>
      <div className="cc-asset-chain__boundary">
        当前展示登记侧转移与已执行 OTC 成交 metadata 的关联展示；资金结算线下完成。
      </div>
      <div className="cc-asset-flow" role="img" aria-label="碳资产登记生命周期链路">
        {assetChainNodes.map((node, index) => {
          const isReal = statuses[node.key] === "real";

          return (
            <div
              key={node.key}
              className={`cc-asset-flow__step ${isReal ? "is-real" : "is-fallback"}`}
            >
              <div className="cc-asset-flow__index">{index + 1}</div>
              <div className="cc-asset-flow__content">
                <span>{node.note}</span>
                <strong>{values[node.key]}</strong>
                <b>{node.title}</b>
                <small>{node.subtitle}</small>
              </div>
              {index < assetChainNodes.length - 1 && (
                <div className="cc-asset-flow__connector" aria-hidden="true">
                  <span />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ImmersiveAssetChain = ({
  statuses,
  values,
}: {
  statuses: Record<SectionKey, "real" | "fallback">;
  values: Record<SectionKey, string>;
}) => (
  <div className="cc-asset-chain cc-asset-chain--immersive">
    <div className="cc-asset-chain__note cc-asset-chain__note--immersive">
      <Route size={16} />
      <strong>资产链路中枢</strong>
      <span>登记供给汇入 → 资产流转 → 注销沉淀</span>
    </div>
    <div className="cc-asset-chain__boundary">
      当前展示登记侧转移与已执行 OTC 成交 metadata 的关联展示；资金结算线下完成。
    </div>
    <div className="cc-asset-orbit" role="img" aria-label="碳资产从开户到注销的流动链路">
      <div className="cc-asset-orbit__rail" aria-hidden="true">
        <span />
        <i />
      </div>
      <svg
        className="cc-asset-orbit__beams"
        viewBox="0 0 1000 260"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M20 132 C170 42 300 42 460 132 S760 222 980 132" />
        <path d="M20 132 C190 222 320 222 500 132 S770 42 980 132" />
        <path d="M38 132 H962" />
      </svg>
      <div className="cc-asset-orbit__endpoint cc-asset-orbit__endpoint--in">
        <span>登记供给</span>
        <strong>左侧面板</strong>
      </div>
      <div className="cc-asset-orbit__endpoint cc-asset-orbit__endpoint--out">
        <span>交易/注销</span>
        <strong>右侧面板</strong>
      </div>
      <div className="cc-asset-orbit__nodes">
        {assetChainNodes.map((node, index) => {
          const isReal = statuses[node.key] === "real";

          return (
            <div
              key={node.key}
              className={`cc-asset-orbit__node cc-asset-orbit__node--${node.key} ${
                isReal ? "is-real" : "is-fallback"
              }`}
            >
              <div className="cc-asset-orbit__marker">{index + 1}</div>
              <div className="cc-asset-orbit__card">
                <span>{node.note}</span>
                <strong>{values[node.key]}</strong>
                <b>{node.title}</b>
                <small>{node.subtitle}</small>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

const AssetChain = ({
  statuses,
  values,
  demoSnapshot,
  carouselTick,
  isDemoPlayback,
}: {
  statuses: Record<SectionKey, "real" | "fallback">;
  values: Record<SectionKey, string>;
  demoSnapshot: DemoSnapshot;
  carouselTick: number;
  isDemoPlayback: boolean;
}) =>
  assetChainVariant === "immersive" ? (
    <RegionalGovernanceMap
      statuses={statuses}
      values={values}
      demoSnapshot={demoSnapshot}
      carouselTick={carouselTick}
      isDemoPlayback={isDemoPlayback}
    />
  ) : (
    <ClassicAssetChain statuses={statuses} values={values} />
  );

const CarbonTradingCommandCenter = () => {
  const [clock, setClock] = useState(() => new Date());
  const [dashboardSummary, setDashboardSummary] =
    useState<RegionalDashboardSummary>();
  const [regionalApiStatus, setRegionalApiStatus] = useState<
    "loading" | "connected" | "unavailable"
  >("loading");
  const [demoShellStatus, setDemoShellStatus] = useState<
    "loading" | "connected" | "fallback"
  >("loading");
  const [demoSession, setDemoSession] = useState<DemoSession>(fallbackDemoSession);
  const [demoIndicators, setDemoIndicators] =
    useState<DemoRegionIndicator[]>(fallbackDemoIndicators);
  const [selectedDemoIndicator, setSelectedDemoIndicator] =
    useState<DemoRegionIndicator>(fallbackDemoIndicators[0]);
  const [demoSource, setDemoSource] =
    useState<DemoIndicatorSource>(fallbackDemoIndicators[0]);
  const [demoProgress, setDemoProgress] = useState(demoEvents.length);
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);
  const [carouselTick, setCarouselTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchRegionalDashboardSummary()
      .then((summary) => {
        if (!cancelled) {
          setDashboardSummary(summary);
          setRegionalApiStatus("connected");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDashboardSummary(undefined);
          setRegionalApiStatus("unavailable");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([loginRegionalDemo("gov_demo"), fetchRegionalDemoIndicators()])
      .then(([session, indicators]) => {
        if (cancelled) {
          return;
        }

        const verifiedIndicators = indicators.items.length
          ? indicators.items
          : fallbackDemoIndicators;
        setDemoSession(session);
        setDemoIndicators(verifiedIndicators);
        setSelectedDemoIndicator(verifiedIndicators[0]);
        setDemoSource(verifiedIndicators[0]);
        setDemoShellStatus("connected");
      })
      .catch(() => {
        if (!cancelled) {
          setDemoSession(fallbackDemoSession);
          setDemoIndicators(fallbackDemoIndicators);
          setSelectedDemoIndicator(fallbackDemoIndicators[0]);
          setDemoSource(fallbackDemoIndicators[0]);
          setDemoShellStatus("fallback");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isDemoPlaying || demoProgress >= demoEvents.length) {
      return undefined;
    }

    const timer = window.setTimeout(
      () => setDemoProgress((current) => Math.min(current + 1, demoEvents.length)),
      demoProgress < 5 ? 1300 : 760
    );

    return () => window.clearTimeout(timer);
  }, [demoProgress, isDemoPlaying]);

  useEffect(() => {
    if (demoProgress >= demoEvents.length && isDemoPlaying) {
      setIsDemoPlaying(false);
    }
  }, [demoProgress, isDemoPlaying]);

  useEffect(() => {
    const timer = window.setInterval(() => setCarouselTick((current) => current + 1), 4200);
    return () => window.clearInterval(timer);
  }, []);

  const hasRealRegionalProjection = dashboardSummary?.dataStatus === "real";
  const regionalDataMode = hasRealRegionalProjection
    ? "real"
    : regionalApiStatus === "unavailable"
      ? "unavailable"
      : regionalApiStatus === "loading"
        ? "loading"
        : "fallback";
  const regionalDataModeLabel = {
    real: "实时数据",
    fallback: "演示/空状态",
    loading: "连接中",
    unavailable: "服务不可用",
  }[regionalDataMode];

  const metrics = hasRealRegionalProjection ? dashboardSummary?.metrics : undefined;
  const demoSnapshot = useMemo(() => buildDemoSnapshot(demoProgress), [demoProgress]);
  const regionalSnapshot = useMemo(
    () =>
      buildRegionalSnapshot(
        dashboardSummary?.regionalMetrics,
        dashboardSummary?.recentTrades
      ),
    [dashboardSummary?.recentTrades, dashboardSummary?.regionalMetrics]
  );
  const isPlaybackActive = isDemoPlaying || demoProgress < demoEvents.length;
  const useDemoPlayback =
    isPlaybackActive || !hasRealRegionalProjection || !regionalSnapshot;
  const mapSnapshot =
    !useDemoPlayback && regionalSnapshot ? regionalSnapshot : demoSnapshot;
  const sectionStatuses = useMemo(
    () =>
      (Object.keys(sectionLabels) as SectionKey[]).reduce(
        (current, key) => ({
          ...current,
          [key]: getSectionStatus(dashboardSummary, key, hasRealRegionalProjection),
        }),
        {} as Record<SectionKey, "real" | "fallback">
      ),
    [dashboardSummary, hasRealRegionalProjection]
  );
  const realSectionCount = Object.values(sectionStatuses).filter(
    (status) => status === "real"
  ).length;
  const sectionCoverage = `五类数据中 ${realSectionCount} 类已实时接入`;

  const visibleProjectRows = useMemo(
    () => {
      const rows = useDemoPlayback
        ? demoSnapshot.recentProjects
        : toProjectRows(
            hasRealRegionalProjection
              ? dashboardSummary?.recentProjectRegistrations
              : undefined
          );

      return rotateRows(rows, 5, carouselTick);
    },
    [
      carouselTick,
      dashboardSummary,
      demoSnapshot.recentProjects,
      hasRealRegionalProjection,
      useDemoPlayback,
    ]
  );

  const visibleTradeRows = useMemo(
    () => {
      const rows = useDemoPlayback
        ? demoSnapshot.recentTrades
        : toTradeRows(
            hasRealRegionalProjection ? dashboardSummary?.recentTrades : undefined
          );

      return rotateRows(rows, 3, carouselTick);
    },
    [
      carouselTick,
      dashboardSummary,
      demoSnapshot.recentTrades,
      hasRealRegionalProjection,
      useDemoPlayback,
    ]
  );

  const visibleAccountTypes = useMemo(
    () =>
      useDemoPlayback
        ? toDemoAccountTypes(demoSnapshot)
        : toAccountTypes(
            hasRealRegionalProjection ? dashboardSummary?.accountSummary : undefined
          ),
    [dashboardSummary, demoSnapshot, hasRealRegionalProjection, useDemoPlayback]
  );

  const totalAccountsValue =
    useDemoPlayback
      ? `${formatNumber(demoSnapshot.accounts) ?? "0"} 家`
      : hasRealRegionalProjection && dashboardSummary?.accountSummary
      ? `${formatNumber(dashboardSummary.accountSummary.totalAccounts) ?? "0"} 家`
      : "等待真实开户数据";
  const activeProjectsValue = `${
    formatNumber(useDemoPlayback ? demoSnapshot.projects : metrics?.activeProjectCount) ??
    "等待"
  } 个`;
  const issuedCreditsValue = `${
    formatNumber(useDemoPlayback ? demoSnapshot.issuedCredits : metrics?.totalIssuedCredits) ??
    "等待"
  } 吨`;
  const transferVolumeValue = `${
    formatNumber(useDemoPlayback ? demoSnapshot.tradeVolume : metrics?.transferVolume) ??
    "等待"
  } 吨`;
  const retiredCreditsValue = `${
    formatNumber(useDemoPlayback ? demoSnapshot.retiredCredits : metrics?.retiredCredits) ??
    "等待"
  } 吨`;
  const otcTradeValue =
    formatCnyWan(useDemoPlayback ? demoSnapshot.tradeValue : metrics?.otcTradeValue) ??
    "等待真实成交额";
  const averageOtcPriceValue = `${
    formatNumber(
      useDemoPlayback && demoSnapshot.tradeVolume
        ? demoSnapshot.tradeValue / demoSnapshot.tradeVolume
        : metrics?.averageOtcPrice,
      2
    ) ?? "等待"
  } 元/吨`;
  const retirementShare =
    formatPercent(
      useDemoPlayback ? demoSnapshot.retiredCredits : metrics?.retiredCredits,
      useDemoPlayback ? demoSnapshot.issuedCredits : metrics?.totalIssuedCredits
    ) ?? "等待";
  const transferShare =
    formatPercent(
      useDemoPlayback ? demoSnapshot.tradeVolume : metrics?.transferVolume,
      useDemoPlayback ? demoSnapshot.issuedCredits : metrics?.totalIssuedCredits
    ) ?? "等待";
  const tradeCountValue = `${
    formatNumber(useDemoPlayback ? demoSnapshot.tradeCount : metrics?.otcTradeCount) ??
    "等待"
  } 笔`;
  const leadingCities = mapSnapshot.cityStates
    .filter((city) => city.band === "leading")
    .map((city) => city.name)
    .slice(0, 3)
    .join("、");
  const pressureCities = mapSnapshot.cityStates
    .filter((city) => city.band === "pressure")
    .map((city) => city.name)
    .slice(0, 3)
    .join("、");

  const chainValues: Record<SectionKey, string> = {
    accounts: totalAccountsValue,
    projects: activeProjectsValue,
    issuance: issuedCreditsValue,
    trades: transferVolumeValue,
    retirements: retiredCreditsValue,
  };

  const projectionErrors = dashboardSummary?.projectionErrors ?? [];
  const demoRoleLabel =
    demoRoles.find((item) => item.role === demoSession.user.role)?.label ?? "政府";
  const demoShellStatusLabel = {
    loading: "会话连接中",
    connected: "演示会话已连接",
    fallback: "本地演示数据",
  }[demoShellStatus];
  const handleDemoRoleSwitch = async (role: DemoRole) => {
    const roleConfig = demoRoles.find((item) => item.role === role) ?? demoRoles[0];

    try {
      const nextSession = await switchRegionalDemoRole(demoSession.sessionId, role);
      setDemoSession(nextSession);
      setDemoShellStatus("connected");
    } catch {
      setDemoSession({
        sessionId: `demo-session-${role.toLowerCase()}`,
        user: {
          id: `demo-user-${role.toLowerCase()}`,
          account: roleConfig.account,
          role,
          organizationId: `demo-org-${role.toLowerCase()}`,
          organizationName: `${roleConfig.label}演示工作台`,
        },
      });
      setDemoShellStatus("fallback");
    }
  };
  const handleDemoSourceSelect = async (indicator: DemoRegionIndicator) => {
    setSelectedDemoIndicator(indicator);
    setDemoSource(indicator);

    try {
      const source = await fetchRegionalDemoIndicatorSource(indicator.id);
      setDemoSource(source);
      setDemoShellStatus("connected");
    } catch {
      setDemoSource(indicator);
      setDemoShellStatus((current) => (current === "connected" ? current : "fallback"));
    }
  };
  const demoIndicatorCards = demoIndicators.slice(0, 4);

  return (
    <main className="carbon-command-center">
      <div className="cc-shell">
        <header className="cc-header">
          <div>
            <span className={`cc-data-mode cc-data-mode--${regionalDataMode}`}>
              {regionalDataModeLabel}
            </span>
            <h1>区域碳资产监管运营终端</h1>
            <p>登记簿生命周期与已执行 OTC 成交 metadata 关联展示；资金结算线下完成，不展示撮合、盘口、平台清算或银行结算能力</p>
          </div>
          <div className="cc-header__tools">
            <div className="cc-demo-control" aria-label="动态演示控制">
              <span>{getDemoStageLabel(demoProgress)}</span>
              <strong>{demoProgress}/50 条</strong>
              <button
                type="button"
                onClick={() => {
                  if (!isDemoPlaying && demoProgress >= demoEvents.length) {
                    setDemoProgress(0);
                    setIsDemoPlaying(true);
                    return;
                  }
                  setIsDemoPlaying((current) => !current);
                }}
              >
                {isDemoPlaying ? <Pause size={14} /> : <Play size={14} />}
                {isDemoPlaying ? "暂停" : "播放"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDemoProgress(0);
                  setIsDemoPlaying(true);
                }}
              >
                重播
              </button>
            </div>
            <time>{formatClock(clock)}</time>
          </div>
        </header>

        <section className="cc-demo-briefing" aria-label="Phase 1 区域市场演示驾驶舱">
          <div className="cc-demo-briefing__rail">
            <div>
              <span className="cc-demo-briefing__eyebrow">Phase 1 Role Shell</span>
              <h2>S12 真实公开指标驾驶舱</h2>
              <p>
                当前角色：{demoRoleLabel} · {demoSession.user.organizationName} ·{" "}
                {demoShellStatusLabel}
              </p>
            </div>
            <div className="cc-demo-roles" aria-label="演示角色切换">
              {demoRoles.map((item) => (
                <button
                  key={item.role}
                  type="button"
                  className={demoSession.user.role === item.role ? "is-active" : ""}
                  onClick={() => void handleDemoRoleSwitch(item.role)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="cc-demo-briefing__body">
            <div className="cc-demo-indicators" aria-label="S12 verified indicators">
              {demoIndicatorCards.map((indicator) => (
                <button
                  key={indicator.id}
                  type="button"
                  className={
                    selectedDemoIndicator.id === indicator.id ? "is-selected" : ""
                  }
                  onClick={() => void handleDemoSourceSelect(indicator)}
                >
                  <span>{indicator.regionName}</span>
                  <strong>
                    {formatNumber(indicator.value, indicator.value % 1 === 0 ? 0 : 2)}
                    {indicator.unit}
                  </strong>
                  <b>{indicator.indicatorName}</b>
                  <small>已核验公开来源 · {indicator.period}</small>
                </button>
              ))}
            </div>

            <div className="cc-demo-source" aria-label="来源明细">
              <div>
                <span>来源明细</span>
                <strong>{demoSource.sourceLabel}</strong>
                <small>{demoSource.caliber}</small>
              </div>
              <a href={demoSource.sourceUrl} target="_blank" rel="noreferrer">
                <FileText size={14} />
                查看公开来源
              </a>
            </div>

            <div className="cc-demo-prototypes" aria-label="S8 S10 prototype placeholders">
              <div>
                <span>S8</span>
                <strong>模拟运营信号</strong>
                <small>演示数据 · 模拟成交状态凭证 · 不触发生产交易流程</small>
              </div>
              <div>
                <span>S8</span>
                <strong>演示合同预览</strong>
                <small>仅用于流程说明，不构成法律文件</small>
              </div>
              <div>
                <span>S10</span>
                <strong>融资测算</strong>
                <small>质押意向申请 · 模拟审批结果 · 不涉及实际出款</small>
              </div>
            </div>
          </div>
        </section>

        <div className="cc-grid">
          <div className="cc-column">
            <Panel
              title="资产登记与供给概览"
              eyebrow={<StatusPill status={sectionStatuses.accounts} label="开户数据" />}
            >
              <div className="cc-kpi-grid">
                <KpiTile
                  label="开户主体"
                  value={totalAccountsValue}
                  source="账户汇总"
                  status={sectionStatuses.accounts}
                />
                <KpiTile
                  label="注册项目"
                  value={activeProjectsValue}
                  source="项目汇总"
                  status={sectionStatuses.projects}
                />
                <KpiTile
                  label="已签发减排量"
                  value={issuedCreditsValue}
                  source="签发汇总"
                  status={sectionStatuses.issuance}
                />
                <KpiTile
                  label="已注销/抵销"
                  value={retiredCreditsValue}
                  source="注销汇总"
                  status={sectionStatuses.retirements}
                />
              </div>

              <div className="cc-account-types">
                {visibleAccountTypes.map((item) => (
                  <div key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel
              title="最近项目登记"
              className="cc-panel--compact-table"
              eyebrow={<StatusPill status={sectionStatuses.projects} label="项目数据" />}
            >
              <table className="cc-table cc-table--projects">
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>项目/业主</th>
                    <th>方法学</th>
                    <th>登记数量</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProjectRows.length ? (
                    visibleProjectRows.map((project) => (
                      <tr key={project.id}>
                        <td>{project.id}</td>
                        <td>
                          <strong className="cc-table-main">{project.name}</strong>
                          <small className="cc-table-sub">{project.owner}</small>
                        </td>
                        <td>{project.method}</td>
                        <td>{project.credits}</td>
                      </tr>
                    ))
                  ) : (
                    <EmptyTableRow colSpan={4} label="等待项目登记事实数据汇入" />
                  )}
                </tbody>
              </table>
            </Panel>
          </div>

          <div className="cc-column cc-column--center">
            <Panel
              title="河南省治理态势"
              className="cc-panel--asset-chain"
              eyebrow={<StatusPill status={sectionStatuses.issuance} label="省域数据" />}
            >
              <AssetChain
                statuses={sectionStatuses}
                values={chainValues}
                demoSnapshot={mapSnapshot}
                carouselTick={carouselTick}
                isDemoPlayback={useDemoPlayback}
              />
            </Panel>

            <Panel title="智能研判摘要" className="cc-panel--ai">
              <div className="cc-ai-grid">
                <div>
                  <ShieldCheck size={18} />
                  <strong>当前态势</strong>
                  <span>
	                    已汇聚 {useDemoPlayback ? `${demoSnapshot.appliedCount}/50 条事实数据` : `${mapSnapshot.activeCities.length} 个城市指标`}；压力区{" "}
                    {pressureCities || "暂无"}，改善领先区 {leadingCities || "暂无"}。
                  </span>
                </div>
                <div>
                  <Database size={18} />
                  <strong>成交口径</strong>
                  <span>
                    成交量 {transferVolumeValue}，成交额 {otcTradeValue}，加权均价 {averageOtcPriceValue}。
                  </span>
                </div>
                <div>
                  <Leaf size={18} />
                  <strong>注销影响</strong>
                  <span>
                    已注销占累计签发 {retirementShare}；场外协议成交占签发 {transferShare}。
                  </span>
                </div>
                <div className="cc-ai-grid__warning">
                  <MessageSquareWarning size={18} />
                  <strong>示例说明</strong>
                  <span>当前子系统只展示登记簿和已执行场外协议成交数据，未接入订单簿、买卖盘、撮合状态、平台清算或银行结算数据。</span>
                </div>
              </div>
            </Panel>
          </div>

          <div className="cc-column">
            <Panel
              title="场外协议成交与注销"
              eyebrow={<StatusPill status={sectionStatuses.trades} label="成交数据" />}
            >
              <div className="cc-otc-grid">
                <KpiTile
                  label="成交笔数"
                  value={tradeCountValue}
                  source="成交汇总"
                  status={sectionStatuses.trades}
                />
                <KpiTile
                  label="成交金额"
                  value={otcTradeValue}
                  source="成交金额汇总"
                  status={sectionStatuses.trades}
                />
                <KpiTile
                  label="加权均价"
                  value={averageOtcPriceValue}
                  source="成交均价"
                  status={sectionStatuses.trades}
                />
                <KpiTile
                  label="注销比例"
                  value={retirementShare}
                  source="注销量与签发量"
                  status={sectionStatuses.retirements}
                />
              </div>
            </Panel>

            <Panel
              title="最近场外协议成交信息"
              className="cc-panel--compact-table"
              eyebrow={<StatusPill status={sectionStatuses.trades} label="成交明细" />}
            >
              <table className="cc-table cc-table--trades">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>交易主体</th>
                    <th>成交量</th>
                    <th>总额</th>
                    <th>均价</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTradeRows.length ? (
                    visibleTradeRows.map((trade, index) => (
                      <tr key={`${trade.date}-${trade.volume}-${index}`}>
                        <td>{trade.date}</td>
                        <td>
                          <strong className="cc-table-main">
                            {trade.counterparty ?? "卖方 → 买方"}
                          </strong>
                          <small className="cc-table-sub">{trade.sector}</small>
                        </td>
                        <td>{trade.volume}</td>
                        <td>{trade.amount}</td>
                        <td>{trade.average}</td>
                      </tr>
                    ))
                  ) : (
                    <EmptyTableRow colSpan={5} label="等待场外协议成交事实数据汇入" />
                  )}
                </tbody>
              </table>
            </Panel>

            <Panel title="静态监管提示" className="cc-panel--notice">
              <div className="cc-notice-list">
                <div>
                  <AlertTriangle size={16} />
                  监管预警当前未实现动态规则，保持静态说明。
                </div>
                <div>
                  <Activity size={16} />
                  区域指标与地图交互为后续设计，当前不作为真实判断依据。
                </div>
              </div>
            </Panel>
          </div>
        </div>

        <footer className="cc-evidence-strip">
          <div>
            <FileText size={16} />
            <strong>数据质量</strong>
            <span>
              数据状态：{hasRealRegionalProjection ? "实时接入" : "演示占位"}；
              演示进度：{demoSnapshot.appliedCount}/50 条；
              接入范围：{sectionCoverage}；
              投影服务：{dashboardSummary?.projectionAvailable ? "可用" : "未接入"}
            </span>
          </div>
          <div className="cc-section-statuses">
            {(Object.keys(sectionLabels) as SectionKey[]).map((key) => (
              <span
                key={key}
                className={`cc-section-status cc-section-status--${sectionStatuses[key]}`}
              >
                {sectionLabels[key]} · {sectionStatuses[key] === "real" ? "实时" : "待接入"}
              </span>
            ))}
          </div>
          <div className="cc-boundary-tags">
            <span>展示边界：登记簿生命周期</span>
            <span>交易口径：已执行场外协议</span>
            <span>资金：线下结算</span>
            <span>不含：盘口/撮合/清算</span>
          </div>
          {projectionErrors.length > 0 && (
            <div className="cc-projection-errors">
              {projectionErrors.slice(0, 2).join("；")}
            </div>
          )}
        </footer>
      </div>
    </main>
  );
};

export default CarbonTradingCommandCenter;
