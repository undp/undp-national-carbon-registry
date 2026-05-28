import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Programme } from "../entities/programme.entity";
import { ProjectEntity } from "../entities/projects.entity";
import { Company } from "../entities/company.entity";
import { CreditBlocksEntity } from "../entities/credit.blocks.entity";
import { ActivityEntity } from "../entities/activity.entity";
import { AefActionsTableEntity } from "../entities/aef.actions.table.entity";
import {
  mapSectorToProjectSector,
  mapProgrammeStageToStatus,
  mapProposalStageToStatus,
  mapSectorToUnitType,
  mapTxTypeToUnitStatus,
  mapSectorToMethodologyType,
} from "./cadt-v2-picklist.maps";

@Injectable()
export class CadtV2MappingService {
  constructor(private configService: ConfigService) {}

  private epochToIsoDate(epoch: number | string | undefined | null): string | null {
    if (epoch === null || epoch === undefined) return null;
    const num = typeof epoch === "string" ? parseInt(epoch, 10) : epoch;
    if (isNaN(num) || num === 0) return null;
    const ms = num < 1e12 ? num * 1000 : num;
    const d = new Date(ms);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split("T")[0];
  }

  private toGeoJson(coords: any): string | null {
    if (!coords) return null;
    if (typeof coords === "string") return coords;
    if (Array.isArray(coords)) {
      if (coords.length === 0) return null;
      if (coords.length === 1) {
        const p = coords[0];
        return JSON.stringify({
          type: "Point",
          coordinates: [p.lng || p.longitude || 0, p.lat || p.latitude || 0],
        });
      }
      return JSON.stringify({
        type: "MultiPoint",
        coordinates: coords.map((p: any) => [
          p.lng || p.longitude || 0,
          p.lat || p.latitude || 0,
        ]),
      });
    }
    if (coords.type) return JSON.stringify(coords);
    if (coords.lat !== undefined || coords.latitude !== undefined) {
      return JSON.stringify({
        type: "Point",
        coordinates: [
          coords.lng || coords.longitude || 0,
          coords.lat || coords.latitude || 0,
        ],
      });
    }
    return null;
  }

  private extractMethodology(programme: Programme): {
    code: string;
    name: string;
  } {
    if (programme?.mitigationActions?.length > 0) {
      const ma = programme.mitigationActions[0];
      const meth =
        (ma as any).properties?.methodology || (ma as any).methodology;
      if (meth) return { code: meth, name: meth };
    }
    return { code: "PENDING", name: "Pending" };
  }

  mapProject(
    project: ProjectEntity,
    programme: Programme,
    _companies: Company[]
  ): Record<string, any> {
    const registryName = this.configService.get("systemCountryName");
    const host = this.configService.get("host");

    const status = programme
      ? mapProgrammeStageToStatus(programme.currentStage)
      : project?.projectProposalStage
      ? mapProposalStageToStatus(project.projectProposalStage)
      : "Listed";

    const sector = programme?.sector || project?.sector;
    const mitigationType =
      programme?.mitigationActions?.[0]?.typeOfMitigation;

    return {
      projectRegistryName: `${registryName} Standard Carbon Registry`,
      projectId: project.refId,
      projectName: project.title,
      projectLink: `${host}/projectManagement/view/${project.refId}`,
      projectSector: sector ? mapSectorToProjectSector(sector) : null,
      projectType: mitigationType ? [mitigationType] : null,
      projectSubtype:
        (programme?.mitigationActions?.[0] as any)?.subTypeOfMitigation || null,
      projectStatus: status,
      projectStatusDate: this.epochToIsoDate(
        programme?.statusUpdateTime || project?.createTime
      ),
      projectUnitMetric: "tCO2e",
      cadTrustReferenceProjectId: project.serialNumber || null,
    };
  }

  mapLocation(
    project: ProjectEntity,
    programme: Programme,
    countryName?: string
  ): Record<string, any> {
    const gis = this.toGeoJson(programme?.geographicalLocationCordintes);
    const region = programme?.programmeProperties?.geographicalLocation;

    return {
      locationCountry: countryName || null,
      locationRegion: Array.isArray(region) ? region.join(", ") : region || null,
      locationGis: gis,
      locationMapType: gis ? "geojson" : null,
      locationMapFileLink: null,
    };
  }

  mapMethodology(programme: Programme): Record<string, any> {
    const { code, name } = this.extractMethodology(programme);
    const sector = programme?.sector;

    return {
      methodologyCode: code,
      methodologyName: name,
      methodologyVersion: null,
      methodologyDate: null,
      methodologyLink: null,
      methodologyType: sector
        ? mapSectorToMethodologyType(sector)
        : "Reduction - technical",
    };
  }

  mapProjectMethodology(
    cadtProjectId: string,
    cadtMethodologyId: string,
    programme?: Programme
  ): Record<string, any> {
    return {
      cadTrustProjectId: cadtProjectId,
      cadTrustMethodologyId: cadtMethodologyId,
      projectMethodologyDate: this.epochToIsoDate(programme?.createdTime),
      projectMethodologyDescription: null,
    };
  }

  mapStakeholder(company: Company, role: string): Record<string, any> {
    return {
      stakeholderName: company.name,
      stakeholderType: role,
      stakeholderLink: company.website || null,
    };
  }

  mapStakeholderProject(
    cadtStakeholderId: string,
    cadtProjectId: string
  ): Record<string, any> {
    return {
      cadTrustStakeholderId: cadtStakeholderId,
      cadTrustProjectId: cadtProjectId,
    };
  }

  mapValidation(
    project: ProjectEntity,
    programme: Programme,
    certifierName?: string
  ): Record<string, any> {
    return {
      validationId: `VAL-${project.refId}`,
      validationType: "Validation of Project Design Document",
      validationBody: certifierName || null,
      validationDate: this.epochToIsoDate(project.projectAuthorizationTime),
      validationCreditPeriodStartDate: this.epochToIsoDate(
        programme?.startTime
      ),
      validationCreditPeriodEndDate: this.epochToIsoDate(programme?.endTime),
    };
  }

  mapVerification(
    project: ProjectEntity,
    activity: ActivityEntity | null,
    certifierName?: string,
    cadtValidationId?: string
  ): Record<string, any> {
    const refId = activity?.refId || project.refId;
    return {
      verificationId: `VER-${refId}`,
      verificationStartDate: this.epochToIsoDate(activity?.createdTime),
      verificationEndDate: this.epochToIsoDate(activity?.updatedTime),
      verificationBody: certifierName || null,
      cadTrustValidationId: cadtValidationId || null,
    };
  }

  mapIssuance(
    creditBlock: CreditBlocksEntity,
    cadtVerificationId: string,
    cadtProjectMethodologyId: string,
    cadtLocationId?: string
  ): Record<string, any> {
    return {
      issuanceId: `ISS-${creditBlock.creditBlockId}`,
      issuanceDate: this.epochToIsoDate(creditBlock.txTime),
      cadTrustVerificationId: cadtVerificationId,
      cadTrustProjectMethodologyId: cadtProjectMethodologyId,
      cadTrustLocationId: cadtLocationId || null,
    };
  }

  mapAefT1Submission(): Record<string, any> {
    const party = this.configService.get("AEF.party") ||
      this.configService.get("systemCountryName");
    return {
      aefT1SubmissionParty: party,
      aefT1SubmissionVersion: "1.0",
      aefT1SubmissionReportYear: new Date().getFullYear(),
      aefT1SubmissionSubmissionDate: new Date().toISOString().split("T")[0],
    };
  }

  mapAefT2Authorization(
    record: AefActionsTableEntity
  ): Record<string, any> {
    const country = this.configService.get("AEF.firstTransferingParty") ||
      this.configService.get("systemCountry");
    return {
      aefT2AuthorizationsId: record.authorizationId,
      aefT2AuthorizationsDate: this.epochToIsoDate(record.projectAuthorizationTime),
      aefT2AuthorizationsCooperativeApproachId:
        this.configService.get("AEF.cooperativeApproach") || "Article 6.2",
      aefT2AuthorizationsQuantity: record.creditAmount,
      aefT2AuthorizationsMetric: this.configService.get("AEF.metric") || "tCO2e",
      aefT2AuthorizationsSector: record.sector,
      aefT2AuthorizationsAuthorizedPartyId: country,
    };
  }

  mapAefT3Action(record: AefActionsTableEntity): Record<string, any> {
    const country = this.configService.get("AEF.transferingParty") ||
      this.configService.get("systemCountry");
    return {
      aefT3ActionsId: `ACT-${record.id}`,
      aefT3ActionsDate: this.epochToIsoDate(record.actionTime),
      aefT3ActionsType: record.actionType,
      aefT3ActionsQuantity: record.creditAmount,
      aefT3ActionsMetric: this.configService.get("AEF.metric") || "tCO2e",
      aefT3ActionsTransferringParty: country,
      aefT3ActionsAcquiringParty: record.aquiringParty,
    };
  }

  mapAefT4Holding(record: AefActionsTableEntity): Record<string, any> {
    return {
      aefT4HoldingsAuthorizationId: record.authorizationId,
      aefT4HoldingsQuantity: record.creditAmount,
      aefT4HoldingsMetric: this.configService.get("AEF.metric") || "tCO2e",
      aefT4HoldingsVintage: record.vintage,
      aefT4HoldingsSector: record.sector,
    };
  }

  mapAefT5AuthorizedEntity(
    companyName: string,
    companyId: number
  ): Record<string, any> {
    return {
      aefT5AuthorizedEntitiesName: companyName,
      aefT5AuthorizedEntitiesId: String(companyId),
      aefT5AuthorizedEntitiesType: "Authorized Entity",
    };
  }

  mapUnit(
    creditBlock: CreditBlocksEntity,
    cadtIssuanceId: string,
    sector?: string,
    ownerName?: string
  ): Record<string, any> {
    const parts = creditBlock.serialNumber?.split("-") || [];
    const blockStart = parts[6] || "0";
    const blockEnd =
      parts[7] || String(Number(blockStart) + creditBlock.creditAmount - 1);
    const vintageYear = parseInt(parts[4]) || parseInt(creditBlock.vintage) || new Date().getFullYear();
    const host = this.configService.get("host");

    return {
      unitSerialId: creditBlock.serialNumber,
      unitStartBlock: blockStart,
      unitEndBlock: blockEnd,
      unitVintageYear: vintageYear,
      unitCount: creditBlock.creditAmount,
      unitType: sector ? mapSectorToUnitType(sector) : "Reduction - technical",
      unitStatus: mapTxTypeToUnitStatus(creditBlock.txType),
      unitStatusDate: this.epochToIsoDate(creditBlock.txTime),
      unitLink: `${host}/creditTransfers/viewAll`,
      unitMetric: "tCO2e",
      unitCurrentOwner: ownerName || null,
      unitItmosReferenceId: creditBlock.serialNumber || null,
      unitRetirementDetail: creditBlock.txData?.remarks || null,
      cadTrustIssuanceId: cadtIssuanceId,
    };
  }
}
