import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import axios from "axios";
import { CadtV2EntityMap } from "../entities/cadt.v2.entity.map";
import { CadtV2MappingService } from "./cadt-v2-mapping.service";
import { Programme } from "../entities/programme.entity";
import { ProjectEntity } from "../entities/projects.entity";
import { Company } from "../entities/company.entity";
import { CreditBlocksEntity } from "../entities/credit.blocks.entity";
import { CompanyService } from "../company/company.service";
import { Country } from "../entities/country.entity";
import { ActivityEntity } from "../entities/activity.entity";
import { ActivityStateEnum } from "../enum/activity.state.enum";
import { TxType } from "../enum/txtype.enum";

@Injectable()
export class CadtV2ApiService {
  constructor(
    private configService: ConfigService,
    private mappingService: CadtV2MappingService,
    private companyService: CompanyService,
    @InjectRepository(CadtV2EntityMap)
    private entityMapRepo: Repository<CadtV2EntityMap>,
    @InjectRepository(Programme)
    private programmeRepo: Repository<Programme>,
    @InjectRepository(ProjectEntity)
    private projectRepo: Repository<ProjectEntity>,
    @InjectRepository(CreditBlocksEntity)
    private creditBlockRepo: Repository<CreditBlocksEntity>,
    @InjectRepository(Country)
    private countryRepo: Repository<Country>,
    private logger: Logger
  ) {}

  private get enabled(): boolean {
    return this.configService.get("cadTrustV2.enable") === true;
  }

  private get endpoint(): string {
    return this.configService.get("cadTrustV2.endpoint") || "";
  }

  private get apiKey(): string | undefined {
    return this.configService.get("cadTrustV2.apiKey");
  }

  private async send(
    method: "post" | "put" | "get" | "delete",
    path: string,
    data?: any
  ): Promise<any> {
    if (!this.enabled) {
      this.logger.log("CADT v2 is disabled, skipping request");
      return null;
    }

    const url = `${this.endpoint}v2/${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) headers["x-api-key"] = this.apiKey;

    this.logger.debug(`CADT v2 ${method.toUpperCase()} ${path}`);

    try {
      const resp = await axios({ method, url, data, headers });
      return resp.data;
    } catch (ex: any) {
      this.logger.error(
        `CADT v2 error on ${method} ${path}: ${ex.response?.data?.message || ex.message}`
      );
      throw ex;
    }
  }

  private async commit(): Promise<any> {
    return this.send("post", "staging/commit", {
      comment: "UNDP Registry auto-sync",
    });
  }

  private async saveCadtId(
    entityType: string,
    localId: string,
    cadtUuid: string,
    status = "staged"
  ): Promise<void> {
    const existing = await this.entityMapRepo.findOne({
      where: { cadtEntityType: entityType, localEntityId: localId },
    });
    if (existing) {
      existing.cadtUuid = cadtUuid;
      existing.lastSyncedAt = Date.now();
      existing.syncStatus = status;
      await this.entityMapRepo.save(existing);
    } else {
      await this.entityMapRepo.save({
        cadtEntityType: entityType,
        localEntityId: localId,
        cadtUuid: cadtUuid,
        lastSyncedAt: Date.now(),
        syncStatus: status,
      });
    }
  }

  async getCadtId(entityType: string, localId: string): Promise<string | null> {
    const entry = await this.entityMapRepo.findOne({
      where: { cadtEntityType: entityType, localEntityId: localId },
    });
    return entry?.cadtUuid || null;
  }

  async syncProject(projectRefId: string): Promise<void> {
    if (!this.enabled) return;

    const project = await this.projectRepo.findOneBy({ refId: projectRefId });
    if (!project) {
      this.logger.warn(`Project ${projectRefId} not found, skipping sync`);
      return;
    }

    const programme = await this.programmeRepo
      .createQueryBuilder("p")
      .where(":refId = ANY(string_to_array(p.\"serialNo\", ','))", {
        refId: projectRefId,
      })
      .orWhere("p.programmeId = :pid", { pid: projectRefId })
      .getOne();

    const companies = programme
      ? await this.companyService.findByCompanyIds({
          companyIds: programme.companyId,
        })
      : [];

    const country = programme
      ? await this.countryRepo.findOneBy({ alpha2: programme.countryCodeA2 })
      : null;

    let certifierName: string | null = null;
    if (project.independentCertifiers?.length > 0) {
      const certifier = await this.companyService.findByCompanyId(
        project.independentCertifiers[0]
      );
      certifierName = certifier?.name || null;
    }

    // 1. Methodology
    const methPayload = this.mappingService.mapMethodology(programme);
    let cadtMethodologyId = await this.getCadtId(
      "methodology",
      methPayload.methodologyCode
    );
    if (!cadtMethodologyId) {
      const resp = await this.send("post", "methodology", methPayload);
      cadtMethodologyId = resp?.cadTrustMethodologyId || resp?.uuid;
      if (cadtMethodologyId) {
        await this.saveCadtId(
          "methodology",
          methPayload.methodologyCode,
          cadtMethodologyId
        );
      }
    }

    // 2. Project
    const projPayload = this.mappingService.mapProject(
      project,
      programme,
      companies
    );
    let cadtProjectId = await this.getCadtId("project", project.refId);
    if (cadtProjectId) {
      await this.send("put", `project/${cadtProjectId}`, projPayload);
    } else {
      const resp = await this.send("post", "project", projPayload);
      cadtProjectId = resp?.cadTrustProjectId || resp?.uuid;
      if (cadtProjectId) {
        await this.saveCadtId("project", project.refId, cadtProjectId);
      }
    }

    if (!cadtProjectId) {
      this.logger.error(`Failed to get CADT project ID for ${project.refId}`);
      return;
    }

    // 3. Location
    const locPayload = this.mappingService.mapLocation(
      project,
      programme,
      country?.name
    );
    locPayload.cadTrustProjectId = cadtProjectId;
    let cadtLocationId = await this.getCadtId("location", project.refId);
    if (cadtLocationId) {
      await this.send("put", `location/${cadtLocationId}`, locPayload);
    } else {
      const resp = await this.send("post", "location", locPayload);
      cadtLocationId = resp?.cadTrustLocationId || resp?.uuid;
      if (cadtLocationId) {
        await this.saveCadtId("location", project.refId, cadtLocationId);
      }
    }

    // 4. Stakeholders
    for (const company of companies) {
      const role =
        companies.length === 1 ? "Owner" : "Developer";
      const stPayload = this.mappingService.mapStakeholder(company, role);
      const stKey = `stakeholder-${company.companyId}`;
      let cadtStakeholderId = await this.getCadtId("stakeholder", stKey);
      if (!cadtStakeholderId) {
        const resp = await this.send("post", "stakeholder", stPayload);
        cadtStakeholderId = resp?.cadTrustStakeholderId || resp?.uuid;
        if (cadtStakeholderId) {
          await this.saveCadtId("stakeholder", stKey, cadtStakeholderId);
          // stakeholder-project junction
          await this.send(
            "post",
            "stakeholder-projects",
            this.mappingService.mapStakeholderProject(
              cadtStakeholderId,
              cadtProjectId
            )
          );
        }
      }
    }

    // 5. Project-Methodology junction
    const pmKey = `pm-${project.refId}`;
    let cadtPmId = await this.getCadtId("project_methodology", pmKey);
    if (!cadtPmId && cadtMethodologyId) {
      const pmPayload = this.mappingService.mapProjectMethodology(
        cadtProjectId,
        cadtMethodologyId,
        programme
      );
      const resp = await this.send("post", "project-methodology", pmPayload);
      cadtPmId = resp?.cadTrustProjectMethodologyId || resp?.uuid;
      if (cadtPmId) {
        await this.saveCadtId("project_methodology", pmKey, cadtPmId);
      }
    }

    // 6. Validation stub
    const valKey = `val-${project.refId}`;
    let cadtValidationId = await this.getCadtId("validation", valKey);
    if (!cadtValidationId) {
      const valPayload = this.mappingService.mapValidation(
        project,
        programme,
        certifierName
      );
      valPayload.cadTrustProjectId = cadtProjectId;
      const resp = await this.send("post", "validation", valPayload);
      cadtValidationId = resp?.cadTrustValidationId || resp?.uuid;
      if (cadtValidationId) {
        await this.saveCadtId("validation", valKey, cadtValidationId);
      }
    }

    // 7. Verification stub
    const activities: ActivityEntity[] = project.activities || [];
    const verifiedActivity = activities.find(
      (a) => a.state === ActivityStateEnum.VERIFICATION_REPORT_VERIFIED
    );
    const verKey = `ver-${verifiedActivity?.refId || project.refId}`;
    let cadtVerificationId = await this.getCadtId("verification", verKey);
    if (!cadtVerificationId) {
      const verPayload = this.mappingService.mapVerification(
        project,
        verifiedActivity || null,
        certifierName,
        cadtValidationId
      );
      verPayload.cadTrustProjectId = cadtProjectId;
      const resp = await this.send("post", "verification", verPayload);
      cadtVerificationId = resp?.cadTrustVerificationId || resp?.uuid;
      if (cadtVerificationId) {
        await this.saveCadtId("verification", verKey, cadtVerificationId);
      }
    }

    // Commit all staged baseline records
    await this.commit();

    // 8. Issuances and Units
    if (cadtVerificationId && cadtPmId) {
      await this.syncCreditsForProject(
        project.refId,
        cadtVerificationId,
        cadtPmId,
        cadtLocationId,
        programme?.sector
      );
    }
  }

  private async syncCreditsForProject(
    projectRefId: string,
    cadtVerificationId: string,
    cadtPmId: string,
    cadtLocationId: string | null,
    sector?: string
  ): Promise<void> {
    const blocks = await this.creditBlockRepo.find({
      where: { projectRefId, txType: TxType.ISSUE },
    });

    let hasNew = false;
    for (const block of blocks) {
      const issKey = `iss-${block.creditBlockId}`;
      let cadtIssuanceId = await this.getCadtId("issuance", issKey);
      if (!cadtIssuanceId) {
        const issPayload = this.mappingService.mapIssuance(
          block,
          cadtVerificationId,
          cadtPmId,
          cadtLocationId
        );
        const resp = await this.send("post", "issuance", issPayload);
        cadtIssuanceId = resp?.cadTrustIssuanceId || resp?.uuid;
        if (cadtIssuanceId) {
          await this.saveCadtId("issuance", issKey, cadtIssuanceId);
        }
        hasNew = true;
      }

      if (cadtIssuanceId) {
        const unitKey = `unit-${block.creditBlockId}`;
        const cadtUnitId = await this.getCadtId("unit", unitKey);
        if (!cadtUnitId) {
          const ownerCompany = await this.companyService.findByCompanyId(
            block.ownerCompanyId
          );
          const unitPayload = this.mappingService.mapUnit(
            block,
            cadtIssuanceId,
            sector,
            ownerCompany?.name
          );
          const resp = await this.send("post", "unit", unitPayload);
          const newUnitId = resp?.cadTrustUnitId || resp?.uuid;
          if (newUnitId) {
            await this.saveCadtId("unit", unitKey, newUnitId);
          }
          hasNew = true;
        }
      }
    }

    if (hasNew) await this.commit();
  }

  async syncAll(): Promise<{ synced: number; failed: number }> {
    if (!this.enabled) return { synced: 0, failed: 0 };

    const projects = await this.projectRepo.find();
    let synced = 0;
    let failed = 0;

    for (const project of projects) {
      try {
        await this.syncProject(project.refId);
        synced++;
      } catch (err) {
        this.logger.error(
          `Failed to sync project ${project.refId}: ${err.message}`
        );
        failed++;
      }
    }

    return { synced, failed };
  }

  async getSyncStatus(): Promise<{
    lastSyncTime: number | null;
    projectCount: number;
    failedCount: number;
  }> {
    const latest = await this.entityMapRepo
      .createQueryBuilder("m")
      .select("MAX(m.lastSyncedAt)", "lastSync")
      .getRawOne();

    const projectCount = await this.entityMapRepo.count({
      where: { cadtEntityType: "project" },
    });

    const failedCount = await this.entityMapRepo.count({
      where: { syncStatus: "failed" },
    });

    return {
      lastSyncTime: latest?.lastSync ? Number(latest.lastSync) : null,
      projectCount,
      failedCount,
    };
  }
}
