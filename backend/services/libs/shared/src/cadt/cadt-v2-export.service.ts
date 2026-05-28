import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import * as ExcelJS from "exceljs";
import * as fs from "fs";
import { CadtV2MappingService } from "./cadt-v2-mapping.service";
import { ProjectEntity } from "../entities/projects.entity";
import { Programme } from "../entities/programme.entity";
import { CreditBlocksEntity } from "../entities/credit.blocks.entity";
import { Company } from "../entities/company.entity";
import { Country } from "../entities/country.entity";
import { CompanyService } from "../company/company.service";
import { FileHandlerInterface } from "../file-handler/filehandler.interface";
import { AefActionsTableEntity } from "../entities/aef.actions.table.entity";
import { AefActionTypeEnum } from "../enum/aef.action.type.enum";
import { TxType } from "../enum/txtype.enum";
import { ActivityStateEnum } from "../enum/activity.state.enum";

interface ExportRow {
  [key: string]: any;
}

@Injectable()
export class CadtV2ExportService {
  constructor(
    private configService: ConfigService,
    private mappingService: CadtV2MappingService,
    private companyService: CompanyService,
    @InjectRepository(ProjectEntity)
    private projectRepo: Repository<ProjectEntity>,
    @InjectRepository(Programme)
    private programmeRepo: Repository<Programme>,
    @InjectRepository(CreditBlocksEntity)
    private creditBlockRepo: Repository<CreditBlocksEntity>,
    @InjectRepository(Country)
    private countryRepo: Repository<Country>,
    @InjectRepository(AefActionsTableEntity)
    private aefRepo: Repository<AefActionsTableEntity>,
    private fileHandler: FileHandlerInterface,
    private logger: Logger
  ) {}

  async generateExport(
    projectRefIds?: string[]
  ): Promise<{ url: string; outputFileName: string }> {
    const projects = projectRefIds
      ? await this.projectRepo.findByIds(projectRefIds)
      : await this.projectRepo.find();

    const data = await this.collectAllMappedData(projects);
    const aefData = await this.collectAefData();
    return this.writeXlsx(data, aefData);
  }

  async generateCsvExport(
    projectRefIds?: string[]
  ): Promise<{ url: string; outputFileName: string }> {
    const projects = projectRefIds
      ? await this.projectRepo.findByIds(projectRefIds)
      : await this.projectRepo.find();

    const data = await this.collectAllMappedData(projects);
    return this.writeCsv(data);
  }

  private async collectAllMappedData(projects: ProjectEntity[]): Promise<{
    projects: ExportRow[];
    locations: ExportRow[];
    methodologies: ExportRow[];
    stakeholders: ExportRow[];
    validations: ExportRow[];
    verifications: ExportRow[];
    issuances: ExportRow[];
    units: ExportRow[];
  }> {
    const result = {
      projects: [] as ExportRow[],
      locations: [] as ExportRow[],
      methodologies: [] as ExportRow[],
      stakeholders: [] as ExportRow[],
      validations: [] as ExportRow[],
      verifications: [] as ExportRow[],
      issuances: [] as ExportRow[],
      units: [] as ExportRow[],
    };

    const seenMethodologies = new Set<string>();

    for (const project of projects) {
      const programme = await this.programmeRepo
        .createQueryBuilder("p")
        .where(":refId = ANY(string_to_array(p.\"serialNo\", ','))", {
          refId: project.refId,
        })
        .orWhere("p.programmeId = :pid", { pid: project.refId })
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
        const cert = await this.companyService.findByCompanyId(
          project.independentCertifiers[0]
        );
        certifierName = cert?.name || null;
      }

      // Project
      result.projects.push(
        this.mappingService.mapProject(project, programme, companies)
      );

      // Location
      result.locations.push({
        ...this.mappingService.mapLocation(project, programme, country?.name),
        _projectId: project.refId,
      });

      // Methodology
      const meth = this.mappingService.mapMethodology(programme);
      if (!seenMethodologies.has(meth.methodologyCode)) {
        seenMethodologies.add(meth.methodologyCode);
        result.methodologies.push(meth);
      }

      // Stakeholders
      for (const company of companies) {
        const role = companies.length === 1 ? "Owner" : "Developer";
        result.stakeholders.push(
          this.mappingService.mapStakeholder(company, role)
        );
      }

      // Validation
      result.validations.push({
        ...this.mappingService.mapValidation(project, programme, certifierName),
        _projectId: project.refId,
      });

      // Verification
      const activities = project.activities || [];
      const verified = activities.find(
        (a) => a.state === ActivityStateEnum.VERIFICATION_REPORT_VERIFIED
      );
      result.verifications.push({
        ...this.mappingService.mapVerification(
          project,
          verified || null,
          certifierName
        ),
        _projectId: project.refId,
      });

      // Credit blocks → issuances and units
      const blocks = await this.creditBlockRepo.find({
        where: { projectRefId: project.refId, txType: TxType.ISSUE },
      });

      for (const block of blocks) {
        result.issuances.push({
          ...this.mappingService.mapIssuance(
            block,
            "PLACEHOLDER_VERIFICATION_ID",
            "PLACEHOLDER_PM_ID"
          ),
          _projectId: project.refId,
        });

        const ownerCompany = await this.companyService.findByCompanyId(
          block.ownerCompanyId
        );
        result.units.push(
          this.mappingService.mapUnit(
            block,
            "PLACEHOLDER_ISSUANCE_ID",
            programme?.sector,
            ownerCompany?.name
          )
        );
      }
    }

    return result;
  }

  private async collectAefData(): Promise<{
    t1: ExportRow[];
    t2: ExportRow[];
    t3: ExportRow[];
    t4: ExportRow[];
    t5: ExportRow[];
  }> {
    const result = {
      t1: [] as ExportRow[],
      t2: [] as ExportRow[],
      t3: [] as ExportRow[],
      t4: [] as ExportRow[],
      t5: [] as ExportRow[],
    };

    result.t1.push(this.mappingService.mapAefT1Submission());

    const allRecords = await this.aefRepo.find();

    for (const rec of allRecords) {
      if (rec.actionType === AefActionTypeEnum.AUTHORIZATION) {
        result.t2.push(this.mappingService.mapAefT2Authorization(rec));
        result.t4.push(this.mappingService.mapAefT4Holding(rec));
      } else {
        result.t3.push(this.mappingService.mapAefT3Action(rec));
      }
    }

    const companyIds = new Set<number>();
    for (const rec of allRecords) {
      const authPartyId = parseInt(rec.aquiringParty);
      if (!isNaN(authPartyId)) companyIds.add(authPartyId);
    }

    for (const cid of companyIds) {
      const company = await this.companyService.findByCompanyId(cid);
      if (company) {
        result.t5.push(
          this.mappingService.mapAefT5AuthorizedEntity(company.name, cid)
        );
      }
    }

    return result;
  }

  private async writeXlsx(
    data: {
      projects: ExportRow[];
      locations: ExportRow[];
      methodologies: ExportRow[];
      stakeholders: ExportRow[];
      validations: ExportRow[];
      verifications: ExportRow[];
      issuances: ExportRow[];
      units: ExportRow[];
    },
    aefData?: {
      t1: ExportRow[];
      t2: ExportRow[];
      t3: ExportRow[];
      t4: ExportRow[];
      t5: ExportRow[];
    }
  ): Promise<{ url: string; outputFileName: string }> {
    const wb = new ExcelJS.Workbook();

    const sheetDefs: Array<{ name: string; rows: ExportRow[] }> = [
      { name: "Projects", rows: data.projects },
      { name: "Locations", rows: data.locations },
      { name: "Methodologies", rows: data.methodologies },
      { name: "Stakeholders", rows: data.stakeholders },
      { name: "Validations", rows: data.validations },
      { name: "Verifications", rows: data.verifications },
      { name: "Issuances", rows: data.issuances },
      { name: "Units", rows: data.units },
    ];

    if (aefData) {
      sheetDefs.push(
        { name: "AEF T1 Submission", rows: aefData.t1 },
        { name: "AEF T2 Authorizations", rows: aefData.t2 },
        { name: "AEF T3 Actions", rows: aefData.t3 },
        { name: "AEF T4 Holdings", rows: aefData.t4 },
        { name: "AEF T5 Authorized Entities", rows: aefData.t5 }
      );
    }

    for (const def of sheetDefs) {
      const sheet = wb.addWorksheet(def.name);
      if (def.rows.length === 0) continue;

      const keys = Object.keys(def.rows[0]).filter(
        (k) => !k.startsWith("_")
      );
      sheet.addRow(keys);

      for (const row of def.rows) {
        sheet.addRow(
          keys.map((k) => {
            const v = row[k];
            if (Array.isArray(v)) return v.join("|");
            return v == null ? "" : v;
          })
        );
      }
    }

    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `cadt_v2_export_${ts}.xlsx`;
    await wb.xlsx.writeFile(fileName);

    const content = fs.readFileSync(fileName, { encoding: "base64" });
    const url = await this.fileHandler.uploadFile(
      `documents/exports/${fileName}`,
      content
    );

    try {
      fs.unlinkSync(fileName);
    } catch (_) {}

    return { url, outputFileName: fileName };
  }

  private async writeCsv(data: {
    projects: ExportRow[];
    units: ExportRow[];
    [key: string]: ExportRow[];
  }): Promise<{ url: string; outputFileName: string }> {
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `cadt_v2_projects_${ts}.csv`;

    const rows = data.projects;
    if (rows.length === 0) {
      fs.writeFileSync(fileName, "");
    } else {
      const keys = Object.keys(rows[0]).filter((k) => !k.startsWith("_"));
      const lines = [keys.join(",")];
      for (const row of rows) {
        lines.push(
          keys
            .map((k) => {
              const v = row[k];
              if (Array.isArray(v)) return `"${v.join("|")}"`;
              if (v == null) return "";
              return `"${String(v).replace(/"/g, '""')}"`;
            })
            .join(",")
        );
      }
      fs.writeFileSync(fileName, lines.join("\n"));
    }

    const content = fs.readFileSync(fileName, { encoding: "base64" });
    const url = await this.fileHandler.uploadFile(
      `documents/exports/${fileName}`,
      content
    );

    try {
      fs.unlinkSync(fileName);
    } catch (_) {}

    return { url, outputFileName: fileName };
  }
}
