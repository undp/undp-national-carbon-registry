import { execSync } from "node:child_process";
import { ApiClient, expectOk } from "./api-client";

let uniqueCounter = 0;
export function uniqueSuffix(): string {
  uniqueCounter += 1;
  return `${Date.now().toString(36)}-${uniqueCounter}`;
}

/**
 * Test-only escape hatch: seed a credit_blocks_entity row directly via
 * `podman exec db psql`. Returns the blockId. Needed because there is no
 * cheap HTTP fixture for issuing credits (requires a full programme +
 * NDC action + authorization flow). When a proper /issueCredits endpoint
 * or a programme factory lands, replace this with a proper API call.
 *
 * Requires the docker-compose stack (db container named `db`) to be
 * running locally with podman. E2E_DB_CONTAINER overrides the name.
 */
export interface SeedCreditBlockInput {
  ownerCompanyId: number;
  projectRefId?: string;
  creditAmount: number;
  cooperativeApproachId?: string;
  authorizationPurpose?:
    | "UseTowardsNDC"
    | "OtherInternationalMitigationPurposes"
    | "OtherPurposes";
  accountType?:
    | "Holding"
    | "RetirementNDC"
    | "RetirementOIMP"
    | "CancellationVoluntary"
    | "CancellationOMGE"
    | "CancellationSOP";
  omgeDeductedAtIssuance?: boolean;
  sopDeductedAtIssuance?: boolean;
  vintage?: string;
}

export function seedCreditBlockDirect(
  input: SeedCreditBlockInput
): { creditBlockId: string } {
  const container = process.env.E2E_DB_CONTAINER ?? "db";
  const creditBlockId = `TEST-BLK-${uniqueSuffix()}`;
  const serialNumber = `TEST-SERIAL-${uniqueSuffix()}`;
  const projectRefId = input.projectRefId ?? `TEST-PROJ-${uniqueSuffix()}`;
  const vintage = input.vintage ?? "2025";
  const cooperativeApproachIdSql = input.cooperativeApproachId
    ? `'${input.cooperativeApproachId}'`
    : "NULL";
  const authorizationPurposeSql = input.authorizationPurpose
    ? `'${input.authorizationPurpose}'`
    : "NULL";
  const accountType = input.accountType ?? "Holding";
  const omge = input.omgeDeductedAtIssuance ? "TRUE" : "FALSE";
  const sop = input.sopDeductedAtIssuance ? "TRUE" : "FALSE";

  const sql = `
    INSERT INTO credit_blocks_entity (
      "creditBlockId","txRef","txType","txTime",
      "ownerCompanyId","projectRefId","serialNumber","vintage",
      "creditAmount","isNotTransferred","reservedCreditAmount","createTime",
      "cooperativeApproachId","authorizationPurpose",
      "accountType","omgeDeductedAtIssuance","sopDeductedAtIssuance"
    ) VALUES (
      '${creditBlockId}','e2e-fixture','2',(EXTRACT(EPOCH FROM NOW())::bigint * 1000),
      ${input.ownerCompanyId},'${projectRefId}','${serialNumber}','${vintage}',
      ${input.creditAmount}, TRUE, 0, (EXTRACT(EPOCH FROM NOW())::bigint * 1000),
      ${cooperativeApproachIdSql}, ${authorizationPurposeSql},
      '${accountType}', ${omge}, ${sop}
    );
  `.replace(/\s+/g, " ").trim();

  execSync(
    `podman exec ${container} psql -U root -d carbondev -c ${JSON.stringify(
      sql
    )}`,
    { stdio: ["ignore", "ignore", "pipe"] }
  );

  return { creditBlockId };
}

/**
 * Seed an emission row for a given year + country with a totalCo2WithoutLand
 * co2eq value. Used by the Corresponding Adjustment safeguard-fail test.
 */
/**
 * Force an initial_report row's status to a specific value by direct SQL.
 * Used to test the Published-is-immutable guard because no HTTP path
 * transitions an IR to Published.
 */
export function setInitialReportStatusDirect(
  reportId: string,
  status: "Draft" | "Submitted" | "Published"
): void {
  const container = process.env.E2E_DB_CONTAINER ?? "db";
  const sql = `UPDATE initial_report SET status='${status}' WHERE "reportId"='${reportId}';`;
  execSync(
    `podman exec ${container} psql -U root -d carbondev -c ${JSON.stringify(sql)}`,
    { stdio: ["ignore", "ignore", "pipe"] }
  );
}

/**
 * Seed an aef_actions_table_entity row directly. Used by aef-reporting
 * spec row-content tests because there is no HTTP fixture for producing
 * AEF action rows (they are populated as a side effect of the programme
 * lifecycle service layer).
 */
export function seedAefActionDirect(input: {
  actionType:
    | "authorization"
    | "firstTransfer"
    | "transfer"
    | "acquisition"
    | "retire"
    | "crossBoarderTransfer"
    | "useTowardsNDC"
    | "useForOIMP"
    | "voluntaryCancellation"
    | "omgeCancellation"
    | "holdingsSnapshot";
  creditAmount?: number;
  aquiringParty?: string;
  cooperativeApproachId?: string;
  reportingYear?: number;
  authorizationPurpose?:
    | "UseTowardsNDC"
    | "OtherInternationalMitigationPurposes"
    | "OtherPurposes";
  isFirstTransfer?: boolean;
}): { id: number } {
  const container = process.env.E2E_DB_CONTAINER ?? "db";
  const suffix = uniqueSuffix();
  const startId = `AEF-${suffix}-S`;
  const endId = `AEF-${suffix}-E`;
  const authId = `AUTH-${suffix}`;
  const amount = input.creditAmount ?? 1000;
  const reportingYear = input.reportingYear ?? 2025;
  const aquiringParty = input.aquiringParty ?? "NG";
  const caIdSql = input.cooperativeApproachId
    ? `'${input.cooperativeApproachId}'`
    : "NULL";
  const authPurposeSql = input.authorizationPurpose
    ? `'${input.authorizationPurpose}'`
    : "NULL";
  const isFirstTransfer = input.isFirstTransfer ? "TRUE" : "FALSE";

  const sql = `
    INSERT INTO aef_actions_table_entity (
      "creditBlockStartId","creditBlockEndId","creditAmount","vintage",
      "sector","sectoralScope","projectAuthorizationTime","authorizationId",
      "actionTime","actionType","aquiringParty",
      "cooperativeApproachId","authorizationPurpose","isFirstTransfer",
      "reportingYear","createdTime"
    ) VALUES (
      '${startId}','${endId}',${amount},'2025',
      'Energy','1','${Date.now()}','${authId}',
      ${Date.now()},'${input.actionType}','${aquiringParty}',
      ${caIdSql},${authPurposeSql},${isFirstTransfer},
      ${reportingYear},${Date.now()}
    ) RETURNING id;
  `.replace(/\s+/g, " ").trim();

  const out = execSync(
    `podman exec ${container} psql -U root -d carbondev -t -A -c ${JSON.stringify(sql)}`,
    { encoding: "utf8" }
  );
  const id = Number(out.trim().split("\n")[0]);
  return { id };
}

export function seedEmissionRowDirect(input: {
  year: number;
  country: string;
  co2eqWithoutLand: number;
}): void {
  const container = process.env.E2E_DB_CONTAINER ?? "db";
  const co2eq = JSON.stringify({ co2eq: input.co2eqWithoutLand });
  const sql = `
    INSERT INTO emission (
      "country","year","totalCo2WithoutLand","state","version","createdAt","updatedAt"
    ) VALUES (
      '${input.country}', '${input.year}', '${co2eq}', 'FINALIZED', 1, NOW(), NOW()
    )
    ON CONFLICT DO NOTHING;
  `.replace(/\s+/g, " ").trim();
  execSync(
    `podman exec ${container} psql -U root -d carbondev -c ${JSON.stringify(sql)}`,
    { stdio: ["ignore", "ignore", "pipe"] }
  );
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
