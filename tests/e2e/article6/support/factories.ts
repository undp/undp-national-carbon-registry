import { ApiClient, expectOk } from "./api-client";

let uniqueCounter = 0;
export function uniqueSuffix(): string {
  uniqueCounter += 1;
  return `${Date.now().toString(36)}-${uniqueCounter}`;
}

export interface CooperativeApproachOverrides {
  title?: string;
  participatingParties?: string[];
  hostParty?: string;
  description?: string;
  startDate?: number;
  endDate?: number;
  expectedMitigationOutcomes?: string;
  environmentalIntegrityAssessment?: string;
  ndcLink?: string;
  authorizationDocumentUrl?: string;
}

export async function createCooperativeApproach(
  api: ApiClient,
  overrides: CooperativeApproachOverrides = {}
): Promise<{ cooperativeApproachId: string; title: string; raw: any }> {
  const title = overrides.title ?? `Test CA ${uniqueSuffix()}`;
  const body = {
    title,
    participatingParties: overrides.participatingParties ?? ["NG", "CH"],
    hostParty: overrides.hostParty ?? "NG",
    description: overrides.description ?? "E2E-generated cooperative approach",
    ...overrides,
  };
  const res = await api.post("national/cooperativeApproach/create", body);
  await expectOk(res, "createCooperativeApproach");
  const raw = await api.json<any>(res);
  const data = raw?.data ?? raw;
  return {
    cooperativeApproachId:
      data?.cooperativeApproachId ?? data?.id ?? data?.cooperative_approach_id,
    title,
    raw: data,
  };
}

export interface InitialReportOverrides {
  cooperativeApproachId: string;
  participationDemonstration?: Record<string, unknown>;
  itmoMetrics?: Record<string, unknown>;
  caMethodDescription?: string;
  ndcQuantification?: Record<string, unknown>;
  cooperativeApproachDetails?: Record<string, unknown>;
  environmentalIntegrity?: Record<string, unknown>;
}

export async function generateInitialReport(
  api: ApiClient,
  overrides: InitialReportOverrides
): Promise<{ reportId: string; raw: any }> {
  const res = await api.post("national/initialReport/generate", overrides);
  await expectOk(res, "generateInitialReport");
  const raw = await api.json<any>(res);
  const data = raw?.data ?? raw;
  return { reportId: data?.reportId ?? data?.id, raw: data };
}

export async function submitInitialReport(
  api: ApiClient,
  reportId: string
): Promise<any> {
  const res = await api.put(
    `national/initialReport/submit?id=${encodeURIComponent(reportId)}`
  );
  await expectOk(res, "submitInitialReport");
  const raw = await api.json<any>(res);
  return raw?.data ?? raw;
}

export interface CaCalculateInput {
  year: number;
  cooperativeApproachId?: string;
  ndcType: "SINGLE_YEAR" | "MULTI_YEAR";
  caMethod: "TRAJECTORY" | "AVERAGING" | "MULTI_YEAR";
  ndcTarget?: number;
}

const NDC_TYPE_WIRE = {
  SINGLE_YEAR: "SingleYear",
  MULTI_YEAR: "MultiYear",
} as const;

const CA_METHOD_WIRE = {
  TRAJECTORY: "Trajectory",
  AVERAGING: "Averaging",
  MULTI_YEAR: "MultiYear",
} as const;

export async function calculateCorrespondingAdjustment(
  api: ApiClient,
  input: CaCalculateInput
): Promise<any> {
  const payload = {
    ...input,
    ndcType: NDC_TYPE_WIRE[input.ndcType],
    caMethod: CA_METHOD_WIRE[input.caMethod],
  };
  const res = await api.post(
    "national/correspondingAdjustment/calculate",
    payload
  );
  await expectOk(res, "calculateCorrespondingAdjustment");
  const raw = await api.json<any>(res);
  return raw?.data ?? raw;
}

export async function queryCooperativeApproaches(
  api: ApiClient,
  page = 1,
  size = 10
): Promise<{ items: any[]; total: number }> {
  const res = await api.post("national/cooperativeApproach/query", {
    page,
    size,
    sort: { key: "createdTime", order: "DESC" },
  });
  await expectOk(res, "queryCooperativeApproaches");
  const raw = await api.json<any>(res);
  const data = raw?.data ?? raw;
  if (Array.isArray(data)) {
    return { items: data, total: raw?.total ?? data.length };
  }
  return { items: data?.data ?? [], total: data?.total ?? 0 };
}
