import { useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  Feature,
  FeatureCollection,
  Geometry,
  MultiPolygon,
  Polygon,
  Position,
} from "geojson";
import {
  Activity,
  ArrowUpRight,
  Database,
  Factory,
  Layers,
  Leaf,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import rawChinaGeoJson from "china-map-geojson/lib/china";
import "./commandCenter.scss";

type AccountType = {
  label: string;
  value: string;
};

type ProjectRow = {
  id: number;
  name: string;
  owner: string;
  method: string;
  credits: string;
};

type TradeRow = {
  date: string;
  volume: string;
  amount: string;
  average: string;
  sector: string;
};

type MapPoint = {
  city: string;
  province: string;
  coordinate: [number, number];
  volume: string;
};

type MarkerPoint = MapPoint & {
  position: ProjectedPoint;
  labelOffset: {
    x: number;
    y: number;
    align: "start" | "end";
  };
};

type ChinaFeatureProperties = {
  name: string;
  cp?: [number, number];
};

type ProjectedPoint = {
  x: number;
  y: number;
};

type ProjectedProvince = {
  name: string;
  path: string;
  label?: ProjectedPoint;
  active: boolean;
};

const accountTypes: AccountType[] = [
  { label: "重点排放单位", value: "1,430 家" },
  { label: "地方重点排放单位", value: "48 家" },
  { label: "项目业主", value: "172 家" },
  { label: "核证与交易主体", value: "1,688 家" },
];

const projectRows: ProjectRow[] = [
  {
    id: 11,
    name: "海上风电场减排项目",
    owner: "瓯海有限公司",
    method: "海上风力发电",
    credits: "2,524,717",
  },
  {
    id: 12,
    name: "林业碳汇造林项目",
    owner: "绿源生态发展有限公司",
    method: "造林碳汇",
    credits: "1,276,244",
  },
  {
    id: 13,
    name: "300MW 风电项目",
    owner: "苏交控新能源有限公司",
    method: "并网风电",
    credits: "1,087,010",
  },
  {
    id: 14,
    name: "50MW 渔光互补项目",
    owner: "青海水务新能源公司",
    method: "光伏发电",
    credits: "136,354",
  },
  {
    id: 15,
    name: "工业余热回收项目",
    owner: "中能环保科技有限公司",
    method: "余热利用",
    credits: "59,722",
  },
  {
    id: 16,
    name: "分布式光伏减排项目",
    owner: "华东绿电资产公司",
    method: "屋顶光伏",
    credits: "472,908",
  },
  {
    id: 17,
    name: "生物质热电联产项目",
    owner: "丰源生物能源公司",
    method: "生物质发电",
    credits: "318,660",
  },
  {
    id: 18,
    name: "甲烷回收利用项目",
    owner: "北方清洁能源公司",
    method: "甲烷回收",
    credits: "286,431",
  },
  {
    id: 19,
    name: "公共建筑节能改造项目",
    owner: "城市绿色运营集团",
    method: "节能改造",
    credits: "198,204",
  },
  {
    id: 20,
    name: "农林废弃物综合利用项目",
    owner: "田园循环科技公司",
    method: "生物质利用",
    credits: "164,820",
  },
  {
    id: 21,
    name: "绿色交通替代项目",
    owner: "城际低碳交通公司",
    method: "交通替代",
    credits: "142,618",
  },
  {
    id: 22,
    name: "海岛风光储一体化项目",
    owner: "南海新能源投资公司",
    method: "风光储发电",
    credits: "88,506",
  },
];

const tradeRows: TradeRow[] = [
  {
    date: "2026-06-10",
    volume: "48,500",
    amount: "4,177,850.00",
    average: "86.14",
    sector: "能源产业",
  },
  {
    date: "2026-06-09",
    volume: "132,000",
    amount: "11,418,000.00",
    average: "86.50",
    sector: "可再生能源",
  },
  {
    date: "2026-06-08",
    volume: "8,400",
    amount: "720,300.00",
    average: "85.75",
    sector: "林业碳汇",
  },
  {
    date: "2026-06-05",
    volume: "25,000",
    amount: "2,137,500.00",
    average: "85.50",
    sector: "节能改造",
  },
  {
    date: "2026-06-04",
    volume: "150,000",
    amount: "12,600,000.00",
    average: "84.00",
    sector: "可再生能源",
  },
  {
    date: "2026-06-03",
    volume: "10,401",
    amount: "894,183.00",
    average: "85.97",
    sector: "能源产业",
  },
  {
    date: "2026-06-02",
    volume: "37,600",
    amount: "3,205,760.00",
    average: "85.26",
    sector: "节能改造",
  },
  {
    date: "2026-06-01",
    volume: "92,000",
    amount: "7,820,000.00",
    average: "85.00",
    sector: "可再生能源",
  },
  {
    date: "2026-05-29",
    volume: "16,850",
    amount: "1,431,913.00",
    average: "84.98",
    sector: "林业碳汇",
  },
  {
    date: "2026-05-28",
    volume: "61,200",
    amount: "5,226,480.00",
    average: "85.40",
    sector: "能源产业",
  },
  {
    date: "2026-05-27",
    volume: "43,000",
    amount: "3,638,660.00",
    average: "84.62",
    sector: "生物质利用",
  },
  {
    date: "2026-05-26",
    volume: "12,300",
    amount: "1,040,580.00",
    average: "84.60",
    sector: "交通替代",
  },
  {
    date: "2026-05-25",
    volume: "72,400",
    amount: "6,190,200.00",
    average: "85.50",
    sector: "可再生能源",
  },
];

const mapPoints: MapPoint[] = [
  { city: "北京", province: "北京", coordinate: [116.4074, 39.9042], volume: "38.2 万吨" },
  { city: "上海", province: "上海", coordinate: [121.4737, 31.2304], volume: "27.6 万吨" },
  { city: "广州", province: "广东", coordinate: [113.2644, 23.1291], volume: "21.4 万吨" },
  { city: "成都", province: "四川", coordinate: [104.0668, 30.5728], volume: "18.9 万吨" },
  { city: "西安", province: "陕西", coordinate: [108.9398, 34.3416], volume: "14.1 万吨" },
  { city: "呼和浩特", province: "内蒙古", coordinate: [111.7492, 40.8426], volume: "9.8 万吨" },
  { city: "乌鲁木齐", province: "新疆", coordinate: [87.6168, 43.8256], volume: "6.3 万吨" },
  { city: "海口", province: "海南", coordinate: [110.3312, 20.031], volume: "4.2 万吨" },
];

const markerLabelOffsets: Record<
  string,
  MarkerPoint["labelOffset"]
> = {
  北京: { x: 13, y: -11, align: "start" },
  上海: { x: 14, y: -6, align: "start" },
  广州: { x: 12, y: -5, align: "start" },
  成都: { x: 12, y: -7, align: "start" },
  西安: { x: 12, y: -12, align: "start" },
  呼和浩特: { x: -14, y: -15, align: "end" },
  乌鲁木齐: { x: 12, y: -8, align: "start" },
  海口: { x: 13, y: 4, align: "start" },
};

const monthlyBars = [
  { month: "2025-08", volume: 18, amount: 12, price: 72 },
  { month: "2025-09", volume: 36, amount: 24, price: 75 },
  { month: "2025-10", volume: 58, amount: 46, price: 81 },
  { month: "2025-11", volume: 34, amount: 30, price: 79 },
  { month: "2025-12", volume: 92, amount: 88, price: 85 },
  { month: "2026-01", volume: 74, amount: 70, price: 84 },
  { month: "2026-02", volume: 28, amount: 26, price: 83 },
  { month: "2026-03", volume: 42, amount: 39, price: 84 },
  { month: "2026-04", volume: 50, amount: 48, price: 86 },
  { month: "2026-05", volume: 66, amount: 60, price: 85 },
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

const chinaGeoJson = rawChinaGeoJson as FeatureCollection<
  Geometry,
  ChinaFeatureProperties
>;

const flattenPositions = (geometry: Geometry): Position[] => {
  if (geometry.type === "Polygon") {
    return (geometry as Polygon).coordinates.flat();
  }

  if (geometry.type === "MultiPolygon") {
    return (geometry as MultiPolygon).coordinates.flat(2);
  }

  return [];
};

const createMapProjection = (
  features: Feature<Geometry, ChinaFeatureProperties>[]
) => {
  const positions = features.flatMap((feature) =>
    flattenPositions(feature.geometry)
  );
  const bounds = positions.reduce(
    (current, [longitude, latitude]) => ({
      minLon: Math.min(current.minLon, longitude),
      maxLon: Math.max(current.maxLon, longitude),
      minLat: Math.min(current.minLat, latitude),
      maxLat: Math.max(current.maxLat, latitude),
    }),
    {
      minLon: Number.POSITIVE_INFINITY,
      maxLon: Number.NEGATIVE_INFINITY,
      minLat: Number.POSITIVE_INFINITY,
      maxLat: Number.NEGATIVE_INFINITY,
    }
  );
  const { minLon, maxLon, minLat, maxLat } = bounds;
  const width = 774;
  const height = 569;
  const padding = 74;
  const scale = Math.min(
    (width - padding * 2) / (maxLon - minLon),
    (height - padding * 2) / (maxLat - minLat)
  );
  const mapWidth = (maxLon - minLon) * scale;
  const mapHeight = (maxLat - minLat) * scale;
  const offsetX = (width - mapWidth) / 2;
  const offsetY = (height - mapHeight) / 2;

  return ([longitude, latitude]: Position): ProjectedPoint => ({
    x: offsetX + (longitude - minLon) * scale,
    y: offsetY + (maxLat - latitude) * scale,
  });
};

const toPolygonPath = (
  coordinates: Polygon["coordinates"],
  project: (position: Position) => ProjectedPoint
) =>
  coordinates
    .map((ring) =>
      ring
        .map((position, index) => {
          const point = project(position);
          return `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`;
        })
        .join(" ")
        .concat(" Z")
    )
    .join(" ");

const toGeometryPath = (
  geometry: Geometry,
  project: (position: Position) => ProjectedPoint
) => {
  if (geometry.type === "Polygon") {
    return toPolygonPath((geometry as Polygon).coordinates, project);
  }

  if (geometry.type === "MultiPolygon") {
    return (geometry as MultiPolygon).coordinates
      .map((polygon) => toPolygonPath(polygon, project))
      .join(" ");
  }

  return "";
};

const Metric = ({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string;
  label: string;
}) => (
  <div className="cc-metric">
    <div className="cc-metric__icon">{icon}</div>
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  </div>
);

const Panel = ({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) => (
  <section className={`cc-panel ${className}`}>
    <div className="cc-panel__title">{title}</div>
    {children}
  </section>
);

const ChinaTradingMap = ({ points }: { points: MapPoint[] }) => {
  const { provinces, markerPoints } = useMemo(() => {
    const activeProvinces = new Set(points.map((point) => point.province));
    const project = createMapProjection(chinaGeoJson.features);
    const provinces: ProjectedProvince[] = chinaGeoJson.features.map(
      (feature) => ({
        name: feature.properties.name,
        path: toGeometryPath(feature.geometry, project),
        label: feature.properties.cp ? project(feature.properties.cp) : undefined,
        active: activeProvinces.has(feature.properties.name),
      })
    );
    const markerPoints: MarkerPoint[] = points.map((point) => ({
      ...point,
      position: project(point.coordinate),
      labelOffset:
        markerLabelOffsets[point.city] ?? { x: 13, y: -8, align: "start" },
    }));

    return { provinces, markerPoints };
  }, [points]);

  return (
    <svg
      className="cc-china-map"
      viewBox="0 0 774 569"
      role="img"
      aria-label="中国省级交易分布地图"
    >
      <defs>
        <filter id="cc-map-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g className="cc-china-map__provinces">
        {provinces.map((province) => (
          <path
            key={province.name}
            className={
              province.active
                ? "cc-china-map__province cc-china-map__province--active"
                : "cc-china-map__province"
            }
            d={province.path}
          >
            <title>{province.name}</title>
          </path>
        ))}
      </g>
      <g className="cc-china-map__labels">
        {markerPoints.map((point) => (
          <g
            key={point.city}
            className="cc-china-map__marker"
            transform={`translate(${point.position.x}, ${point.position.y})`}
          >
            <path d="M0,-10 C-5.4,-10 -9,-6.2 -9,-1.2 C-9,5.8 0,12 0,12 C0,12 9,5.8 9,-1.2 C9,-6.2 5.4,-10 0,-10 Z" />
            <circle r="2.8" cy="-1.2" />
            <text
              x={point.labelOffset.x}
              y={point.labelOffset.y}
              textAnchor={point.labelOffset.align}
            >
              {point.city}
            </text>
            <text
              x={point.labelOffset.x}
              y={point.labelOffset.y + 15}
              textAnchor={point.labelOffset.align}
              className="cc-china-map__volume"
            >
              {point.volume}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
};

const CarbonTradingCommandCenter = () => {
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const daySummary = useMemo(
    () => [
      { label: "成交量", value: "48,500 吨" },
      { label: "成交额", value: "417.79 万元" },
      { label: "成交均价", value: "86.14 元/吨" },
    ],
    []
  );

  return (
    <main className="carbon-command-center">
      <div className="cc-shell">
        <header className="cc-header">
          <div className="cc-header__line" />
          <h1>区域温室气体自愿减排交易数据平台</h1>
          <time>{formatClock(clock)}</time>
        </header>

        <div className="cc-grid">
          <div className="cc-column cc-column--left">
            <Panel title="开户情况">
              <div className="cc-account">
                <div className="cc-account__total">
                  <Users size={42} />
                  <span>开户总数</span>
                  <strong>3,338 家</strong>
                </div>
                <div className="cc-account__list">
                  {accountTypes.map((item) => (
                    <div key={item.label}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel title="减排量登记情况" className="cc-panel--table">
              <div className="cc-table-frame cc-table-frame--projects">
                <table className="cc-table cc-table--head">
                  <thead>
                    <tr>
                      <th>序号</th>
                      <th>项目名称</th>
                      <th>项目业主名称</th>
                      <th>方法学</th>
                      <th>登记数量</th>
                    </tr>
                  </thead>
                </table>
                <div className="cc-table-scroll">
                  <table className="cc-table cc-table--body">
                    <tbody className="cc-table__rolling cc-table__rolling--slow">
                      {[...projectRows, ...projectRows].map((project, index) => (
                        <tr key={`${project.id}-${index}`}>
                          <td>{project.id}</td>
                          <td>{project.name}</td>
                          <td>{project.owner}</td>
                          <td>{project.method}</td>
                          <td>{project.credits}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Panel>
          </div>

          <div className="cc-column cc-column--center">
            <div className="cc-top-metrics">
              <Metric
                icon={<TrendingUp size={22} />}
                value="13,844,658 吨"
                label="交易数量"
              />
              <Metric
                icon={<Layers size={22} />}
                value="20 个"
                label="登记项目数量"
              />
              <Metric
                icon={<Database size={22} />}
                value="21,550,019 吨"
                label="登记减排量数量"
              />
            </div>

            <section className="cc-map-panel" aria-label="区域交易分布图">
              <div className="cc-planet-stage">
                <div className="cc-earth" aria-hidden="true">
                  <svg
                    className="cc-earth__graticule"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <ellipse cx="50" cy="50" rx="43" ry="43" />
                    <ellipse cx="50" cy="35" rx="37" ry="8" />
                    <ellipse cx="50" cy="44" rx="42" ry="6" />
                    <ellipse cx="50" cy="56" rx="42" ry="6" />
                    <ellipse cx="50" cy="65" rx="37" ry="8" />
                    <ellipse cx="50" cy="50" rx="12" ry="43" />
                    <ellipse cx="50" cy="50" rx="24" ry="43" />
                    <ellipse cx="50" cy="50" rx="36" ry="43" />
                    <path d="M50 7 C46 24 46 76 50 93" />
                    <path d="M50 7 C54 24 54 76 50 93" />
                  </svg>
                  <span className="cc-earth__land cc-earth__land--eurasia" />
                  <span className="cc-earth__land cc-earth__land--africa" />
                  <span className="cc-earth__land cc-earth__land--america" />
                  <span className="cc-earth__land cc-earth__land--oceania" />
                </div>
                <div className="cc-china-map-wrap">
                  <ChinaTradingMap points={mapPoints} />
                </div>
              </div>
            </section>

            <Panel title="市场行情" className="cc-market-panel">
              <div className="cc-chart">
                {monthlyBars.map((item) => (
                  <div className="cc-chart__group" key={item.month}>
                    <div className="cc-chart__bars">
                      <span
                        className="cc-chart__bar cc-chart__bar--volume"
                        style={{ height: `${item.volume}%` }}
                      />
                      <span
                        className="cc-chart__bar cc-chart__bar--amount"
                        style={{ height: `${item.amount}%` }}
                      />
                      <span
                        className="cc-chart__bar cc-chart__bar--price"
                        style={{ height: `${item.price}%` }}
                      />
                    </div>
                    <small>{item.month.slice(5)}</small>
                  </div>
                ))}
              </div>
              <div className="cc-legend">
                <span>
                  <i className="cc-legend__volume" />
                  成交量
                </span>
                <span>
                  <i className="cc-legend__amount" />
                  成交额
                </span>
                <span>
                  <i className="cc-legend__price" />
                  市场均价
                </span>
              </div>
            </Panel>
          </div>

          <div className="cc-column cc-column--right">
            <Panel title="当日成交数据">
              <div className="cc-day-summary">
                {daySummary.map((item) => (
                  <div key={item.label}>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="监管提示">
              <div className="cc-alerts">
                <div>
                  <ShieldCheck size={20} />
                  <span>今日完成 6 笔交易核验，未发现余额异常。</span>
                </div>
                <div>
                  <Factory size={20} />
                  <span>3 家控排企业本周进入履约提醒窗口。</span>
                </div>
                <div>
                  <Leaf size={20} />
                  <span>林业碳汇项目登记量环比增长 12.6%。</span>
                </div>
              </div>
            </Panel>

            <Panel title="历史成交情况" className="cc-panel--table cc-panel--history">
              <div className="cc-table-frame cc-table-frame--trades">
                <table className="cc-table cc-table--head">
                  <thead>
                    <tr>
                      <th>日期</th>
                      <th>成交量</th>
                      <th>成交总额</th>
                      <th>均价</th>
                      <th>行业</th>
                    </tr>
                  </thead>
                </table>
                <div className="cc-table-scroll">
                  <table className="cc-table cc-table--body">
                    <tbody className="cc-table__rolling">
                      {[...tradeRows, ...tradeRows].map((trade, index) => (
                        <tr key={`${trade.date}-${trade.volume}-${index}`}>
                          <td>{trade.date}</td>
                          <td>{trade.volume}</td>
                          <td>{trade.amount}</td>
                          <td>{trade.average}</td>
                          <td>{trade.sector}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Panel>

            <div className="cc-footer-strip">
              <Activity size={18} />
              <span>撮合系统、登记簿与监管看板状态正常</span>
              <ArrowUpRight size={18} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CarbonTradingCommandCenter;
