import { CadtV2MappingService } from "../cadt-v2-mapping.service";
import { createMockConfigService } from "./config-mock";
import {
  makeProgramme,
  makeProjectEntity,
  makeCompany,
  makeCreditBlock,
  makeActivityEntity,
  makeAefActionsRecord,
} from "./test-fixtures";
import { Sector } from "../../enum/sector.enum";
import { ProgrammeStage } from "../../enum/programme-status.enum";
import { TxType } from "../../enum/txtype.enum";
import { AefActionTypeEnum } from "../../enum/aef.action.type.enum";

describe("CadtV2MappingService", () => {
  let service: CadtV2MappingService;

  beforeEach(() => {
    const configService = createMockConfigService();
    service = new CadtV2MappingService(configService as any);
  });

  describe("mapProject", () => {
    it("maps basic project fields", () => {
      const project = makeProjectEntity();
      const programme = makeProgramme();
      const companies = [makeCompany()];

      const result = service.mapProject(project, programme, companies);

      expect(result.projectRegistryName).toBe(
        "Nigeria Standard Carbon Registry"
      );
      expect(result.projectId).toBe("P-001");
      expect(result.projectName).toBe("Solar Farm Abuja");
      expect(result.projectLink).toContain("/projectManagement/view/P-001");
      expect(result.projectUnitMetric).toBe("tCO2e");
    });

    it("maps ProgrammeStage.AUTHORISED to Authorized", () => {
      const project = makeProjectEntity();
      const programme = makeProgramme({ currentStage: ProgrammeStage.AUTHORISED });
      const result = service.mapProject(project, programme, []);
      expect(result.projectStatus).toBe("Authorized");
    });

    it("maps ProgrammeStage.APPROVED to Registered", () => {
      const project = makeProjectEntity();
      const programme = makeProgramme({ currentStage: ProgrammeStage.APPROVED });
      const result = service.mapProject(project, programme, []);
      expect(result.projectStatus).toBe("Registered");
    });

    it("maps ProgrammeStage.NEW to Listed", () => {
      const project = makeProjectEntity();
      const programme = makeProgramme({ currentStage: ProgrammeStage.NEW });
      const result = service.mapProject(project, programme, []);
      expect(result.projectStatus).toBe("Listed");
    });

    it("maps ProgrammeStage.REJECTED to Rejected", () => {
      const project = makeProjectEntity();
      const programme = makeProgramme({ currentStage: ProgrammeStage.REJECTED });
      const result = service.mapProject(project, programme, []);
      expect(result.projectStatus).toBe("Rejected");
    });

    it("maps Sector.Energy to Energy", () => {
      const project = makeProjectEntity();
      const programme = makeProgramme({ sector: Sector.Energy });
      const result = service.mapProject(project, programme, []);
      expect(result.projectSector).toEqual(["Energy"]);
    });

    it("maps Sector.Forestry to AFOLU", () => {
      const project = makeProjectEntity();
      const programme = makeProgramme({ sector: Sector.Forestry });
      const result = service.mapProject(project, programme, []);
      expect(result.projectSector).toEqual([
        "Agriculture, forestry and other land use (AFOLU)",
      ]);
    });

    it("handles missing programme gracefully", () => {
      const project = makeProjectEntity();
      const result = service.mapProject(project, null as any, []);
      expect(result.projectId).toBe("P-001");
      expect(result.projectStatus).toBe("Authorized");
    });

    it("converts epoch timestamps to ISO dates", () => {
      const project = makeProjectEntity();
      const programme = makeProgramme({
        statusUpdateTime: 1672531200000,
      });
      const result = service.mapProject(project, programme, []);
      expect(result.projectStatusDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("maps serial number to cadTrustReferenceProjectId", () => {
      const project = makeProjectEntity({
        serialNumber: "CA0NNN-NA-XX-P-001-2024-0",
      });
      const programme = makeProgramme();
      const result = service.mapProject(project, programme, []);
      expect(result.cadTrustReferenceProjectId).toBe(
        "CA0NNN-NA-XX-P-001-2024-0"
      );
    });

    it("includes projectType from mitigationActions", () => {
      const project = makeProjectEntity();
      const programme = makeProgramme();
      const result = service.mapProject(project, programme, []);
      expect(result.projectType).toEqual(["Solar"]);
    });
  });

  describe("mapLocation", () => {
    it("serializes coordinates to GeoJSON MultiPoint", () => {
      const project = makeProjectEntity();
      const programme = makeProgramme();
      const result = service.mapLocation(project, programme, "Nigeria");
      expect(result.locationCountry).toBe("Nigeria");
      expect(result.locationMapType).toBe("geojson");
      const gis = JSON.parse(result.locationGis);
      expect(gis.type).toBe("MultiPoint");
      expect(gis.coordinates).toHaveLength(2);
    });

    it("joins province names into region", () => {
      const project = makeProjectEntity();
      const programme = makeProgramme();
      const result = service.mapLocation(project, programme, "Nigeria");
      expect(result.locationRegion).toBe("Abuja, Lagos");
    });

    it("handles null coordinates", () => {
      const project = makeProjectEntity();
      const programme = makeProgramme({
        geographicalLocationCordintes: null,
      });
      const result = service.mapLocation(project, programme, "Nigeria");
      expect(result.locationGis).toBeNull();
      expect(result.locationMapType).toBeNull();
    });

    it("handles single coordinate as Point", () => {
      const project = makeProjectEntity();
      const programme = makeProgramme({
        geographicalLocationCordintes: [{ lat: 9.0, lng: 7.5 }],
      });
      const result = service.mapLocation(project, programme);
      const gis = JSON.parse(result.locationGis);
      expect(gis.type).toBe("Point");
    });

    it("handles empty coordinates array", () => {
      const project = makeProjectEntity();
      const programme = makeProgramme({
        geographicalLocationCordintes: [],
      });
      const result = service.mapLocation(project, programme);
      expect(result.locationGis).toBeNull();
    });
  });

  describe("mapMethodology", () => {
    it("extracts methodology from mitigationActions properties", () => {
      const programme = makeProgramme();
      const result = service.mapMethodology(programme);
      expect(result.methodologyCode).toBe("VCS - VM0043");
      expect(result.methodologyName).toBe("VCS - VM0043");
    });

    it("falls back to PENDING when no methodology", () => {
      const programme = makeProgramme({ mitigationActions: [] });
      const result = service.mapMethodology(programme);
      expect(result.methodologyCode).toBe("PENDING");
      expect(result.methodologyName).toBe("Pending");
    });

    it("extracts methodology from alternative path", () => {
      const programme = makeProgramme({
        mitigationActions: [
          { methodology: "CDM - AM0001" } as any,
        ],
      });
      const result = service.mapMethodology(programme);
      expect(result.methodologyCode).toBe("CDM - AM0001");
    });

    it("derives methodologyType from sector", () => {
      const programme = makeProgramme({ sector: Sector.Forestry });
      const result = service.mapMethodology(programme);
      expect(result.methodologyType).toBe("Removal - nature");
    });

    it("defaults methodologyType for Energy", () => {
      const programme = makeProgramme({ sector: Sector.Energy });
      const result = service.mapMethodology(programme);
      expect(result.methodologyType).toBe("Reduction - technical");
    });
  });

  describe("mapStakeholder", () => {
    it("maps company to stakeholder", () => {
      const company = makeCompany({ name: "DevCorp", website: "https://dev.co" });
      const result = service.mapStakeholder(company, "Developer");
      expect(result.stakeholderName).toBe("DevCorp");
      expect(result.stakeholderType).toBe("Developer");
      expect(result.stakeholderLink).toBe("https://dev.co");
    });

    it("assigns Owner role for single company", () => {
      const company = makeCompany();
      const result = service.mapStakeholder(company, "Owner");
      expect(result.stakeholderType).toBe("Owner");
    });

    it("handles missing website", () => {
      const company = makeCompany({ website: null });
      const result = service.mapStakeholder(company, "Developer");
      expect(result.stakeholderLink).toBeNull();
    });
  });

  describe("mapValidation", () => {
    it("generates validationId from refId", () => {
      const project = makeProjectEntity({ refId: "P-001" });
      const programme = makeProgramme();
      const result = service.mapValidation(project, programme, "CertCo");
      expect(result.validationId).toBe("VAL-P-001");
    });

    it("sets validationType to default", () => {
      const project = makeProjectEntity();
      const programme = makeProgramme();
      const result = service.mapValidation(project, programme);
      expect(result.validationType).toBe(
        "Validation of Project Design Document"
      );
    });

    it("derives credit period dates from programme times", () => {
      const project = makeProjectEntity();
      const programme = makeProgramme({
        startTime: 1672531200000,
        endTime: 1735689600000,
      });
      const result = service.mapValidation(project, programme);
      expect(result.validationCreditPeriodStartDate).toMatch(
        /^\d{4}-\d{2}-\d{2}$/
      );
      expect(result.validationCreditPeriodEndDate).toMatch(
        /^\d{4}-\d{2}-\d{2}$/
      );
    });

    it("uses certifier name as validationBody", () => {
      const project = makeProjectEntity();
      const programme = makeProgramme();
      const result = service.mapValidation(project, programme, "AuditCo");
      expect(result.validationBody).toBe("AuditCo");
    });

    it("returns null validationBody when no certifier", () => {
      const project = makeProjectEntity();
      const programme = makeProgramme();
      const result = service.mapValidation(project, programme);
      expect(result.validationBody).toBeNull();
    });
  });

  describe("mapVerification", () => {
    it("generates verificationId from activity refId", () => {
      const project = makeProjectEntity();
      const activity = makeActivityEntity({ refId: "A-001" });
      const result = service.mapVerification(project, activity);
      expect(result.verificationId).toBe("VER-A-001");
    });

    it("falls back to project refId when no activity", () => {
      const project = makeProjectEntity({ refId: "P-001" });
      const result = service.mapVerification(project, null);
      expect(result.verificationId).toBe("VER-P-001");
    });

    it("derives dates from activity timestamps", () => {
      const project = makeProjectEntity();
      const activity = makeActivityEntity({
        createdTime: 1672531200000,
        updatedTime: 1675209600000,
      });
      const result = service.mapVerification(project, activity);
      expect(result.verificationStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.verificationEndDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("links to validation via cadTrustValidationId", () => {
      const project = makeProjectEntity();
      const activity = makeActivityEntity();
      const result = service.mapVerification(
        project,
        activity,
        "CertCo",
        "val-uuid-123"
      );
      expect(result.cadTrustValidationId).toBe("val-uuid-123");
    });

    it("returns null dates when no activity", () => {
      const project = makeProjectEntity();
      const result = service.mapVerification(project, null);
      expect(result.verificationStartDate).toBeNull();
      expect(result.verificationEndDate).toBeNull();
    });
  });

  describe("mapIssuance", () => {
    it("generates issuanceId from credit block id", () => {
      const block = makeCreditBlock({ creditBlockId: "CB-001" });
      const result = service.mapIssuance(block, "ver-id", "pm-id");
      expect(result.issuanceId).toBe("ISS-CB-001");
    });

    it("links to verification and project-methodology", () => {
      const block = makeCreditBlock();
      const result = service.mapIssuance(block, "ver-id", "pm-id", "loc-id");
      expect(result.cadTrustVerificationId).toBe("ver-id");
      expect(result.cadTrustProjectMethodologyId).toBe("pm-id");
      expect(result.cadTrustLocationId).toBe("loc-id");
    });

    it("converts txTime to ISO date", () => {
      const block = makeCreditBlock({ txTime: 1675209600000 });
      const result = service.mapIssuance(block, "ver-id", "pm-id");
      expect(result.issuanceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("mapUnit", () => {
    it("parses serial number components", () => {
      const block = makeCreditBlock({
        serialNumber: "CA0NNN-NA-XX-001-2024-0-1001-1400",
      });
      const result = service.mapUnit(block, "iss-id", Sector.Energy);
      expect(result.unitSerialId).toBe("CA0NNN-NA-XX-001-2024-0-1001-1400");
      expect(result.unitStartBlock).toBe("1001");
      expect(result.unitEndBlock).toBe("1400");
      expect(result.unitVintageYear).toBe(2024);
    });

    it("maps creditAmount to unitCount", () => {
      const block = makeCreditBlock({ creditAmount: 400 });
      const result = service.mapUnit(block, "iss-id");
      expect(result.unitCount).toBe(400);
    });

    it("maps ISSUE txType to Held", () => {
      const block = makeCreditBlock({ txType: TxType.ISSUE });
      const result = service.mapUnit(block, "iss-id");
      expect(result.unitStatus).toBe("Held");
    });

    it("maps RETIRE txType to Retired", () => {
      const block = makeCreditBlock({ txType: TxType.RETIRE });
      const result = service.mapUnit(block, "iss-id");
      expect(result.unitStatus).toBe("Retired");
    });

    it("maps TRANSFER txType to Exported", () => {
      const block = makeCreditBlock({ txType: TxType.TRANSFER });
      const result = service.mapUnit(block, "iss-id");
      expect(result.unitStatus).toBe("Exported");
    });

    it("maps Energy sector to Reduction - technical", () => {
      const block = makeCreditBlock();
      const result = service.mapUnit(block, "iss-id", Sector.Energy);
      expect(result.unitType).toBe("Reduction - technical");
    });

    it("maps Forestry sector to Removal - nature", () => {
      const block = makeCreditBlock();
      const result = service.mapUnit(block, "iss-id", Sector.Forestry);
      expect(result.unitType).toBe("Removal - nature");
    });

    it("includes retirement detail from txData", () => {
      const block = makeCreditBlock({
        txData: { remarks: "Voluntary retirement" },
      });
      const result = service.mapUnit(block, "iss-id");
      expect(result.unitRetirementDetail).toBe("Voluntary retirement");
    });

    it("includes owner name", () => {
      const block = makeCreditBlock();
      const result = service.mapUnit(
        block,
        "iss-id",
        Sector.Energy,
        "Green Corp"
      );
      expect(result.unitCurrentOwner).toBe("Green Corp");
    });

    it("sets unitMetric to tCO2e", () => {
      const block = makeCreditBlock();
      const result = service.mapUnit(block, "iss-id");
      expect(result.unitMetric).toBe("tCO2e");
    });

    it("links to issuance via cadTrustIssuanceId", () => {
      const block = makeCreditBlock();
      const result = service.mapUnit(block, "iss-uuid-456");
      expect(result.cadTrustIssuanceId).toBe("iss-uuid-456");
    });
  });

  describe("mapAefT1Submission", () => {
    it("returns submission metadata", () => {
      const result = service.mapAefT1Submission();
      expect(result.aefT1SubmissionParty).toBe("Nigeria");
      expect(result.aefT1SubmissionVersion).toBe("1.0");
      expect(result.aefT1SubmissionReportYear).toBe(new Date().getFullYear());
      expect(result.aefT1SubmissionSubmissionDate).toMatch(
        /^\d{4}-\d{2}-\d{2}$/
      );
    });
  });

  describe("mapAefT2Authorization", () => {
    it("maps authorization record", () => {
      const record = makeAefActionsRecord();
      const result = service.mapAefT2Authorization(record);
      expect(result.aefT2AuthorizationsId).toBe("AUTH-001");
      expect(result.aefT2AuthorizationsQuantity).toBe(400);
      expect(result.aefT2AuthorizationsMetric).toBe("tCO2e");
    });
  });

  describe("mapAefT3Action", () => {
    it("maps action record", () => {
      const record = makeAefActionsRecord({
        actionType: AefActionTypeEnum.TRANSFER,
      });
      const result = service.mapAefT3Action(record);
      expect(result.aefT3ActionsType).toBe(AefActionTypeEnum.TRANSFER);
      expect(result.aefT3ActionsQuantity).toBe(400);
    });
  });

  describe("mapAefT4Holding", () => {
    it("maps holding record", () => {
      const record = makeAefActionsRecord();
      const result = service.mapAefT4Holding(record);
      expect(result.aefT4HoldingsAuthorizationId).toBe("AUTH-001");
      expect(result.aefT4HoldingsVintage).toBe("2024");
    });
  });

  describe("mapAefT5AuthorizedEntity", () => {
    it("maps entity record", () => {
      const result = service.mapAefT5AuthorizedEntity("TestCo", 42);
      expect(result.aefT5AuthorizedEntitiesName).toBe("TestCo");
      expect(result.aefT5AuthorizedEntitiesId).toBe("42");
    });
  });
});
