function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Set it in your .env file (see .env.example).`
    );
  }
  return value;
}

export default () => ({
  stage: process.env.STAGE || "local",
  systemCountry: process.env.systemCountryCode || "NG",
  systemCountryName: process.env.systemCountryName || "CountryX",
  systemContinentName: process.env.systemContinentName || "CountryX",
  countryClimateFundName:
    process.env.countryClimateFundName || "CountryX Climate Fund (Pvt) Ltd",
  defaultCreditUnit: process.env.defaultCreditUnit || "ITMO",
  year: parseInt(process.env.REPORT_YEAR),
  dateTimeFormat: "DD LLLL yyyy @ HH:mm",
  dateFormat: "DD LLLL yyyy",
  database: {
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER || "hquser",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "carbondev",
    synchronize: process.env.NODE_ENV === "dev" || process.env.DB_SYNCHRONIZE === "true",
    autoLoadEntities: true,
    logging: ["error"],
    // Apply pending migrations at startup when explicitly opted in (prod/staging).
    // Uses the compiled output paths at runtime; the CLI uses the .ts sources.
    migrations: ["dist/migrations/*.js"],
    migrationsRun: process.env.DB_MIGRATIONS_RUN === "true",
    migrationsTableName: "migrations",
  },
  jwt: {
    expiresIn: process.env.EXPIRES_IN || "7200",
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "12h",
    userSecret: required("USER_JWT_SECRET"),
    refreshTokenSecret: required("REFRESH_TOKEN_JWT_SECRET"),
    adminSecret: required("ADMIN_JWT_SECRET"),
    encodePassword: process.env.ENCODE_PASSWORD || false,
    saltRounds: process.env.SALT_ROUNDS || 10,
  },
  ledger: {
    name: "carbon-registry-" + (process.env.NODE_ENV || "dev"),
    table: "programmes",
    overallTable: "overall",
    companyTable: "company",
    projectTable: "project",
    creditBlocksTable: "credit_blocks",
  },
  email: {
    source: process.env.SOURCE_EMAIL || "noreply@example.com",
    endpoint: required("SMTP_ENDPOINT"),
    username: required("SMTP_USERNAME"),
    password: process.env.SMTP_PASSWORD,
    disabled: process.env.IS_EMAIL_DISABLED === "true" ? true : false,
    disableLowPriorityEmails:
      process.env.DISABLE_LOW_PRIORITY_EMAIL === "true" ? true : false,
    getemailprefix: process.env.EMAILPREFIX || "🏬📐 🇦🇶",
    adresss: process.env.HOST_ADDRESS || "Address <br>Region, Country Zipcode",
    configSet: process.env.EMAIL_CONFIG_SET || "",
  },
  s3CommonBucket: {
    name: process.env.S3_COMMON_BUCKET || "carbon-common-dev",
  },
  azureBlobStorage: {
    // No account-name setting: the connection string carries it.
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    containerName: process.env.AZURE_STORAGE_CONTAINER || "files",
  },
  host: process.env.HOST || "http://localhost:3030",
  backendHost: process.env.BACKEND_HOST || "http://localhost:3000",
  liveChat: "https://undp2020cdo.typeform.com/to/emSWOmDo",
  mapbox: {
    key: process.env.MAPBOX_PK,
  },
  openstreet: {
    retrieve: process.env.OPENSTREET_QUERY === "true" || false,
  },
  asyncQueueName: required("ASYNC_QUEUE_NAME"),
  ITMOSystem: {
    endpoint: process.env.ITMO_ENDPOINT,
    apiKey: process.env.ITMO_API_KEY,
    email: process.env.ITMO_EMAIL,
    password: process.env.ITMO_PASSWORD,
    enable: process.env.ITMO_ENABLE === "true" ? true : false,
  },
  CERTIFIER: {
    image: process.env.CERTIFIER_IMAGE,
  },
  registry: {
    syncEnable: process.env.SYNC_ENABLE === "true" ? true : false,
    endpoint: process.env.SYNC_ENDPOINT,
    apiToken: process.env.SYNC_API_TOKEN,
  },
  docGenerate: {
    ministerName: process.env.MINISTER_NAME || "Minister X",
    ministerNameAndDesignation:
      process.env.MINISTER_NAME_AND_DESIGNATION ||
      "\nHonorable Minister X\nMinister\nMinistry of Environment, Forestry & Tourism",
    ministryName: "Ministry of Environment, Forestry & Tourism",
    countryCapital: process.env.COUNTRY_CAPITAL || "Capital X",
    contactEmailForQuestions:
      process.env.CONTACT_EMAIL || "contactus@email.com",
  },
  cadTrust: {
    enable: process.env.CADTRUST_ENABLE === "true" ? true : false,
    endpoint: process.env.CADTRUST_ENDPOINT,
  },
  // CADT v2 client (@app/cadtrust). Separate from the legacy v1 `cadTrust` block
  // above — v1 and v2 are isolated on the node and can run side by side.
  cadTrustV2: {
    enable: process.env.CADT_V2_ENABLE === "true" ? true : false,
    baseUrl: process.env.CADT_V2_BASE_URL || "http://localhost:31310/v2",
    apiKey: process.env.CADT_V2_API_KEY,
    timeoutMs: Number(process.env.CADT_V2_TIMEOUT_MS || 30000),
    // How often the CAD Trust-only async lane re-runs CadTrustReconcileHandler, independent of
    // the shared email/registry queue's own polling cadence. See
    // src/async-operations-handler/cadtrust-async-operations-handler.service.ts and
    // libs/shared/src/cadtrust-sync/README.md's "Re-driving children on update, and reconciling
    // on a schedule" section. Only read in the process running RUN_MODULE=cadtrust-operations-handler.
    reconcileIntervalMs: Number(process.env.CADT_V2_RECONCILE_INTERVAL_MS || 30 * 1000),
    // Consecutive commit-failure count (see cadtrust_sync_record.attemptCount) past which
    // CadTrustCommitHandler logs a loud, one-time-per-crossing "this may need a human" warning
    // instead of quietly retrying forever. Not every failure this deep is a stuck commit — see
    // the handler's own doc — but it is the signal an operator should investigate
    // POST /staging/reset-committed rather than assume it will clear itself.
    commitStuckThreshold: Number(process.env.CADT_V2_COMMIT_STUCK_THRESHOLD || 6),
    // Per-record cap on `cadtrust_sync_record.attemptCount` past which CadTrustReconcileHandler
    // stops re-driving a FAILED project/snapshot/credit-block record — otherwise a permanently
    // broken record (bad data, a resource CAD Trust will never accept) would be retried forever,
    // every reconcileIntervalMs tick, indefinitely. Once a record crosses this it is left alone;
    // findStuckFailures/commitStuckThreshold above is the separate signal that surfaces it to an
    // operator.
    reconcileMaxAttempts: Number(process.env.CADT_V2_RECONCILE_MAX_ATTEMPTS || 10),
    // Sent as CAD Trust's `projectRegistryName` — the name this registry is
    // published under on the network, not the CADT node's own identity.
    registryName: process.env.CADT_V2_REGISTRY_NAME || process.env.SYSTEM_NAME || "SystemX",
    // Recorded as the `author` on each staging commit.
    commitAuthor: process.env.CADT_V2_COMMIT_AUTHOR || process.env.SYSTEM_NAME || "SystemX",
    // The registry's own CAD Trust organization name — used only for logging and
    // the verify-only bootstrap check. The organization is never created by this
    // codebase (see libs/shared/src/cadtrust-sync/handlers/bootstrap.handler.ts).
    orgName:
      process.env.CADT_V2_ORG_NAME ||
      process.env.CADT_V2_REGISTRY_NAME ||
      process.env.SYSTEM_NAME ||
      "SystemX",
    // This registry's one national crediting program and one methodology,
    // staged once by CadTrustBootstrapHandler. See
    // CadTrustRegistryProfileService.assertConfigured() for the guard that
    // refuses to publish these under a placeholder value.
    program: {
      name:
        process.env.CADT_V2_PROGRAM_NAME ||
        `${process.env.systemCountryName || "CountryX"} National Carbon Crediting Demo Program`,
      registry:
        process.env.CADT_V2_PROGRAM_REGISTRY ||
        process.env.CADT_V2_REGISTRY_NAME ||
        process.env.SYSTEM_NAME ||
        "SystemX",
      registryActivityId:
        process.env.CADT_V2_PROGRAM_REGISTRY_ACTIVITY_ID || process.env.systemCountryCode || "NG",
      registryProgramId: process.env.CADT_V2_PROGRAM_REGISTRY_PROGRAM_ID || "NG-NCC",
      description: process.env.CADT_V2_PROGRAM_DESCRIPTION || "National Carbon Crediting Program",
    },
    methodology: {
      code: process.env.CADT_V2_METHODOLOGY_CODE || `${process.env.systemCountryCode || "NG"}-NCC`,
      name: process.env.CADT_V2_METHODOLOGY_NAME || "National Carbon Crediting",
      version: process.env.CADT_V2_METHODOLOGY_VERSION || "1.0",
      date: process.env.CADT_V2_METHODOLOGY_DATE || new Date().toISOString().split("T")[0],
      link: process.env.CADT_V2_METHODOLOGY_LINK,
      type: process.env.CADT_V2_METHODOLOGY_TYPE || 'Not Determined',
    },
    // Picklist "validation_body" — CAD Trust's validation_body list is a closed set of ~90
    // internationally accredited VVBs; this registry's Independent Certifiers will not be on it by
    // name (see mappers/validation.mapper.ts). Always used as-is for every validation sync — not a
    // fallback-if-unmatched scheme. "DNV" is a real live-observed entry (picklistValues.ts); reconfirm
    // against GET /v2/governance/meta/pickList on the target node before go-live.
    validationBodyDefault: process.env.CADT_V2_VALIDATION_BODY || "DNV",
    // Picklist "verification_body" — same closed international VVB list as validation_body, and
    // the same reasoning: a national verifying body will not be on it by name (see
    // mappers/verification.mapper.ts). Defaults to the same value as validationBodyDefault, since
    // both fields are filled by the same category of accredited-VVB placeholder; override
    // separately if the target node's verification_body and validation_body lists diverge.
    verificationBodyDefault:
      process.env.CADT_V2_VERIFICATION_BODY || process.env.CADT_V2_VALIDATION_BODY || "DNV",
    // Picklist "unit_type", required on every CAD Trust unit. Unlike every other CADT_V2_* value
    // in this block, there is NO safe hardcoded fallback — no unit_type value has ever been
    // confirmed against a live node (see mappers/picklist.map.ts). Left unset until an operator
    // sets it; CadTrustRegistryProfileService.getUnitType() returns undefined rather than a guess,
    // and the credit-unit mapper's warnOnUnknownValues call will flag that loudly in the logs.
    unitType: process.env.CADT_V2_UNIT_TYPE || "Not Determined",
  },
  systemType: process.env.SYSTEM_TYPE || "CARBON_UNIFIED_SYSTEM",
  systemName: process.env.SYSTEM_NAME || "SystemX",
  environmentalManagementActHyperlink:
    process.env.ENVIRONMENTAL_MANAGEMENT_ACT_HYPERLINK || "",
  cache: {
    project: {
      ttl: process.env.CACHE_PROJECT_TTL || 60 * 1000, // ttl is set in milliseconds
      max: process.env.CACHE_PROJECT_MAX || 100, // maximum records to be held in the cache
    },
    retirement: {
      ttl: process.env.CACHE_RETIREMENT_TTL || 60 * 1000, // ttl is set in milliseconds
      max: process.env.CACHE_RETIREMENT_MAX || 100, // maximum records to be held in the cache
    },
    organisation: {
      ttl: process.env.CACHE_ORGANISATION_TTL || 60 * 1000, // ttl is set in milliseconds
      max: process.env.CACHE_ORGANISATION_MAX || 100, // maximum records to be held in the cache
    },
  },
  rateLimiter: {
    project: {
      limit: process.env.RATE_LIMIT_PROJECT_LIMIT || 100, // number of requests for the given time
      duration: process.env.RATE_LIMIT_PROJECT_DURATION || 60, // duration in seconds
    },
    retirement: {
      limit: process.env.RATE_LIMIT_RETIREMENT_LIMIT || 100, // number of requests for the given time
      duration: process.env.RATE_LIMIT_RETIREMENT_DURATION || 60, // duration in seconds
    },
    organisation: {
      limit: process.env.RATE_LIMIT_ORGANISATION_LIMIT || 100, // number of requests for the given time
      duration: process.env.RATE_LIMIT_ORGANISATION_DURATION || 60, // duration in seconds
    },
  },
  serialNumber: {
    maxProjectId: parseInt(process.env.MAXIMUM_PROJECT_ID) || 999999,
    creditIdentifier: process.env.CREDIT_IDENTIFIER || "CA0NNN",
    firstTransferringPartyId: process.env.FIRST_TRANSFERRING_PARTY_ID || "XX",
    seperator: process.env.SERIAL_NUMBER_SEPERATOR || "-",
  },
  itmo: {
    omgePercentage: parseFloat(process.env.ITMO_OMGE_PERCENTAGE) || 2,
    sopPercentage: parseFloat(process.env.ITMO_SOP_PERCENTAGE) || 5,
    autoDeductAtIssuance:
      process.env.ITMO_AUTO_DEDUCT_AT_ISSUANCE === "false" ? false : true,
  },
  AEF: {
    artical6RecordId: process.env.NOT_APPLICABLE_LABEL || "NA",
    cooperativeApproach: process.env.COOPERATIVE_APPROACH || "Article 6.2",
    firstUniqueIdentifier: process.env.NOT_APPLICABLE_LABEL || "NA",
    lastUniqueIdentifier: process.env.NOT_APPLICABLE_LABEL || "NA",
    metric: process.env.EMISSION_METRIC || "tCO2",
    quantityInMetric: process.env.NOT_APPLICABLE_LABEL || "NA",
    conversionFactor: process.env.NOT_APPLICABLE_LABEL || "NA",
    firstTransferingParty: process.env.systemCountryCode || "NG",
    purposeForAuthorization: process.env.ACTION_TYPE_LABEL_LABEL || "NDC",
    OIMP: process.env.NOT_APPLICABLE_LABEL || "NA",
    firstTransferDefinition:
      process.env.FIRST_TRANSFER_DEFINITION || "Authorization",
    transferingParty: process.env.systemCountryCode || "NG",
    defaultAquiringParty: process.env.systemCountryCode || "NG",
    purposeForCancellation: process.env.ACTION_TYPE_LABEL_LABEL || "NDC",
    actionBy: process.env.NOT_APPLICABLE_LABEL || "NA",
    party: process.env.PARTY || "Sri Lanka",
  },
  // AEF V2 (@app/aef-v2) config. Deliberately separate from `AEF` above:
  // that block's `party` is a display name ("Sri Lanka"), not usable as
  // `aefT1SubmissionParty`, which the AEF nomenclature requires as ISO
  // 3166-1 alpha-3. Left undefined here when unset — the registry adaptor
  // falls back to an alpha-3 lookup of `systemCountry` at startup.
  AEF_V2: {
    party: process.env.AEF_PARTY,
    // Alpha-3 + 2 digits, e.g. "VUT01". No registry source for this today —
    // leave unset to derive `${party}01` (see resolvePartyItmoRegistryId in
    // aef-v2-defaults.factory.ts); set explicitly only to override that with
    // a real CARP-assigned ID.
    partyItmoRegistryId: process.env.AEF_PARTY_ITMO_REGISTRY_ID,
    ndcFirstYear: parseInt(process.env.AEF_NDC_FIRST_YEAR) || 2021,
    ndcLastYear: parseInt(process.env.AEF_NDC_LAST_YEAR) || 2030,
    // Interim default for AefT2/T3/T4 MitigationType, which this registry has
    // no per-project source for yet (ProjectEntity has sector/sectoralScope
    // only). See sectoralScopeMitigationType in aef-code.maps.ts for the
    // partial override.
    defaultMitigationType:
      process.env.AEF_DEFAULT_MITIGATION_TYPE || "Emission reductions",
    // "blocks": reconstructs holdings from current CreditBlocksEntity state
    // (approximate as-at reconstruction — see RegistryHoldingsProvider).
    // "actions": replays this registry's own aef_v2_t3_actions rows, exact
    // but only correct for years written after the write hook landed.
    holdingsSource: process.env.AEF_HOLDINGS_SOURCE || "blocks",
    // When true (default), an unexpected error deriving an AEF V2 row from a
    // ledger event fails the whole replicator transaction rather than being
    // logged and skipped — an ITMO movement silently missing its AEF row is
    // a defect in a legally filed report.
    strictWrite: process.env.AEF_STRICT_WRITE !== "false",
    submission: {
      enabled: process.env.AEF_SUBMISSION_ENABLED === "true",
      endpoint: process.env.AEF_SUBMISSION_ENDPOINT,
      apiKey: process.env.AEF_SUBMISSION_API_KEY,
      timeoutMs: parseInt(process.env.AEF_SUBMISSION_TIMEOUT_MS) || 30000,
    },
    // In-process start-of-year rollover cron (national-api container
    // deployments, see AefV2SchedulerService). Turn off where the rollover
    // is driven externally instead (the serverless `aef-rollover` schedule)
    // or where more than one national-api replica runs — the snapshot steps
    // are read-then-write, so concurrent ticks could double-insert Table 4/5
    // rows.
    rolloverCronEnabled: process.env.AEF_ROLLOVER_CRON_ENABLED !== "false",
  },
});
