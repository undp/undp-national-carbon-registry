import { CadTrustLocalEntityType } from "../enum/cadtrust.local.entity.type.enum";
import { CadTrustResourceType } from "../enum/cadtrust.resource.type.enum";
import { CadTrustSyncStatus } from "../enum/cadtrust.sync.status.enum";
import { AccountType } from "../enum/account.type.enum";
import { CreditTransactionSubTypesEnum } from "../enum/credit.transaction.sub.types.enum";
import { CadTrustCreditResourceService } from "./cadtrust-credit-resource.service";

const REF_ID = "0042";
const CREDIT_BLOCK_ID = "CA0001-XX-XX-1-1-100";

const CREDIT_BLOCK = {
  creditBlockId: CREDIT_BLOCK_ID,
  projectRefId: REF_ID,
  serialNumber: "CA0001-XX-XX-1-1-100-2026",
  vintage: "2026",
  creditAmount: 100,
  accountType: AccountType.HOLDING,
  ownerCompanyId: 7,
  txTime: 1_700_000_000_000,
} as any;

function buildService(
  overrides: {
    creditBlock?: any;
    company?: any;
    latestRetirement?: any;
    country?: any;
    authorizedEntity?: any;
    hostCountryCode?: string;
    hostCountryName?: string;
    stageCreate?: jest.Mock;
    stageUpdate?: jest.Mock;
  } = {}
) {
  const creditBlocksRepo = {
    findOne: jest.fn(async () => ("creditBlock" in overrides ? overrides.creditBlock : CREDIT_BLOCK)),
  };
  const creditTransactionsRepo = {
    findOne: jest.fn(async () => ("latestRetirement" in overrides ? overrides.latestRetirement : null)),
  };
  const companyRepo = {
    findOne: jest.fn(async () => ("company" in overrides ? overrides.company : { name: "Kunene Developers" })),
  };
  const countryRepo = {
    findOne: jest.fn(async () => ("country" in overrides ? overrides.country : { alpha2: "KE", name: "Kenya" })),
  };
  const caAuthorizedEntityRepo = {
    findOne: jest.fn(async () =>
      "authorizedEntity" in overrides ? overrides.authorizedEntity : { entityIdentifier: "AE-EXT-1" }
    ),
  };
  const registryProfile = {
    getHostCountryCode: jest.fn(() => overrides.hostCountryCode ?? "XX"),
    getHostCountryName: jest.fn(() => overrides.hostCountryName ?? "Countryland"),
  };

  const syncRecords = {
    find: jest.fn(async () => null),
    findLatestSynced: jest.fn(async () => null),
    getCadTrustId: jest.fn(async () => undefined),
    getSyncedCadTrustId: jest.fn(async () => undefined),
    getLatestSyncedCadTrustId: jest.fn(async () => undefined),
    markStaged: jest.fn(async () => undefined),
    markFailed: jest.fn(async () => undefined),
    recordSyncProps: jest.fn(async () => undefined),
  };

  const projectResources = {
    existingSync: jest.fn(async (_key: any, _label: string) => ({ failedBefore: false })),
    adoptOrphanedStagedRow: jest.fn(async () => undefined),
  };

  const verificationMapper = { toCreateInput: jest.fn(async () => ({ verificationId: "x" })) };
  const unitStageCreate =
    overrides.stageCreate ??
    jest.fn(async () => ({
      staged: true as const,
      response: { message: "ok", uuid: "staging-unit-1", cadTrustUnitId: "cadt-unit-1", success: true },
    }));
  const unitStageUpdate = overrides.stageUpdate ?? jest.fn(async () => ({ staged: true as const }));
  const unitMapper = { toUnitInput: jest.fn(async () => ({ unitSerialId: "x", cadTrustIssuanceId: "cadt-issuance-1" })) };
  const unitLabelMapper = {
    toCreateInput: jest.fn((cadTrustLabelId: string, cadTrustUnitId: string, labelUnitDate: string) => ({
      cadTrustLabelId,
      cadTrustUnitId,
      labelUnitDate,
    })),
  };

  const verificationStageCreate = jest.fn(async () => ({
    staged: true as const,
    response: { message: "ok", uuid: "staging-verification-1", cadTrustVerificationId: "cadt-verification-1", success: true },
  }));
  const issuanceStageCreate = jest.fn(async () => ({
    staged: true as const,
    response: { message: "ok", uuid: "staging-issuance-1", cadTrustIssuanceId: "cadt-issuance-1", success: true },
  }));
  const labelStageCreate = jest.fn(async () => ({
    staged: true as const,
    response: { message: "ok", uuid: "staging-label-1", cadTrustLabelId: "cadt-label-1", success: true },
  }));
  const unitLabelStageCreate = jest.fn(async () => ({
    staged: true as const,
    response: { message: "ok", uuid: "staging-unitlabel-1", cadTrustUnitLabelId: "cadt-unitlabel-1", success: true },
  }));

  const cadTrustV2Service = {
    getClient: () => ({
      verification: { stageCreate: verificationStageCreate },
      issuance: { stageCreate: issuanceStageCreate },
      unit: { stageCreate: unitStageCreate, stageUpdate: unitStageUpdate },
      label: { stageCreate: labelStageCreate },
      unitLabel: { stageCreate: unitLabelStageCreate },
    }),
  };
  const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

  const service = new CadTrustCreditResourceService(
    creditBlocksRepo as any,
    creditTransactionsRepo as any,
    companyRepo as any,
    countryRepo as any,
    caAuthorizedEntityRepo as any,
    syncRecords as any,
    projectResources as any,
    verificationMapper as any,
    unitMapper as any,
    unitLabelMapper as any,
    registryProfile as any,
    cadTrustV2Service as any,
    logger as any
  );

  return {
    service,
    creditBlocksRepo,
    creditTransactionsRepo,
    companyRepo,
    countryRepo,
    caAuthorizedEntityRepo,
    registryProfile,
    syncRecords,
    projectResources,
    unitMapper,
    unitStageCreate,
    unitStageUpdate,
    verificationStageCreate,
    issuanceStageCreate,
    labelStageCreate,
    unitLabelStageCreate,
    logger,
  };
}

describe("CadTrustCreditResourceService", () => {
  describe("ensureVerification", () => {
    const PROPS = {
      refId: REF_ID,
      documentVersion: 1,
      verificationBodyName: "Kunene Certifiers",
    };

    it("stages a verification record keyed by refId + documentVersion", async () => {
      const { service, syncRecords, verificationStageCreate } = buildService();
      syncRecords.getCadTrustId.mockResolvedValue("cadt-project-1");

      const result = await service.ensureVerification(PROPS);

      expect(verificationStageCreate).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ cadTrustId: "cadt-verification-1", commitOwed: true });
      expect(syncRecords.markStaged).toHaveBeenCalledWith(
        expect.objectContaining({
          localEntityType: CadTrustLocalEntityType.VERIFICATION,
          localId: "0042-VERIFICATION-v1",
        }),
        { cadTrustId: "cadt-verification-1", stagingUuid: "staging-verification-1" },
        expect.any(Object)
      );
    });

    it("is marked FAILED when the project has not synced yet", async () => {
      const { service, syncRecords, verificationStageCreate } = buildService();
      syncRecords.getCadTrustId.mockResolvedValue(undefined);

      const result = await service.ensureVerification(PROPS);

      expect(verificationStageCreate).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
      expect(syncRecords.markFailed).toHaveBeenCalled();
    });
  });

  describe("ensureIssuance", () => {
    it("reuses the verification record's own localId for the issuance", async () => {
      const { service, syncRecords, issuanceStageCreate } = buildService();
      syncRecords.findLatestSynced.mockResolvedValue({
        localId: "0042-VERIFICATION-v1",
        cadTrustId: "cadt-verification-1",
      });
      syncRecords.getCadTrustId.mockResolvedValue("cadt-project-methodology-1");

      const result = await service.ensureIssuance(REF_ID);

      expect(issuanceStageCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          issuanceId: "0042-VERIFICATION-v1",
          cadTrustVerificationId: "cadt-verification-1",
          cadTrustProjectMethodologyId: "cadt-project-methodology-1",
        })
      );
      expect(result).toEqual({ cadTrustId: "cadt-issuance-1", commitOwed: true });
    });

    it("is marked FAILED when no synced verification exists for this project", async () => {
      const { service, syncRecords, issuanceStageCreate } = buildService();
      syncRecords.findLatestSynced.mockResolvedValue(null);

      const result = await service.ensureIssuance(REF_ID);

      expect(issuanceStageCreate).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it("is marked FAILED when no synced project-methodology link exists", async () => {
      const { service, syncRecords, issuanceStageCreate } = buildService();
      syncRecords.findLatestSynced.mockResolvedValue({
        localId: "0042-VERIFICATION-v1",
        cadTrustId: "cadt-verification-1",
      });
      syncRecords.getCadTrustId.mockResolvedValue(undefined);

      const result = await service.ensureIssuance(REF_ID);

      expect(issuanceStageCreate).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
      expect(syncRecords.markFailed).toHaveBeenCalled();
    });
  });

  describe("ensureCreditIssuance — the full orchestration", () => {
    it("chains ensureIssuance -> ensureUnitCreate and commits when either owed one", async () => {
      const { service, syncRecords, unitStageCreate, issuanceStageCreate } = buildService();
      syncRecords.findLatestSynced.mockResolvedValue({
        localId: "0042-VERIFICATION-v1",
        cadTrustId: "cadt-verification-1",
      });
      syncRecords.getCadTrustId.mockResolvedValue("cadt-project-methodology-1");

      const commitOwed = await service.ensureCreditIssuance(CREDIT_BLOCK_ID);

      expect(issuanceStageCreate).toHaveBeenCalledTimes(1);
      expect(unitStageCreate).toHaveBeenCalledTimes(1);
      expect(commitOwed).toBe(true);
    });

    it("does not attempt a unit create when the credit block itself is missing", async () => {
      const { service, unitStageCreate } = buildService({ creditBlock: null });

      const commitOwed = await service.ensureCreditIssuance(CREDIT_BLOCK_ID);

      expect(unitStageCreate).not.toHaveBeenCalled();
      expect(commitOwed).toBe(false);
    });

    it("does not attempt a unit create when the issuance itself failed, but leaves a FAILED UNIT breadcrumb", async () => {
      const { service, unitStageCreate, syncRecords } = buildService();
      syncRecords.findLatestSynced.mockResolvedValue(null); // no verification -> ensureIssuance fails

      const commitOwed = await service.ensureCreditIssuance(CREDIT_BLOCK_ID);

      expect(unitStageCreate).not.toHaveBeenCalled();
      expect(commitOwed).toBe(false);
      // Without this row the credit-block reconcile sweep has nothing to re-drive and the unit is
      // lost even after the issuance itself reconciles.
      expect(syncRecords.markFailed).toHaveBeenCalledWith(
        {
          localEntityType: CadTrustLocalEntityType.UNIT,
          localId: CREDIT_BLOCK_ID,
          cadTrustEntityType: CadTrustResourceType.UNIT,
        },
        expect.any(Error)
      );
    });

    it("leaves one FAILED UNIT breadcrumb per vintage block when a multi-vintage issuance fails", async () => {
      const { service, syncRecords } = buildService();
      syncRecords.findLatestSynced.mockResolvedValue(null); // no verification -> ensureIssuance fails

      const blockIds = ["CA0001-XX-XX-1-1-100", "CA0001-XX-XX-1-101-200", "CA0001-XX-XX-1-201-300"];
      for (const blockId of blockIds) {
        await service.ensureCreditIssuance(blockId);
      }

      for (const blockId of blockIds) {
        expect(syncRecords.markFailed).toHaveBeenCalledWith(
          expect.objectContaining({ localEntityType: CadTrustLocalEntityType.UNIT, localId: blockId }),
          expect.any(Error)
        );
      }
    });
  });

  describe("ensureIssuanceForUncreatedUnit — reconcile-only issuance re-drive", () => {
    it("re-drives the issuance when the unit was never staged and no issuance is synced", async () => {
      const { service, syncRecords, issuanceStageCreate } = buildService();
      syncRecords.find.mockResolvedValue(null); // unit never staged
      syncRecords.getLatestSyncedCadTrustId.mockResolvedValue(undefined); // no synced issuance
      syncRecords.findLatestSynced.mockResolvedValue({
        localId: "0042-VERIFICATION-v1",
        cadTrustId: "cadt-verification-1",
      });
      syncRecords.getCadTrustId.mockResolvedValue("cadt-project-methodology-1");

      const commitOwed = await service.ensureIssuanceForUncreatedUnit(CREDIT_BLOCK_ID);

      expect(issuanceStageCreate).toHaveBeenCalledTimes(1);
      expect(commitOwed).toBe(true);
    });

    it("is a no-op when the unit already has a CAD Trust id", async () => {
      const { service, syncRecords, issuanceStageCreate } = buildService();
      syncRecords.find.mockResolvedValue({ syncStatus: CadTrustSyncStatus.COMMITTED, cadTrustId: "cadt-unit-1" });

      const commitOwed = await service.ensureIssuanceForUncreatedUnit(CREDIT_BLOCK_ID);

      expect(issuanceStageCreate).not.toHaveBeenCalled();
      expect(commitOwed).toBe(false);
    });

    it("is a no-op when the project's issuance is already synced", async () => {
      const { service, syncRecords, issuanceStageCreate } = buildService();
      syncRecords.find.mockResolvedValue(null);
      syncRecords.getLatestSyncedCadTrustId.mockResolvedValue("cadt-issuance-1");

      const commitOwed = await service.ensureIssuanceForUncreatedUnit(CREDIT_BLOCK_ID);

      expect(issuanceStageCreate).not.toHaveBeenCalled();
      expect(commitOwed).toBe(false);
    });

    it("is a no-op when the credit block no longer exists", async () => {
      const { service, issuanceStageCreate } = buildService({ creditBlock: null });

      const commitOwed = await service.ensureIssuanceForUncreatedUnit(CREDIT_BLOCK_ID);

      expect(issuanceStageCreate).not.toHaveBeenCalled();
      expect(commitOwed).toBe(false);
    });
  });

  describe("ensureUnitUpdate — the upsert resource", () => {
    it("creates when never synced before, resolving the issuance via the project's latest one", async () => {
      const { service, syncRecords, unitStageCreate } = buildService();
      syncRecords.getLatestSyncedCadTrustId.mockResolvedValue("cadt-issuance-1");

      const commitOwed = await service.ensureUnitUpdate(CREDIT_BLOCK_ID);

      expect(unitStageCreate).toHaveBeenCalledTimes(1);
      expect(commitOwed).toBe(true);
    });

    it("updates (not creates) when already COMMITTED, reusing the original cadTrustIssuanceId from payload", async () => {
      const { service, syncRecords, unitStageCreate, unitStageUpdate } = buildService();
      syncRecords.find.mockResolvedValue({
        syncStatus: CadTrustSyncStatus.COMMITTED,
        cadTrustId: "cadt-unit-1",
        payload: { cadTrustIssuanceId: "cadt-issuance-original" },
      });

      const commitOwed = await service.ensureUnitUpdate(CREDIT_BLOCK_ID);

      expect(unitStageCreate).not.toHaveBeenCalled();
      expect(unitStageUpdate).toHaveBeenCalledWith("cadt-unit-1", expect.any(Object));
      expect(commitOwed).toBe(true);
    });

    it("retries the commit without re-staging when STAGED but not yet committed", async () => {
      const { service, syncRecords, unitStageCreate, unitStageUpdate } = buildService();
      syncRecords.find.mockResolvedValue({ syncStatus: CadTrustSyncStatus.STAGED, cadTrustId: "cadt-unit-1" });

      const commitOwed = await service.ensureUnitUpdate(CREDIT_BLOCK_ID);

      expect(unitStageCreate).not.toHaveBeenCalled();
      expect(unitStageUpdate).not.toHaveBeenCalled();
      expect(commitOwed).toBe(true);
    });

    it("is marked FAILED when a COMMITTED unit's payload has no cadTrustIssuanceId to reuse", async () => {
      const { service, syncRecords, unitStageUpdate } = buildService();
      syncRecords.find.mockResolvedValue({
        syncStatus: CadTrustSyncStatus.COMMITTED,
        cadTrustId: "cadt-unit-1",
        payload: {},
      });

      const commitOwed = await service.ensureUnitUpdate(CREDIT_BLOCK_ID);

      expect(unitStageUpdate).not.toHaveBeenCalled();
      expect(commitOwed).toBe(false);
      expect(syncRecords.markFailed).toHaveBeenCalled();
    });

    it("is marked FAILED when the credit block itself is missing", async () => {
      const { service, syncRecords } = buildService({ creditBlock: null });

      const commitOwed = await service.ensureUnitUpdate(CREDIT_BLOCK_ID);

      expect(commitOwed).toBe(false);
      expect(syncRecords.markFailed).toHaveBeenCalled();
    });

    it("is marked FAILED when no synced issuance exists for a genuinely new block", async () => {
      const { service, syncRecords, unitStageCreate } = buildService();
      syncRecords.getLatestSyncedCadTrustId.mockResolvedValue(undefined);

      const commitOwed = await service.ensureUnitUpdate(CREDIT_BLOCK_ID);

      expect(unitStageCreate).not.toHaveBeenCalled();
      expect(commitOwed).toBe(false);
      expect(syncRecords.markFailed).toHaveBeenCalled();
    });
  });

  describe("ensureItmoLabelIfAuthorized", () => {
    it("is a no-op for a block that was never ITMO-authorized", async () => {
      const { service, labelStageCreate: _unused, syncRecords } = buildService({
        creditBlock: { ...CREDIT_BLOCK, itmoAuthorizationRecord: undefined },
      });

      const commitOwed = await service.ensureItmoLabelIfAuthorized(CREDIT_BLOCK_ID);

      expect(commitOwed).toBe(false);
      expect(syncRecords.markFailed).not.toHaveBeenCalled();
    });

    it("bootstraps the singleton label and links the unit for an authorized block", async () => {
      const { service, syncRecords, labelStageCreate, unitLabelStageCreate } = buildService({
        creditBlock: { ...CREDIT_BLOCK, itmoAuthorizationRecord: "auth-1" },
      });
      syncRecords.getCadTrustId.mockResolvedValue("cadt-unit-1");

      const commitOwed = await service.ensureItmoLabelIfAuthorized(CREDIT_BLOCK_ID);

      expect(labelStageCreate).toHaveBeenCalledWith(
        expect.objectContaining({ labelType: "Article 6 - Authorisation" })
      );
      expect(unitLabelStageCreate).toHaveBeenCalledWith(
        expect.objectContaining({ cadTrustLabelId: "cadt-label-1", cadTrustUnitId: "cadt-unit-1" })
      );
      expect(commitOwed).toBe(true);
    });

    it("is a no-op when the unit itself has not resolved a CAD Trust id yet", async () => {
      const { service, labelStageCreate, syncRecords } = buildService({
        creditBlock: { ...CREDIT_BLOCK, itmoAuthorizationRecord: "auth-1" },
      });
      syncRecords.getCadTrustId.mockResolvedValue(undefined);

      const commitOwed = await service.ensureItmoLabelIfAuthorized(CREDIT_BLOCK_ID);

      expect(labelStageCreate).not.toHaveBeenCalled();
      expect(commitOwed).toBe(false);
    });
  });

  describe("resolveUnitParties — MO/ITMO-aware owner + beneficiary", () => {
    const retiredBlock = (extra: any = {}) => ({
      ...CREDIT_BLOCK,
      accountType: AccountType.RETIREMENT_NDC,
      ownerCompanyId: 0,
      previousOwnerCompanyId: 7,
      ...extra,
    });

    const partiesFrom = (unitMapper: any) => unitMapper.toUnitInput.mock.calls[0][2];

    it("looks up the last real holder via previousOwnerCompanyId, never the 0 sentinel", async () => {
      const { service, companyRepo, syncRecords, unitMapper } = buildService({
        creditBlock: retiredBlock(),
        latestRetirement: { subType: CreditTransactionSubTypesEnum.VOLUNTARY_CANCELLATION, data: {} },
        company: { name: "Kunene Developers", taxId: "TAX-9" },
      });
      syncRecords.getLatestSyncedCadTrustId.mockResolvedValue("cadt-issuance-1");

      await service.ensureUnitUpdate(CREDIT_BLOCK_ID);

      expect(companyRepo.findOne).toHaveBeenCalledWith({ where: { companyId: 7 } });
      expect(companyRepo.findOne).not.toHaveBeenCalledWith({ where: { companyId: 0 } });
      expect(partiesFrom(unitMapper)).toEqual({
        currentOwner: "Kunene Developers",
        beneficiary: "Kunene Developers",
        beneficiaryId: "TAX-9",
      });
    });

    it("omits beneficiaryId for a voluntary cancellation when the company has no taxId", async () => {
      const { service, syncRecords, unitMapper } = buildService({
        creditBlock: retiredBlock(),
        latestRetirement: { subType: CreditTransactionSubTypesEnum.VOLUNTARY_CANCELLATION, data: {} },
        company: { name: "Kunene Developers" },
      });
      syncRecords.getLatestSyncedCadTrustId.mockResolvedValue("cadt-issuance-1");

      await service.ensureUnitUpdate(CREDIT_BLOCK_ID);

      expect(partiesFrom(unitMapper)).toEqual({
        currentOwner: "Kunene Developers",
        beneficiary: "Kunene Developers",
        beneficiaryId: undefined,
      });
    });

    it("names the acquiring Party for an ITMO first transfer towards NDC", async () => {
      const { service, syncRecords, unitMapper, countryRepo } = buildService({
        creditBlock: retiredBlock(),
        latestRetirement: {
          subType: CreditTransactionSubTypesEnum.FIRST_TRANSFER_TOWARDS_NDC,
          data: { country: "KE" },
        },
        country: { alpha2: "KE", name: "Kenya" },
      });
      syncRecords.getLatestSyncedCadTrustId.mockResolvedValue("cadt-issuance-1");

      await service.ensureUnitUpdate(CREDIT_BLOCK_ID);

      expect(countryRepo.findOne).toHaveBeenCalledWith({ where: { alpha2: "KE" } });
      expect(partiesFrom(unitMapper)).toEqual({
        currentOwner: "Kenya",
        beneficiary: "Kenya",
        beneficiaryId: "KE",
      });
    });

    it("falls back to the raw alpha-2 code when the country name lookup misses", async () => {
      const { service, syncRecords, unitMapper } = buildService({
        creditBlock: retiredBlock(),
        latestRetirement: {
          subType: CreditTransactionSubTypesEnum.FIRST_TRANSFER_TOWARDS_NDC,
          data: { country: "ZZ" },
        },
        country: null,
      });
      syncRecords.getLatestSyncedCadTrustId.mockResolvedValue("cadt-issuance-1");

      await service.ensureUnitUpdate(CREDIT_BLOCK_ID);

      expect(partiesFrom(unitMapper)).toEqual({
        currentOwner: "ZZ",
        beneficiary: "ZZ",
        beneficiaryId: "ZZ",
      });
    });

    it("uses the authorized entity's external identifier for an OIMP first transfer", async () => {
      const { service, syncRecords, unitMapper, caAuthorizedEntityRepo } = buildService({
        creditBlock: retiredBlock(),
        latestRetirement: {
          subType: CreditTransactionSubTypesEnum.FIRST_TRANSFER_FOR_OIMP,
          data: { entityName: "Acme Airlines", authorizedEntityId: "uuid-1", country: "KE" },
        },
        authorizedEntity: { entityIdentifier: "LEI-ACME" },
      });
      syncRecords.getLatestSyncedCadTrustId.mockResolvedValue("cadt-issuance-1");

      await service.ensureUnitUpdate(CREDIT_BLOCK_ID);

      expect(caAuthorizedEntityRepo.findOne).toHaveBeenCalledWith({ where: { id: "uuid-1" } });
      expect(partiesFrom(unitMapper)).toEqual({
        currentOwner: "Acme Airlines",
        beneficiary: "Acme Airlines",
        beneficiaryId: "LEI-ACME",
      });
    });

    it("falls back to the authorizedEntityId when the entity carries no external identifier", async () => {
      const { service, syncRecords, unitMapper } = buildService({
        creditBlock: retiredBlock(),
        latestRetirement: {
          subType: CreditTransactionSubTypesEnum.FIRST_TRANSFER_FOR_OIMP,
          data: { entityName: "Acme Airlines", authorizedEntityId: "uuid-1", country: "KE" },
        },
        authorizedEntity: { entityIdentifier: null },
      });
      syncRecords.getLatestSyncedCadTrustId.mockResolvedValue("cadt-issuance-1");

      await service.ensureUnitUpdate(CREDIT_BLOCK_ID);

      expect(partiesFrom(unitMapper)).toMatchObject({ beneficiaryId: "uuid-1" });
    });

    it("names the host Party for a domestic MO use towards NDC", async () => {
      const { service, syncRecords, unitMapper } = buildService({
        creditBlock: retiredBlock(),
        latestRetirement: { subType: CreditTransactionSubTypesEnum.USE_TOWARDS_NDC, data: {} },
        hostCountryCode: "VU",
        hostCountryName: "Vanuatu",
      });
      syncRecords.getLatestSyncedCadTrustId.mockResolvedValue("cadt-issuance-1");

      await service.ensureUnitUpdate(CREDIT_BLOCK_ID);

      expect(partiesFrom(unitMapper)).toEqual({
        currentOwner: "Vanuatu",
        beneficiary: "Vanuatu",
        beneficiaryId: "VU",
      });
    });

    it("gives an OMGE cancellation an owner but no beneficiary", async () => {
      const { service, syncRecords, unitMapper } = buildService({
        creditBlock: retiredBlock(),
        latestRetirement: { subType: CreditTransactionSubTypesEnum.OMGE_CANCELLATION, data: {} },
        company: { name: "Kunene Developers", taxId: "TAX-9" },
      });
      syncRecords.getLatestSyncedCadTrustId.mockResolvedValue("cadt-issuance-1");

      await service.ensureUnitUpdate(CREDIT_BLOCK_ID);

      expect(partiesFrom(unitMapper)).toEqual({ currentOwner: "Kunene Developers" });
    });

    it("for a held block passes the current owner and no beneficiary", async () => {
      const { service, syncRecords, unitMapper } = buildService();
      syncRecords.getLatestSyncedCadTrustId.mockResolvedValue("cadt-issuance-1");

      await service.ensureUnitUpdate(CREDIT_BLOCK_ID);

      expect(partiesFrom(unitMapper)).toEqual({
        currentOwner: "Kunene Developers",
        beneficiary: undefined,
        beneficiaryId: undefined,
      });
    });
  });
});
