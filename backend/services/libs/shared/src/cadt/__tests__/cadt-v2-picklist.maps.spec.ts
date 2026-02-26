import { Sector } from "../../enum/sector.enum";
import { ProgrammeStage } from "../../enum/programme-status.enum";
import { ProjectProposalStage } from "../../enum/projectProposalStage.enum";
import { TxType } from "../../enum/txtype.enum";
import {
  mapSectorToProjectSector,
  mapProgrammeStageToStatus,
  mapProposalStageToStatus,
  mapTxTypeToUnitStatus,
  mapSectorToUnitType,
  mapSectorToMethodologyType,
  SECTOR_TO_CADT_PROJECT_SECTOR,
  PROGRAMME_STAGE_TO_CADT_STATUS,
  TX_TYPE_TO_CADT_UNIT_STATUS,
} from "../cadt-v2-picklist.maps";

describe("Picklist Mappings", () => {
  describe("Sector → CADT projectSector", () => {
    it.each(Object.values(Sector))(
      "maps Sector.%s to a valid CADT value",
      (sector) => {
        const result = mapSectorToProjectSector(sector);
        expect(result).toHaveLength(1);
        expect(typeof result[0]).toBe("string");
        expect(result[0].length).toBeGreaterThan(0);
      }
    );

    it("maps Energy to Energy", () => {
      expect(mapSectorToProjectSector(Sector.Energy)).toEqual(["Energy"]);
    });

    it("maps Forestry to AFOLU", () => {
      expect(mapSectorToProjectSector(Sector.Forestry)).toEqual([
        "Agriculture, forestry and other land use (AFOLU)",
      ]);
    });

    it("maps Agriculture to AFOLU", () => {
      expect(mapSectorToProjectSector(Sector.Agriculture)).toEqual([
        "Agriculture, forestry and other land use (AFOLU)",
      ]);
    });

    it("maps unknown sector to fallback", () => {
      expect(mapSectorToProjectSector("unknown")).toEqual([
        "Not elsewhere classified",
      ]);
    });

    it("covers every Sector enum value", () => {
      for (const sector of Object.values(Sector)) {
        expect(SECTOR_TO_CADT_PROJECT_SECTOR[sector]).toBeDefined();
      }
    });
  });

  describe("ProgrammeStage → CADT projectStatus", () => {
    it.each(Object.values(ProgrammeStage))(
      "maps ProgrammeStage.%s to a valid CADT status",
      (stage) => {
        const result = mapProgrammeStageToStatus(stage);
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
      }
    );

    it("maps NEW to Listed", () => {
      expect(mapProgrammeStageToStatus(ProgrammeStage.NEW)).toBe("Listed");
    });

    it("maps APPROVED to Registered", () => {
      expect(mapProgrammeStageToStatus(ProgrammeStage.APPROVED)).toBe(
        "Registered"
      );
    });

    it("maps AUTHORISED to Authorized", () => {
      expect(mapProgrammeStageToStatus(ProgrammeStage.AUTHORISED)).toBe(
        "Authorized"
      );
    });

    it("maps REJECTED to Rejected", () => {
      expect(mapProgrammeStageToStatus(ProgrammeStage.REJECTED)).toBe(
        "Rejected"
      );
    });

    it("covers every ProgrammeStage enum value", () => {
      for (const stage of Object.values(ProgrammeStage)) {
        expect(PROGRAMME_STAGE_TO_CADT_STATUS[stage]).toBeDefined();
      }
    });
  });

  describe("ProjectProposalStage → CADT projectStatus", () => {
    it("maps AUTHORIZED to Authorized", () => {
      expect(mapProposalStageToStatus(ProjectProposalStage.AUTHORIZED)).toBe(
        "Authorized"
      );
    });

    it("maps AUTHORISED to Authorized", () => {
      expect(mapProposalStageToStatus(ProjectProposalStage.AUTHORISED)).toBe(
        "Authorized"
      );
    });

    it("maps APPROVED to Registered", () => {
      expect(mapProposalStageToStatus(ProjectProposalStage.APPROVED)).toBe(
        "Registered"
      );
    });

    it("maps VALIDATION_REPORT_APPROVED to Validated", () => {
      expect(
        mapProposalStageToStatus(ProjectProposalStage.VALIDATION_DNA_APPROVED)
      ).toBe("Validated");
    });

    it("maps rejected stages to Rejected", () => {
      expect(
        mapProposalStageToStatus(ProjectProposalStage.REJECTED)
      ).toBe("Rejected");
      expect(
        mapProposalStageToStatus(ProjectProposalStage.REJECTED_INF)
      ).toBe("Rejected");
      expect(
        mapProposalStageToStatus(ProjectProposalStage.REJECTED_PROPOSAL)
      ).toBe("Rejected");
    });

    it("maps other stages to Listed", () => {
      expect(
        mapProposalStageToStatus(ProjectProposalStage.PENDING)
      ).toBe("Listed");
      expect(
        mapProposalStageToStatus(ProjectProposalStage.SUBMITTED_INF)
      ).toBe("Listed");
    });

    it.each(Object.values(ProjectProposalStage))(
      "maps ProjectProposalStage.%s without throwing",
      (stage) => {
        expect(() => mapProposalStageToStatus(stage)).not.toThrow();
        const result = mapProposalStageToStatus(stage);
        expect(typeof result).toBe("string");
      }
    );
  });

  describe("TxType → CADT unitStatus", () => {
    it("maps ISSUE to Held", () => {
      expect(mapTxTypeToUnitStatus(TxType.ISSUE)).toBe("Held");
    });

    it("maps RETIRE to Retired", () => {
      expect(mapTxTypeToUnitStatus(TxType.RETIRE)).toBe("Retired");
    });

    it("maps TRANSFER to Exported", () => {
      expect(mapTxTypeToUnitStatus(TxType.TRANSFER)).toBe("Exported");
    });

    it("maps FREEZE to Inactive", () => {
      expect(mapTxTypeToUnitStatus(TxType.FREEZE)).toBe("Inactive");
    });

    it("maps unmapped TxType to Held", () => {
      expect(mapTxTypeToUnitStatus(TxType.ADD_DOCUMENT)).toBe("Held");
    });
  });

  describe("Sector → unitType", () => {
    it("maps Forestry to Removal - nature", () => {
      expect(mapSectorToUnitType(Sector.Forestry)).toBe("Removal - nature");
    });

    it("maps Agriculture to Reduction - nature", () => {
      expect(mapSectorToUnitType(Sector.Agriculture)).toBe(
        "Reduction - nature"
      );
    });

    it("maps Energy to Reduction - technical", () => {
      expect(mapSectorToUnitType(Sector.Energy)).toBe("Reduction - technical");
    });

    it("maps unknown to Not Determined", () => {
      expect(mapSectorToUnitType("unknown")).toBe("Not Determined");
    });
  });

  describe("Sector → methodologyType", () => {
    it("maps Forestry to Removal - nature", () => {
      expect(mapSectorToMethodologyType(Sector.Forestry)).toBe(
        "Removal - nature"
      );
    });

    it("maps Energy to Reduction - technical", () => {
      expect(mapSectorToMethodologyType(Sector.Energy)).toBe(
        "Reduction - technical"
      );
    });

    it("maps unknown to default", () => {
      expect(mapSectorToMethodologyType("xyz")).toBe("Reduction - technical");
    });
  });
});
