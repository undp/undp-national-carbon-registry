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
  // Dec 6/CMA.4 Annex I para 5 structured ITMO serial. Optional so
  // legacy-format tests still compile.
  itmoSerial?: string;
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
  const itmoSerialSql = input.itmoSerial ? `'${input.itmoSerial}'` : "NULL";

  const sql = `
    INSERT INTO credit_blocks_entity (
      "creditBlockId","txRef","txType","txTime",
      "ownerCompanyId","projectRefId","serialNumber","itmoSerial","vintage",
      "creditAmount","isNotTransferred","reservedCreditAmount","createTime",
      "cooperativeApproachId","authorizationPurpose",
      "accountType","omgeDeductedAtIssuance","sopDeductedAtIssuance"
    ) VALUES (
      '${creditBlockId}','e2e-fixture','2',(EXTRACT(EPOCH FROM NOW())::bigint * 1000),
      ${input.ownerCompanyId},'${projectRefId}','${serialNumber}',${itmoSerialSql},'${vintage}',
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
 * Seed a minimal Programme row so /programme/authorize can be exercised
 * without building out the full ProgrammeDto fixture. Fields below are
 * the minimum TypeORM NOT NULL set for the programme table as of Phase
 * 6; update if the schema grows.
 */
export function seedProgrammeDirect(input: {
  companyId: number;
  cooperativeApproachId?: string;
  article6trade?: boolean;
  currentStage?: "New" | "AwaitingAuthorization" | "Approved" | "Authorised" | "Rejected";
  externalId?: string;
}): { programmeId: string; externalId: string } {
  const container = process.env.E2E_DB_CONTAINER ?? "db";
  const programmeId = `TEST-PROG-${uniqueSuffix()}`;
  const externalId = input.externalId ?? `TEST-EXT-${programmeId}`;
  const caIdSql = input.cooperativeApproachId
    ? `'${input.cooperativeApproachId}'`
    : "NULL";
  const article6 = input.article6trade === false ? "FALSE" : "TRUE";
  const currentStage = input.currentStage ?? "Approved";
  // programmeProperties.geographicalLocation must be a non-null array
  // because the post-METHODOLOGY-acceptance side effect
  // sendRequestForLetterOfAuthorisation calls .length on it
  // (programme.service.ts:1550 + letter.of.authorisation.request.gen.ts:35).
  const programmePropertiesJson = JSON.stringify({
    geographicalLocation: ["Abia"],
    greenHouseGasses: ["CO2"],
  }).replace(/'/g, "''");
  const sql = `
    INSERT INTO programme (
      "programmeId","externalId","title","sectoralScope","sector","countryCodeA2",
      "currentStage","startTime","endTime","creditEst","creditUnit",
      "proponentTaxVatId","companyId","article6trade","cooperativeApproachId",
      "programmeProperties","txTime","createdTime"
    ) VALUES (
      '${programmeId}','${externalId}','Test Programme','1','Energy','NG',
      '${currentStage}',(EXTRACT(EPOCH FROM NOW())::bigint * 1000),
      (EXTRACT(EPOCH FROM NOW())::bigint * 1000) + 86400000,1000,'tCO2e',
      '{}', '{${input.companyId}}', ${article6}, ${caIdSql},
      '${programmePropertiesJson}'::jsonb,
      (EXTRACT(EPOCH FROM NOW())::bigint * 1000),
      (EXTRACT(EPOCH FROM NOW())::bigint * 1000)
    );
  `.replace(/\s+/g, " ").trim();
  execSync(
    `podman exec ${container} psql -U root -d carbondev -c ${JSON.stringify(sql)}`,
    { stdio: ["ignore", "ignore", "pipe"] }
  );

  // Also seed the ledger (carbondevEvents) — programme.service.authorizeProgramme
  // reads the programme via programmeLedger.getProgrammeById, which
  // fetches from the `programmes` table in the ledger DB.
  const ledgerData: Record<string, any> = {
    programmeId,
    externalId,
    title: "Test Programme",
    sectoralScope: "1",
    sector: "Energy",
    countryCodeA2: "NG",
    currentStage,
    startTime: Date.now(),
    endTime: Date.now() + 86400000,
    creditEst: 1000,
    creditUnit: "tCO2e",
    proponentTaxVatId: [],
    companyId: [input.companyId],
    article6trade: input.article6trade !== false,
    cooperativeApproachId: input.cooperativeApproachId ?? null,
    programmeProperties: {
      geographicalLocation: ["Abia"],
      greenHouseGasses: ["CO2"],
    },
    txTime: Date.now(),
    createdTime: Date.now(),
  };
  const ledgerSql = `
    INSERT INTO programmes (data, meta)
    VALUES ('${JSON.stringify(ledgerData).replace(/'/g, "''")}'::jsonb, '{}'::jsonb);
  `.replace(/\s+/g, " ").trim();
  execSync(
    `podman exec ${container} psql -U root -d carbondevEvents -c ${JSON.stringify(ledgerSql)}`,
    { stdio: ["ignore", "ignore", "pipe"] }
  );

  return { programmeId, externalId };
}

/**
 * Seed a verified mitigation action onto a programme directly in the
 * ledger. Mirrors the production shape produced by
 * `programmeLedger.addMitigation` (programme-ledger.service.ts:2364) so
 * that `issueProgrammeCredit` sees:
 *   - `mitigationActions[*].actionId` — referenced by the issueAmount,
 *   - `mitigationActions[*].projectMaterial[]` — a URL list whose string
 *     contains "VERIFICATION_REPORT" so `isVerfiedMitigationAction`
 *     (programme.service.ts:6040) returns true,
 *   - `mitigationActions[*].properties.availableCredits` / `.issuedCredits`
 *     — the running totals decremented on issue.
 *
 * The ledger's `programmes` table is append-only and
 * `fetchRecords` returns `DISTINCT ON (programmeId) ORDER BY hash DESC`
 * (pgsql-ledger.service.ts:157-178), so a fresh INSERT with a higher
 * hash wins. We read the current latest row, splice a mitigation action
 * into `data.mitigationActions`, and INSERT the merged JSON — no
 * HTTP or addMitigation round-trip required.
 *
 * The programme referenced by `programmeId` must already exist in the
 * ledger (typically via `seedProgrammeDirect`). Returns the generated
 * actionId (uuid) that callers can feed into `issueCredits`.
 */
export async function seedVerifiedMitigationActionDirect(
  programmeId: string,
  opts: { actionId?: string; amount?: number } = {}
): Promise<string> {
  const container = process.env.E2E_DB_CONTAINER ?? "db";
  const actionId = opts.actionId ?? `NDC-VERIFIED-${uniqueSuffix()}`;
  const amount = opts.amount ?? 1000;
  const verificationUrl = `https://example.com/VERIFICATION_REPORT/${actionId}.pdf`;

  // 1. Read the current latest ledger row for this programmeId and pull
  //    out the JSONB blob. We rebuild it locally so the INSERT below
  //    carries every field forward.
  const selectSql = `
    SELECT data FROM (
      SELECT DISTINCT ON (data->>'programmeId') data, hash
      FROM programmes
      ORDER BY data->>'programmeId', hash DESC
    ) x WHERE data->>'programmeId' = '${programmeId}';
  `.replace(/\s+/g, " ").trim();
  const out = execSync(
    `podman exec ${container} psql -U root -d carbondevEvents -t -A -c ${JSON.stringify(
      selectSql
    )}`,
    { encoding: "utf8" }
  );
  const line = out.trim();
  if (!line) {
    throw new Error(
      `seedVerifiedMitigationActionDirect: programme ${programmeId} not found in ledger`
    );
  }
  const existing = JSON.parse(line) as Record<string, any>;

  // 2. Build the MitigationProperties object. Required fields per the
  //    DTO: typeOfMitigation, systemEstimatedCredits, actionId,
  //    constantVersion. projectMaterial is a plain URL array — the
  //    service check at programme.service.ts:6040 accepts either
  //    `{url: string}` or a raw string, so we use the simpler raw form.
  const newAction = {
    typeOfMitigation: "Agriculture",
    userEstimatedCredits: amount,
    systemEstimatedCredits: amount,
    actionId,
    projectMaterial: [verificationUrl],
    properties: {
      issuedCredits: 0,
      availableCredits: amount,
    },
    constantVersion: "1.0",
  };
  const merged = { ...existing };
  const existingActions: any[] = Array.isArray(existing.mitigationActions)
    ? existing.mitigationActions
    : [];
  merged.mitigationActions = [...existingActions, newAction];
  merged.txTime = Date.now();

  // 3. Append a new ledger row. The hash sequence guarantees the new
  //    row wins the DISTINCT ON.
  const insertSql = `
    INSERT INTO programmes (data, meta)
    VALUES ('${JSON.stringify(merged).replace(/'/g, "''")}'::jsonb, '{}'::jsonb);
  `.replace(/\s+/g, " ").trim();
  execSync(
    `podman exec ${container} psql -U root -d carbondevEvents -c ${JSON.stringify(
      insertSql
    )}`,
    { stdio: ["ignore", "ignore", "pipe"] }
  );

  return actionId;
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
  reportNumber: string,
  status: "Draft" | "Submitted"
): void {
  const container = process.env.E2E_DB_CONTAINER ?? "db";
  const sql = `UPDATE initial_report SET status='${status}' WHERE "reportNumber"='${reportNumber}';`;
  execSync(
    `podman exec ${container} psql -U root -d carbondev -c ${JSON.stringify(sql)}`,
    { stdio: ["ignore", "ignore", "pipe"] }
  );
}

/**
 * Force a JSONB section of an initial_report row to NULL via direct
 * SQL. Used by the submit-incomplete test because the update DTO
 * rejects explicit nulls before they can reach the submit-layer
 * completeness validator. Bypassing the DTO lets us drive the
 * "Initial report is incomplete" 400 path directly.
 *
 * cooperativeApproachDetails / ndcQuantification no longer exist on
 * initial_report (the NDC-period restructure moved approach links to
 * initial_report_cooperative_approach and promoted ndcQuantification's
 * fields to columns) — only the three jsonb sections that stayed on the
 * report itself can be nulled this way.
 */
export function nullInitialReportSectionDirect(
  reportNumber: string,
  section: "participationDemonstration" | "itmoMetrics" | "environmentalIntegrity"
): void {
  const container = process.env.E2E_DB_CONTAINER ?? "db";
  const sql = `UPDATE initial_report SET "${section}"=NULL WHERE "reportNumber"='${reportNumber}';`;
  execSync(
    `podman exec ${container} psql -U root -d carbondev -c ${JSON.stringify(sql)}`,
    { stdio: ["ignore", "ignore", "pipe"] }
  );
}

/**
 * Seed a credit_blocks ledger event in carbondevEvents. The
 * ledger-replicator (a separate container) polls this table every 1s
 * and produces CreditBlocksEntity + CreditTransactionsEntity rows in
 * the RDBMS. Used by the isFirstTransfer behaviour test to simulate
 * an ISSUE followed by a TRANSFER for the same credit block so the
 * replicator's pre-vs-post comparison can assign
 * CreditTransactionTypesEnum.FIRST_TRANSFER correctly per
 * Dec 2/CMA.3 Annex para 1(a).
 */
export function seedCreditBlockLedgerEvent(data: Record<string, any>): void {
  const container = process.env.E2E_DB_CONTAINER ?? "db";
  const sql = `
    INSERT INTO credit_blocks (data, meta)
    VALUES ('${JSON.stringify(data).replace(/'/g, "''")}'::jsonb, '{}'::jsonb);
  `.replace(/\s+/g, " ").trim();
  execSync(
    `podman exec ${container} psql -U root -d carbondevEvents -c ${JSON.stringify(sql)}`,
    { stdio: ["ignore", "ignore", "pipe"] }
  );
}

/**
 * Seed a credit block that is "transferrable" end-to-end through
 * POST /creditTransactionsManagement/transfer. Unlike
 * seedCreditBlockDirect (which only writes the RDBMS
 * credit_blocks_entity row), this helper additionally seeds the ledger
 * `project` and `credit_blocks` rows so that
 * programmeLedgerService.transferCredits's getAndUpdateTx lookups
 * succeed. Required because the transfer service path queries the
 * ledger DB (carbondevEvents), not the RDBMS.
 *
 * Returns the creditBlockId and the matching projectRefId so callers
 * can assert against queryBalance / queryTransfers views downstream.
 */
export function seedTransferrableBlock(input: {
  ownerCompanyId: number;
  creditAmount: number;
  accountType?:
    | "Holding"
    | "RetirementNDC"
    | "RetirementOIMP"
    | "CancellationVoluntary"
    | "CancellationOMGE"
    | "CancellationSOP";
  authorizationPurpose?:
    | "UseTowardsNDC"
    | "OtherInternationalMitigationPurposes"
    | "OtherPurposes";
  cooperativeApproachId?: string;
  // Dec 6/CMA.4 Annex I para 5 structured ITMO serial. Propagated to
  // both the RDBMS row and the ledger credit_blocks row so downstream
  // split / retire paths can assert serial lineage per Draft -/CMA.5 ¶132.
  itmoSerial?: string;
}): { creditBlockId: string; projectRefId: string } {
  const container = process.env.E2E_DB_CONTAINER ?? "db";
  const projectRefId = `TEST-PROJ-${uniqueSuffix()}`;

  // 1. RDBMS row. seedCreditBlockDirect handles this path — reuse it so
  //    any future schema drift propagates to a single place.
  const block = seedCreditBlockDirect({
    ownerCompanyId: input.ownerCompanyId,
    creditAmount: input.creditAmount,
    projectRefId,
    accountType: input.accountType,
    authorizationPurpose: input.authorizationPurpose,
    cooperativeApproachId: input.cooperativeApproachId,
    itmoSerial: input.itmoSerial,
  });

  // 2. Ledger `project` row keyed by refId. Shape driven by
  //    projects.entity.ts (NOT NULL: refId, title, companyId,
  //    independentCertifiers, sector, sectoralScope, txType, txTime,
  //    createTime, updateTime). creditBalance seeds to the full amount
  //    so transferCredits's post-transfer decrement lands on a
  //    realistic value.
  const projectLedgerData = {
    refId: projectRefId,
    title: `Test Project ${projectRefId}`,
    companyId: input.ownerCompanyId,
    independentCertifiers: [],
    sector: "Energy",
    sectoralScope: "1",
    txType: "1",
    txRef: "e2e-transfer-fixture",
    txTime: Date.now(),
    createTime: Date.now(),
    updateTime: Date.now(),
    creditEst: input.creditAmount,
    creditBalance: input.creditAmount,
    creditRetired: 0,
    creditTransferred: 0,
    creditIssued: input.creditAmount,
    creditChange: 0,
    cooperativeApproachId: input.cooperativeApproachId ?? null,
    authorizationPurpose: input.authorizationPurpose ?? null,
  };
  const projectSql = `
    INSERT INTO project (data, meta)
    VALUES ('${JSON.stringify(projectLedgerData).replace(/'/g, "''")}'::jsonb, '{}'::jsonb);
  `.replace(/\s+/g, " ").trim();
  execSync(
    `podman exec ${container} psql -U root -d carbondevEvents -c ${JSON.stringify(projectSql)}`,
    { stdio: ["ignore", "ignore", "pipe"] }
  );

  // 3. Ledger `credit_blocks` row. Mirrors the RDBMS shape but lives in
  //    the ledger DB; transferCredits reads this via
  //    ledger.getAndUpdateTx(creditBlocksTable).
  const blockLedgerData: Record<string, any> = {
    creditBlockId: block.creditBlockId,
    txRef: "e2e-transfer-fixture",
    txType: "2",
    txTime: Date.now(),
    ownerCompanyId: input.ownerCompanyId,
    projectRefId,
    serialNumber: `SN-${block.creditBlockId}`,
    vintage: "2025",
    creditAmount: input.creditAmount,
    isNotTransferred: true,
    reservedCreditAmount: 0,
    createTime: Date.now(),
    accountType: input.accountType ?? "Holding",
    authorizationPurpose: input.authorizationPurpose ?? null,
    cooperativeApproachId: input.cooperativeApproachId ?? null,
    omgeDeductedAtIssuance: false,
    sopDeductedAtIssuance: false,
    transactionRecords: [],
  };
  if (input.itmoSerial) {
    blockLedgerData.itmoSerial = input.itmoSerial;
  }
  const blockSql = `
    INSERT INTO credit_blocks (data, meta)
    VALUES ('${JSON.stringify(blockLedgerData).replace(/'/g, "''")}'::jsonb, '{}'::jsonb);
  `.replace(/\s+/g, " ").trim();
  execSync(
    `podman exec ${container} psql -U root -d carbondevEvents -c ${JSON.stringify(blockSql)}`,
    { stdio: ["ignore", "ignore", "pipe"] }
  );

  return { creditBlockId: block.creditBlockId, projectRefId };
}

/**
 * Seed a pending credit_transactions_entity row that the
 * performRetireAction (ACCEPT) phase 2 handler looks up by
 * transactionId. Required because the normal path that populates this
 * row — handleTransactionRecords in the ledger-replicator container —
 * is not running in the current dev stack. Direct SQL insert is the
 * only way to drive phase 2 end-to-end without standing up the
 * replicator.
 *
 * Returns the transactionId as a string (the column is a text PK).
 */
export function seedPendingRetirementTransactionDirect(input: {
  transactionId: string;
  creditBlockId: string;
  projectRefId: string;
  senderCompanyId: number;
  amount: number;
  retirementType: string;
  serialNumber?: string;
}): { transactionId: string } {
  const container = process.env.E2E_DB_CONTAINER ?? "db";
  const serialNumber = input.serialNumber ?? `SN-${input.creditBlockId}`;
  // CreditTransactionTypesEnum.RETIRED = "Retired"
  // CreditTransactionStatusEnum.PENDING = "Pending"
  // recieverId=0 mirrors the retirement convention (unowned).
  const sql = `
    INSERT INTO credit_transactions_entity (
      "id","senderId","recieverId","type","status",
      "creditBlockId","serialNumber","amount","projectRefId",
      "retirementType","createTime"
    ) VALUES (
      '${input.transactionId}', ${input.senderCompanyId}, 0, 'Retired', 'Pending',
      '${input.creditBlockId}','${serialNumber}', ${input.amount}, '${input.projectRefId}',
      '${input.retirementType.replace(/'/g, "''")}', (EXTRACT(EPOCH FROM NOW())::bigint * 1000)
    );
  `.replace(/\s+/g, " ").trim();
  execSync(
    `podman exec ${container} psql -U root -d carbondev -c ${JSON.stringify(sql)}`,
    { stdio: ["ignore", "ignore", "pipe"] }
  );
  return { transactionId: input.transactionId };
}

/**
 * Read the latest ledger state for a credit block from carbondevEvents
 * credit_blocks (the ledger table is append-only; the latest row wins).
 * Returns the `data` JSONB as a parsed object, or null if not found.
 *
 * Used to assert the retirement flow's accountType / ownerCompanyId
 * updates land on the derived retirement block. We read the ledger
 * directly because queryBalance filters by `ownerCompanyId != 0` so
 * retired blocks (which are set to ownerCompanyId=0) never surface.
 */
export function readLedgerCreditBlock(
  creditBlockId: string
): Record<string, any> | null {
  const container = process.env.E2E_DB_CONTAINER ?? "db";
  const sql = `
    SELECT data FROM credit_blocks
    WHERE data->>'creditBlockId' = '${creditBlockId}'
    ORDER BY hash DESC LIMIT 1;
  `.replace(/\s+/g, " ").trim();
  const out = execSync(
    `podman exec ${container} psql -U root -d carbondevEvents -t -A -c ${JSON.stringify(sql)}`,
    { encoding: "utf8" }
  );
  const line = out.trim();
  if (!line) return null;
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

/**
 * Read all ledger rows whose data.projectRefId matches, ordered
 * newest-first. Useful after a retire with split because the new
 * retirement block has a fresh creditBlockId but shares the parent's
 * projectRefId.
 */
export function readLedgerBlocksByProject(
  projectRefId: string
): Array<Record<string, any>> {
  const container = process.env.E2E_DB_CONTAINER ?? "db";
  const sql = `
    SELECT DISTINCT ON (data->>'creditBlockId') data
    FROM credit_blocks
    WHERE data->>'projectRefId' = '${projectRefId}'
    ORDER BY data->>'creditBlockId', hash DESC;
  `.replace(/\s+/g, " ").trim();
  const out = execSync(
    `podman exec ${container} psql -U root -d carbondevEvents -t -A -c ${JSON.stringify(sql)}`,
    { encoding: "utf8" }
  );
  return out
    .trim()
    .split("\n")
    .filter((l) => l.length > 0)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter((x): x is Record<string, any> => x !== null);
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
  // Phase 4 columns. The entity declares them
  // (aef.actions.table.entity.ts:53,67) but no production service writes
  // them today — direct seed is the only way to drive content tests.
  acquiringPartyCountryCode?: string;
  cumulativeAmount?: number;
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
  const acquiringPartyCountryCodeSql = input.acquiringPartyCountryCode
    ? `'${input.acquiringPartyCountryCode}'`
    : "NULL";
  const cumulativeAmountSql =
    typeof input.cumulativeAmount === "number"
      ? String(input.cumulativeAmount)
      : "NULL";

  const sql = `
    INSERT INTO aef_actions_table_entity (
      "creditBlockStartId","creditBlockEndId","creditAmount","vintage",
      "sector","sectoralScope","projectAuthorizationTime","authorizationId",
      "actionTime","actionType","aquiringParty",
      "cooperativeApproachId","acquiringPartyCountryCode",
      "authorizationPurpose","isFirstTransfer",
      "cumulativeAmount","reportingYear","createdTime"
    ) VALUES (
      '${startId}','${endId}',${amount},'2025',
      'Energy','1','${Date.now()}','${authId}',
      ${Date.now()},'${input.actionType}','${aquiringParty}',
      ${caIdSql},${acquiringPartyCountryCodeSql},
      ${authPurposeSql},${isFirstTransfer},
      ${cumulativeAmountSql},${reportingYear},${Date.now()}
    ) RETURNING id;
  `.replace(/\s+/g, " ").trim();

  const out = execSync(
    `podman exec ${container} psql -U root -d carbondev -t -A -c ${JSON.stringify(sql)}`,
    { encoding: "utf8" }
  );
  const id = Number(out.trim().split("\n")[0]);
  return { id };
}

/**
 * Seed an arbitrary credit_transactions_entity row by direct SQL. Unlike
 * `seedPendingRetirementTransactionDirect` (which hard-codes
 * type=Retired status=Pending) this helper accepts any
 * CreditTransactionTypesEnum value plus a year-bound `createTime` so
 * tests can drive the corresponding-adjustment year-window aggregation
 * (corresponding-adjustment.service.ts:49-57: createTime in
 * [Jan 1 ms, Jan 1 next-year ms)).
 *
 * The createTime is anchored at Jan 2 of the supplied year so we land
 * comfortably inside the [yearStart, yearEnd) range regardless of
 * timezone math.
 */
export function seedCreditTransactionDirect(input: {
  type:
    | "Issued"
    | "Authorized"
    | "FirstTransfer"
    | "Transfered"
    | "Acquired"
    | "Retired"
    | "UseTowardsNDC"
    | "UseForOIMP"
    | "VoluntaryCancellation"
    | "OMGECancellation";
  status?: "Pending" | "Completed" | "Cancelled";
  amount: number;
  year: number;
  cooperativeApproachId?: string;
  isFirstTransfer?: boolean;
  senderId?: number;
  recieverId?: number;
  creditBlockId?: string;
  serialNumber?: string;
  projectRefId?: string;
}): { transactionId: string } {
  const container = process.env.E2E_DB_CONTAINER ?? "db";
  const suffix = uniqueSuffix();
  const transactionId = `TEST-TXN-${suffix}`;
  const status = input.status ?? "Completed";
  const senderId = input.senderId ?? 0;
  const recieverId = input.recieverId ?? 0;
  const creditBlockId = input.creditBlockId ?? `TEST-BLK-${suffix}`;
  const serialNumber = input.serialNumber ?? `SN-${suffix}`;
  const projectRefId = input.projectRefId ?? `TEST-PROJ-${suffix}`;
  const caIdSql = input.cooperativeApproachId
    ? `'${input.cooperativeApproachId}'`
    : "NULL";
  const isFirstTransfer = input.isFirstTransfer ? "TRUE" : "FALSE";
  // Jan 2 of the year is well inside [Jan 1 ms, Jan 1 next-year ms),
  // matching the CA-ADJ year-window filter.
  const createTime = new Date(input.year, 0, 2).getTime();

  const sql = `
    INSERT INTO credit_transactions_entity (
      "id","senderId","recieverId","type","status",
      "creditBlockId","serialNumber","amount","projectRefId",
      "cooperativeApproachId","isFirstTransfer","createTime"
    ) VALUES (
      '${transactionId}', ${senderId}, ${recieverId}, '${input.type}', '${status}',
      '${creditBlockId}','${serialNumber}', ${input.amount}, '${projectRefId}',
      ${caIdSql}, ${isFirstTransfer}, ${createTime}
    );
  `.replace(/\s+/g, " ").trim();

  execSync(
    `podman exec ${container} psql -U root -d carbondev -c ${JSON.stringify(sql)}`,
    { stdio: ["ignore", "ignore", "pipe"] }
  );
  return { transactionId };
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
  // Host party is derived server-side from systemCountryCode (NG in the
  // e2e stack) and always unioned into participatingParties — it is not
  // client-settable, so it's intentionally absent here.
  participatingParties?: string[];
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

// An initial report is now filed for an NDC implementation period
// rather than for a single cooperative approach — a second report
// claiming the same (ndcStartYear, ndcEndYear) pair as an existing one
// is rejected at submit. The e2e DB is long-lived (see
// seedCreditBlockDirect above) and Playwright runs multiple worker
// processes, so real years are far too small a space: this carves
// disjoint decade-long windows out of a synthetic far-future range,
// seeded by wall clock *and* worker index, so periods never collide
// across parallel workers or across reruns.
let ndcPeriodCounter = 0;
export function nextNdcPeriod(): {
  ndcStartYear: number;
  ndcEndYear: number;
  baseYear: number;
} {
  const worker = Number(process.env.TEST_PARALLEL_INDEX ?? 0);
  const epochMin = Math.floor((Date.now() - Date.UTC(2026, 0, 1)) / 60000);
  ndcPeriodCounter += 1;
  const slot = ((epochMin * 64 + worker) * 1000 + ndcPeriodCounter) % 900_000;
  const start = 3000 + slot * 10;
  return { ndcStartYear: start, ndcEndYear: start + 9, baseYear: start - 5 };
}

export interface InitialReportOverrides {
  cooperativeApproachId: string;
  ndcStartYear?: number;
  ndcEndYear?: number;
  ndcType?: string;
  baseYear?: number;
  ndcTarget?: number;
  caMethod?: string;
  caMethodDescription?: string;
  sectors?: string[];
  participationDemonstration?: Record<string, unknown>;
  itmoMetrics?: Record<string, unknown>;
  environmentalIntegrity?: Record<string, unknown>;
}

/**
 * Generates a report on a fresh NDC period and immediately attaches the
 * given cooperative approach to it — the closest equivalent of the old
 * one-report-per-CA `generate` call now that a report covers general
 * NDC fields and its approaches are attached separately. Returns
 * `reportId` (== the new reportNumber) for compatibility with the ~40
 * existing call sites that destructure it that way.
 *
 * Also seeds a base-year Emission row: submitReport now requires one to
 * compute the trajectory, and nothing else in the stack provides it.
 */
export async function generateInitialReport(
  api: ApiClient,
  overrides: InitialReportOverrides
): Promise<{ reportId: string; raw: any }> {
  const period = nextNdcPeriod();
  const ndcStartYear = overrides.ndcStartYear ?? period.ndcStartYear;
  const ndcEndYear = overrides.ndcEndYear ?? period.ndcEndYear;
  const baseYear = overrides.baseYear ?? period.baseYear;

  seedEmissionRowDirect({
    year: baseYear,
    country: "NG",
    co2eqWithoutLand: 100_000,
  });

  const { cooperativeApproachId, ...generalOverrides } = overrides;
  const res = await api.post("national/initialReport/generate", {
    ndcStartYear,
    ndcEndYear,
    ndcType: "SingleYear",
    baseYear,
    ndcTarget: 70_000,
    caMethod: "Trajectory",
    caMethodDescription: "E2E-generated method description",
    sectors: ["Energy"],
    ...generalOverrides,
  });
  await expectOk(res, "generateInitialReport");
  const raw = await api.json<any>(res);
  const data = raw?.data ?? raw;
  const reportNumber = data?.reportNumber ?? data?.id;

  const addRes = await api.post(
    "national/initialReport/cooperativeApproach/add",
    { reportNumber, cooperativeApproachId }
  );
  await expectOk(addRes, "generateInitialReport:addCooperativeApproach");

  return { reportId: reportNumber, raw: data };
}

export async function submitInitialReport(
  api: ApiClient,
  reportId: string
): Promise<any> {
  const res = await api.put(
    `national/initialReport/submit?reportNumber=${encodeURIComponent(reportId)}`
  );
  await expectOk(res, "submitInitialReport");
  const raw = await api.json<any>(res);
  return raw?.data ?? raw;
}

/**
 * Ensures `ndc_target` (and therefore `ndc_target_yearly`) has a row
 * covering the given year, by filing and submitting a throwaway
 * single-year initial report for it. `ndc_target` has no other write
 * path — see NdcTarget's entity comment — so any test that calls
 * `POST /correspondingAdjustment/calculate` for a year needs this first,
 * or the service 400s with `ndcTargetNotDefined`.
 *
 * corresponding-adjustment.spec.ts and cross-cutting.spec.ts both
 * predate the NDC-period restructure and call their local
 * `nextFutureYear()` directly into `/calculate` without this — they are
 * very likely red against a live stack right now. Fixing them means
 * threading `await ensureNdcTargetForYear(apiDna, year)` through every
 * `nextFutureYear()` call site in both files (~19 sites); left undone
 * here for lack of a live stack to verify the rewrite against. This
 * helper is the fix's building block.
 */
export async function ensureNdcTargetForYear(
  api: ApiClient,
  year: number
): Promise<void> {
  const baseYear = year - 1;
  seedEmissionRowDirect({
    year: baseYear,
    country: "NG",
    co2eqWithoutLand: 100_000,
  });

  const genRes = await api.post("national/initialReport/generate", {
    ndcStartYear: year,
    ndcEndYear: year,
    ndcType: "SingleYear",
    baseYear,
    ndcTarget: 70_000,
    caMethod: "Trajectory",
    caMethodDescription: "E2E ndc_target seed",
    sectors: ["Energy"],
  });
  await expectOk(genRes, "ensureNdcTargetForYear:generate");
  const genRaw = await api.json<any>(genRes);
  const reportNumber = (genRaw?.data ?? genRaw)?.reportNumber;

  const ca = await createCooperativeApproach(api, {
    title: `NDC Target Seed ${uniqueSuffix()}`,
  });
  const addRes = await api.post(
    "national/initialReport/cooperativeApproach/add",
    { reportNumber, cooperativeApproachId: ca.cooperativeApproachId }
  );
  await expectOk(addRes, "ensureNdcTargetForYear:add");

  const submitRes = await api.put(
    `national/initialReport/submit?reportNumber=${encodeURIComponent(reportNumber)}`
  );
  await expectOk(submitRes, "ensureNdcTargetForYear:submit");
}

/**
 * Drives a Draft cooperative approach all the way to Active, which is
 * the only route the backend allows: generate its initial report,
 * submit it (the approach auto-transitions Draft -> Submitted), then
 * make the one manual move Submitted -> Active.
 *
 * Most specs only care that they have an Active CA to work against, so
 * this keeps the three-step ritual in one place.
 */
export async function activateCooperativeApproach(
  api: ApiClient,
  cooperativeApproachId: string
): Promise<any> {
  const ir = await generateInitialReport(api, { cooperativeApproachId });
  await submitInitialReport(api, ir.reportId);
  const res = await api.put("national/cooperativeApproach/update", {
    cooperativeApproachId,
    status: "Active",
  });
  await expectOk(res, "activateCooperativeApproach");
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

// ---------------------------------------------------------------------------
// Programme + credit-lifecycle factories
// ---------------------------------------------------------------------------
// Shapes validated against:
//   - backend/services/libs/shared/src/dto/programme.dto.ts        (ProgrammeDto)
//   - backend/services/libs/shared/src/dto/programme.properties.ts (ProgrammeProperties)
//   - backend/services/libs/shared/src/dto/programme.approve.ts    (ProgrammeApprove)
//   - backend/services/libs/shared/src/dto/programme.mitigation.issue.ts
//   - backend/services/libs/shared/src/dto/credit.transfer.dto.ts  (CreditTransferDto)
//   - backend/services/libs/shared/src/dto/credit.retire.request.dto.ts
//   - backend/services/libs/shared/src/enum/credit.retirement.type.enum.ts

export interface ProgrammeOverrides {
  cooperativeApproachId?: string;
  article6trade?: boolean;
  title?: string;
  externalId?: string;
  sectoralScope?: string;
  sector?: string;
  startTime?: number;
  endTime?: number;
  proponentTaxVatId?: string[];
  proponentPercentage?: number[];
  creditEst?: number;
  creditUnit?: string;
  implementinguser?: string;
  environmentalAssessmentRegistrationNo?: string;
  programmeProperties?: Record<string, unknown>;
  [extra: string]: unknown;
}

/**
 * Real POST /national/programme/create. Required fields derived from
 * ProgrammeDto + ProgrammeProperties. Defaults produce a minimally-valid
 * Article 6 programme for a single proponent in sector Energy / sectoral
 * scope "1". Override any field to probe validation edges.
 */
export async function createProgramme(
  api: ApiClient,
  overrides: ProgrammeOverrides = {}
): Promise<{ programmeId: string; raw: any }> {
  const suffix = uniqueSuffix();
  const nowMs = Date.now();
  // class-validator @IsNotPastDate passes when the value is in the
  // future; use +1 day / +365 days as safe defaults.
  const defaultStart = nowMs + 24 * 60 * 60 * 1000;
  const defaultEnd = defaultStart + 365 * 24 * 60 * 60 * 1000;

  const {
    cooperativeApproachId,
    article6trade,
    title,
    externalId,
    sectoralScope,
    sector,
    startTime,
    endTime,
    proponentTaxVatId,
    proponentPercentage,
    creditEst,
    creditUnit,
    implementinguser,
    environmentalAssessmentRegistrationNo,
    programmeProperties,
    ...extras
  } = overrides;

  // Minimal PDF payload accepted by uploadDocument
  // (programme.service.ts:948). The data URL layout is
  // "data:<mime>;base64,<payload>"; getFileExtension looks the "pdf"
  // token up in fileExtensionMap (programme.service.ts:212). The
  // payload body itself is not validated.
  const designDocumentDataUrl =
    "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKCg==";

  const body: Record<string, unknown> = {
    title: title ?? `Test Programme ${suffix}`,
    externalId: externalId ?? `TEST-EXT-${suffix}`,
    sectoralScope: sectoralScope ?? "1",
    sector: sector ?? "Energy",
    startTime: startTime ?? defaultStart,
    endTime: endTime ?? defaultEnd,
    // programme.service.ts:2097-2107 looks each taxId up in the
    // company table via findByTaxId; a synthetic string fails. The
    // seeded dev stack has a PD at taxId "33333" (Org 2); tests that
    // need multi-proponent or specific roles should override.
    proponentTaxVatId: proponentTaxVatId ?? ["33333"],
    proponentPercentage: proponentPercentage ?? [100],
    article6trade: article6trade ?? true,
    cooperativeApproachId,
    creditEst: creditEst ?? 1000,
    creditUnit: creditUnit ?? "tCO2e",
    // The DTO validates @IsString only when article6trade=false, but
    // the underlying programme.entity.ts column is bigint — the
    // ledger-replicator NEVER converts and a string here poisons the
    // event stream (replicator stalls retrying). Use the seeded DNA
    // admin's user id (6) to keep the round-trip valid.
    implementinguser: implementinguser ?? 6,
    environmentalAssessmentRegistrationNo:
      environmentalAssessmentRegistrationNo ?? `EAR-${suffix}`,
    // programme.service.ts:2225-2243 rejects create on CARBON_TRANSPARENCY
    // and CARBON_UNIFIED systems when designDocument is absent; the dev
    // stack is CARBON_TRANSPARENCY so the guard fires. A tiny base64
    // PDF header suffices.
    designDocument: designDocumentDataUrl,
    programmeProperties: {
      estimatedProgrammeCostUSD: 10000,
      // programme.service.ts:1926-1943 validates every location string
      // against region.regionName (lang=en). The seeded region table in
      // the dev stack holds Nigerian states; "Abia" is the first
      // alphabetically and is guaranteed to exist. Passing a
      // country-code like "NG" here fails validation.
      geographicalLocation: ["Abia"],
      greenHouseGasses: ["CO2"],
      ...(programmeProperties ?? {}),
    },
    ...extras,
  };

  const res = await api.post("national/programme/create", body);
  await expectOk(res, "createProgramme");
  const raw = await api.json<any>(res);
  const data = raw?.data ?? raw;
  const programmeId: string =
    data?.programmeId ?? data?.id ?? data?.programme?.programmeId;
  return { programmeId, raw: data };
}

/**
 * PUT /national/programme/authorize — ProgrammeApprove DTO
 * ({ programmeId, issueAmount?, comment? }). Throws on non-2xx.
 */
export async function authorizeProgramme(
  api: ApiClient,
  programmeId: string
): Promise<void> {
  const res = await api.put("national/programme/authorize", { programmeId });
  await expectOk(res, "authorizeProgramme");
}

// Tiny well-formed base64 PDF header. The registry uploads this as-is
// to the document store and does not validate the PDF body — only that
// the data URL prefix matches a known mime type
// (programme.service.ts:212 fileExtensionMap).
const TINY_PDF_DATA_URL =
  "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKCg==";

/**
 * POST /national/programme/addDocument with type=DESIGN_DOCUMENT. When
 * called as a DNA user, the document is auto-ACCEPTED. METHODOLOGY
 * uploads require an ACCEPTED DESIGN_DOCUMENT to exist first
 * (programme.service.ts:1665-1690 getExpectedDoc → 'invalidDocumentUpload'
 * 400 if missing).
 */
export async function uploadDesignDocument(
  api: ApiClient,
  programmeId: string
): Promise<void> {
  const res = await api.post("national/programme/addDocument", {
    programmeId,
    // DocType.DESIGN_DOCUMENT = "0" (string value of the enum).
    type: "0",
    data: TINY_PDF_DATA_URL,
  });
  await expectOk(res, "uploadDesignDocument");
}

/**
 * POST /national/programme/addDocument with type=METHODOLOGY_DOCUMENT.
 * When called as a DNA user the document is auto-ACCEPTED on the same
 * request and approveDocumentCommit fires, flipping programme
 * .currentStage from AWAITING_AUTHORIZATION to APPROVED
 * (programme.service.ts:1166-1183). Required to unblock the
 * /authorize state machine, which demands currentStage=APPROVED.
 *
 * Caller must have already uploaded an ACCEPTED DESIGN_DOCUMENT for
 * this programme (the addDocument flow validates the predecessor at
 * service line 1665). For DNA-driven flows that means a prior
 * uploadDesignDocument() call against the same programmeId.
 */
export async function uploadMethodologyDocument(
  api: ApiClient,
  programmeId: string
): Promise<void> {
  const res = await api.post("national/programme/addDocument", {
    programmeId,
    // DocType.METHODOLOGY_DOCUMENT = "1" (string value of the enum).
    type: "1",
    data: TINY_PDF_DATA_URL,
  });
  await expectOk(res, "uploadMethodologyDocument");
}

export interface IssueCreditAction {
  actionId: string;
  issueCredit: number;
}

/**
 * PUT /national/programme/issue — ProgrammeMitigationIssue DTO. The
 * request body wraps the per-action array under `issueAmount` (see
 * programme.mitigation.issue.ts: `issueAmount: mitigationIssueProperties[]`).
 */
export async function issueCredits(
  api: ApiClient,
  programmeId: string,
  actions: IssueCreditAction[]
): Promise<{ issuedAmount: number; raw: any }> {
  const res = await api.put("national/programme/issue", {
    programmeId,
    issueAmount: actions,
  });
  await expectOk(res, "issueCredits");
  const raw = await api.json<any>(res);
  const data = raw?.data ?? raw;
  const issuedAmount = actions.reduce((sum, a) => sum + a.issueCredit, 0);
  return { issuedAmount, raw: data };
}

export interface TransferOverrides {
  blockId: string;
  receiverOrgId: number;
  amount: number;
  remarks?: string;
}

/**
 * POST /national/creditTransactionsManagement/transfer — CreditTransferDto
 * ({ blockId, receiverOrgId, amount }). The service returns
 * { amount, toCompanyId, fromCompanyId } under data; `transactionId` is
 * not part of the envelope in the current implementation so it surfaces
 * as `undefined` unless the controller starts including one.
 */
export async function initiateTransfer(
  api: ApiClient,
  overrides: TransferOverrides
): Promise<{ transactionId?: string; raw: any }> {
  const body: Record<string, unknown> = {
    blockId: overrides.blockId,
    receiverOrgId: overrides.receiverOrgId,
    amount: overrides.amount,
  };
  if (overrides.remarks !== undefined) {
    body.remarks = overrides.remarks;
  }
  const res = await api.post(
    "national/creditTransactionsManagement/transfer",
    body
  );
  await expectOk(res, "initiateTransfer");
  const raw = await api.json<any>(res);
  const data = raw?.data ?? raw;
  const transactionId: string | undefined =
    data?.transactionId ?? data?.id ?? data?.txRef;
  return { transactionId, raw: data };
}

export type CreditRetirementType =
  | "CROSS_BORDER_TRANSACTIONS"
  | "VOLUNTARY_CANCELLATIONS"
  | "USE_TOWARDS_NDC"
  | "FIRST_TRANSFER_TOWARDS_NDC"
  | "FIRST_TRANSFER_FOR_OIMP"
  | "OMGE_CANCELLATION"
  | "SOP_ADAPTATION";

// Wire values from backend CreditRetirementTypeEnum. The DTO validates
// against the *string values* (e.g. "Cross-Border Transactions"), not
// the TypeScript enum keys, so we map here before POSTing.
//
// USE_TOWARDS_NDC is MO-only (domestic); FIRST_TRANSFER_TOWARDS_NDC /
// FIRST_TRANSFER_FOR_OIMP are ITMO-only and gated by the block's ITMO
// authorization purpose — see credit.transaction.sub.types.enum.ts.
const RETIREMENT_TYPE_WIRE: Record<CreditRetirementType, string> = {
  CROSS_BORDER_TRANSACTIONS: "Cross-Border Transactions",
  VOLUNTARY_CANCELLATIONS: "Voluntary Cancellations",
  USE_TOWARDS_NDC: "Use Towards NDC",
  FIRST_TRANSFER_TOWARDS_NDC: "First Transfer Towards NDC",
  FIRST_TRANSFER_FOR_OIMP: "First Transfer For OIMP",
  OMGE_CANCELLATION: "OMGE Cancellation",
  SOP_ADAPTATION: "SOP Adaptation",
};

export interface PerformRetireActionOverrides {
  blockId: string;
  retirementType: CreditRetirementType;
  amount: number;
  remarks?: string;
  country?: string;
  organizationName?: string;
}

/**
 * POST /national/creditTransactionsManagement/retireRequest.
 *
 * Phase 1 of the two-phase retirement flow: a PROJECT_DEVELOPER creates
 * a pending retirement request against one of their credit blocks. The
 * controller route is /retireRequest (not /performRetireAction — that
 * route handles phase 2, approve/reject/cancel, per
 * credit.transactions.management.controller.ts:39-64). The body mirrors
 * CreditRetireRequestDto — requires blockId + retirementType + amount,
 * plus country + organizationName when retirementType ===
 * CROSS_BORDER_TRANSACTIONS (ValidateIf in credit.retire.request.dto.ts).
 * `retirementType` accepts the TypeScript enum keys above and is
 * wire-encoded to the backend string values.
 *
 * The original factory name (performRetireAction) is retained so
 * existing imports don't break; it now targets the correct initiation
 * route.
 */
export async function performRetireAction(
  api: ApiClient,
  overrides: PerformRetireActionOverrides
): Promise<{ raw: any; retirementId?: string }> {
  const body: Record<string, unknown> = {
    blockId: overrides.blockId,
    amount: overrides.amount,
    retirementType: RETIREMENT_TYPE_WIRE[overrides.retirementType],
  };
  if (overrides.remarks !== undefined) body.remarks = overrides.remarks;
  if (overrides.country !== undefined) body.country = overrides.country;
  if (overrides.organizationName !== undefined) {
    body.organizationName = overrides.organizationName;
  }
  const res = await api.post(
    "national/creditTransactionsManagement/retireRequest",
    body
  );
  await expectOk(res, "performRetireAction");
  const raw = await api.json<any>(res);
  const data = raw?.data ?? raw;
  // createRetireRequest returns { id, amount } under data. The
  // transactionId returned here can be fed straight into
  // approveRetireRequest below.
  return { raw: data, retirementId: data?.id ?? data?.transactionId };
}

/**
 * POST /national/creditTransactionsManagement/performRetireAction —
 * phase 2 of the retirement flow. DNA Admin accepts a pending retire
 * request, which triggers programmeLedgerService.retirementRequestAction
 * (programme-ledger.service.ts:756). Accept drives the ledger write that
 * applies mapRetirementTypeToAccountType to the derived retirement
 * block (programme-ledger.service.ts:844-872, 931-967).
 */
export async function approveRetireRequest(
  api: ApiClient,
  transactionId: string | number
): Promise<{ raw: any }> {
  const res = await api.post(
    "national/creditTransactionsManagement/performRetireAction",
    { transactionId: String(transactionId), action: "ACCEPT" }
  );
  await expectOk(res, "approveRetireRequest");
  const raw = await api.json<any>(res);
  return { raw: raw?.data ?? raw };
}
