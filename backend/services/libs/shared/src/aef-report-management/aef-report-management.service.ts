import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { HelperService } from "../util/helpers.service";
import { EntityManager, Repository } from "typeorm";
import { CreditBlocksEntity } from "../entities/credit.blocks.entity";
import { TxType } from "../enum/txtype.enum";
import { ProgrammeLedgerService } from "../programme-ledger/programme-ledger.service";
import { plainToClass } from "class-transformer";
import { AefActionsTableEntity } from "../entities/aef.actions.table.entity";
import { SerialNumberManagementService } from "../serial-number-management/serial-number-management.service";
import { AefActionTypeEnum } from "../enum/aef.action.type.enum";
import { CreditRetireActionDto } from "../dto/credit.retire.action.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { CreditTransactionsEntity } from "../entities/credit.transactions.entity";
import { RetirementACtionEnum } from "../enum/retirement.action.enum";
import { CreditRetirementTypeEnum } from "../enum/credit.retirement.type.enum";
import { ConfigService } from "@nestjs/config";
import { QueryDto } from "../dto/query.dto";
import { User } from "../entities/user.entity";
import { DataListResponseDto } from "../dto/data.list.response";
import { CompanyRole } from "../enum/company.role.enum";
import { Role } from "../casl/role.enum";
import { AefReportTypeEnum } from "../enum/aef.report.type.enum";
import { FileHandlerInterface } from "../file-handler/filehandler.interface";
import { ExportFileType } from "../enum/export.file.type.enum";
import * as fs from "fs";
import * as XLSX from "xlsx";
import { DataExportDto } from "../dto/data.export.dto";
import { DataExportHoldings } from "../dto/data.export.holdings.dto";
import { DataExportActions } from "../dto/data.export.actions.dto";
import { AefExportDto } from "../dto/aef.export.dto";
import * as ExcelJS from "exceljs";
import * as path from "path";
import * as moment from "moment";
@Injectable()
export class AefReportManagementService {
  constructor(
    private readonly helperService: HelperService,
    private readonly programmeLedgerService: ProgrammeLedgerService,
    private readonly serialNumberManagementService: SerialNumberManagementService,
    @InjectRepository(CreditTransactionsEntity)
    private creditTransactionsEntityRepository: Repository<CreditTransactionsEntity>,
    private readonly configService: ConfigService,
    @InjectRepository(AefActionsTableEntity)
    private aefActionsTableEntityRepository: Repository<AefActionsTableEntity>,
    private fileHandler: FileHandlerInterface
  ) {}

  public async handleAefRecord(creditBlock: CreditBlocksEntity, em: EntityManager) {
    if (![TxType.ISSUE, TxType.TRANSFER, TxType.RETIRE].includes(creditBlock.txType)) {
      return;
    }
    const project = await this.programmeLedgerService.getProjectById(creditBlock.projectRefId);
    const newAefActionRecord = plainToClass(AefActionsTableEntity, {
      creditBlockStartId: this.serialNumberManagementService.getBlockStartId(
        creditBlock.serialNumber
      ),
      creditBlockEndId: this.serialNumberManagementService.getBlockEndId(creditBlock.serialNumber),
      creditAmount: creditBlock.creditAmount,
      vintage: this.serialNumberManagementService.getVintage(creditBlock.serialNumber),
      sector: project.sector,
      sectoralScope: project.sectoralScope,
      projectAuthorizationTime: project.projectAuthorizationTime,
      authorizationId: project.authorizationId,
      actionTime: creditBlock.txTime,
      aquiringParty: this.configService.get("AEF.defaultAquiringParty"),
    });
    if (creditBlock.txType == TxType.ISSUE) {
      newAefActionRecord.actionType = AefActionTypeEnum.AUTHORIZATION;
    } else if (creditBlock.txType == TxType.TRANSFER) {
      newAefActionRecord.actionType = AefActionTypeEnum.TRANSFER;
    } else if (creditBlock.txType == TxType.RETIRE) {
      const txData: CreditRetireActionDto = creditBlock.txData;
      if (txData.action == RetirementACtionEnum.ACCEPT) {
        const retireTrasaction = await this.creditTransactionsEntityRepository.findOne({
          where: { id: txData.transactionId },
        });
        if (retireTrasaction.retirementType == CreditRetirementTypeEnum.CROSS_BORDER_TRANSACTIONS) {
          newAefActionRecord.actionType = AefActionTypeEnum.CROSS_BOARDER_TRANSFER;
          newAefActionRecord.aquiringParty = retireTrasaction.country;
        } else {
          newAefActionRecord.actionType = AefActionTypeEnum.RETIRE;
        }
      } else {
        return;
      }
    }
    await em.save(AefActionsTableEntity, newAefActionRecord);
  }

  public async queryAefRecords(
    query: QueryDto,
    abilityCondition: string,
    user: User
  ): Promise<DataListResponseDto> {
    if (
      user.companyRole != CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
      ![Role.Admin, Role.Root].includes(user.role)
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("aef.unauthorized", []),
        HttpStatus.UNAUTHORIZED
      );
    }
    const resp = await this.aefActionsTableEntityRepository
      .createQueryBuilder("aefRecord")
      .where(this.helperService.generateWhereSQL(query, abilityCondition))
      .orderBy(
        query?.sort?.key && `"${query?.sort?.key}"`,
        query?.sort?.order,
        query?.sort?.nullFirst !== undefined
          ? query?.sort?.nullFirst === true
            ? "NULLS FIRST"
            : "NULLS LAST"
          : undefined
      )
      .skip(query.size * query.page - query.size)
      .take(query.size)
      .getManyAndCount();
    const records = resp[0];
    const staticFields = this.configService.get("AEF");
    const updatedRecords = records.map((record) => ({
      ...record,
      ...staticFields,
    }));
    return new DataListResponseDto(updatedRecords, resp.length > 1 ? resp[1] : undefined);
  }

  async downloadAefReport(exportDto: AefExportDto, abilityCondition: string, user: User) {
    if (
      user.companyRole != CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
      ![Role.Admin, Role.Root].includes(user.role)
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("aef.unauthorized", []),
        HttpStatus.UNAUTHORIZED
      );
    }
    const query = new QueryDto();
    query.page = 1;
    query.size = 10;
    const resp = await this.queryAefRecords(query, abilityCondition, user);

    if (resp.total > 0) {
      let prepData;
      let localFileName;

      switch (exportDto.reportType) {
        case AefReportTypeEnum.HOLDINGS:
          prepData = this.prepareHoldingsData(resp);
          localFileName = `${AefReportTypeEnum.HOLDINGS}`;
          break;
        case AefReportTypeEnum.ACTIONS:
          prepData = this.prepareActionsData(resp);
          localFileName = `${AefReportTypeEnum.ACTIONS}`;
          break;
        default:
          break;
      }

      let headers: string[] = [];
      const titleKeys = Object.keys(prepData[0]);
      for (const key of titleKeys) {
        headers.push(this.helperService.formatReqMessagesString("aef." + key, []));
      }

      const path = await this.generateCsvOrExcel(
        prepData,
        exportDto.fileType === ExportFileType.CSV ? headers : titleKeys,
        this.helperService.formatReqMessagesString(localFileName, []),
        exportDto.reportType,
        exportDto.fileType
      );

      return path;
    }
    throw new HttpException(
      this.helperService.formatReqMessagesString("reportExport.nothingToExport", []),
      HttpStatus.BAD_REQUEST
    );
  }

  private prepareHoldingsData(data: DataListResponseDto) {
    const exportData: DataExportHoldings[] = [];

    for (const report of data.data) {
      const dto: DataExportHoldings = new DataExportHoldings();
      dto.article6RecordId = report.artical6RecordId;
      dto.cooperativeApproach = report.cooperativeApproach;
      dto.firstUniqueIdentifier = report.firstUniqueIdentifier;
      dto.lastUniqueIdentifier = report.lastUniqueIdentifier;
      dto.creditBlockStartId = report.creditBlockStartId;
      dto.creditBlockEndId = report.creditBlockEndId;
      dto.metric = report.metric;
      dto.quantityInMetric = report.quantityInMetric;
      dto.creditAmount = report.creditAmount;
      dto.conversionFactor = report.conversionFactor;
      dto.firstTransferingParty = report.firstTransferingParty;
      dto.vintage = report.vintage;
      dto.sector = report.sector;
      dto.sectoralScope = report.sectoralScope;
      dto.projectAuthorizationTime = report.projectAuthorizationTime
        ? moment(parseInt(report.projectAuthorizationTime)).format("YY-MM-DD")
        : "";
      dto.authorizationId = report.authorizationId;
      dto.purposeForAuthorization = report.purposeForAuthorization;
      dto.oimp = report.OIMP;
      dto.firstTransferDefinition = report.firstTransferDefinition;

      exportData.push(dto);
    }

    return exportData;
  }

  private prepareActionsData(data: DataListResponseDto) {
    const exportData: DataExportActions[] = [];

    for (const report of data.data) {
      const dto: DataExportActions = new DataExportActions();
      dto.article6RecordId = report.artical6RecordId;
      dto.cooperativeApproach = report.cooperativeApproach;
      dto.firstUniqueIdentifier = report.firstUniqueIdentifier;
      dto.lastUniqueIdentifier = report.lastUniqueIdentifier;
      dto.creditBlockStartId = report.creditBlockStartId;
      dto.creditBlockEndId = report.creditBlockEndId;
      dto.metric = report.metric;
      dto.quantityInMetric = report.quantityInMetric;
      dto.creditAmount = report.creditAmount;
      dto.conversionFactor = report.conversionFactor;
      dto.firstTransferingParty = report.firstTransferingParty;
      dto.vintage = report.vintage;
      dto.sector = report.sector;
      dto.sectoralScope = report.sectoralScope;
      dto.projectAuthorizationTime = report.projectAuthorizationTime
        ? moment(parseInt(report.projectAuthorizationTime)).format("YY-MM-DD")
        : "";
      dto.authorizationId = report.authorizationId;
      dto.purposeForAuthorization = report.purposeForAuthorization;
      dto.oimp = report.OIMP;
      dto.firstTransferDefinition = report.firstTransferDefinition;
      dto.actionTime = report.actionTime
        ? moment(parseInt(report.actionTime)).format("YY-MM-DD")
        : "";
      dto.actionType = report.actionType;
      dto.transferingParty = report.transferingParty;
      dto.aquiringParty = report.aquiringParty;
      dto.purposeForCancellation = report.purposeForCancellation;
      dto.actionBy = report.actionBy;
      dto.firstTransfer = report.firstTransferingParty;

      exportData.push(dto);
    }

    return exportData;
  }

  async generateCsvOrExcel(
    data: DataExportDto[],
    headers: string[],
    fileName: string,
    reportType: AefReportTypeEnum,
    fileType: ExportFileType
  ) {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
    const day = currentDate.getDate().toString().padStart(2, "0");
    const hours = currentDate.getHours().toString().padStart(2, "0");
    const minutes = currentDate.getMinutes().toString().padStart(2, "0");
    const seconds = currentDate.getSeconds().toString().padStart(2, "0");

    const formattedDateTime = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    const fileExtension = fileType === ExportFileType.CSV ? "csv" : "xlsx";
    const outputFileName = `${fileName}_${formattedDateTime}.${fileExtension}`;

    if (fileType === ExportFileType.CSV) {
      let csvContent = "";

      const refinedData = [];
      refinedData.push(headers);

      data.forEach((item) => {
        const values = Object.values(item).map((value) =>
          value === undefined || value === null ? "" : value
        );
        refinedData.push(values);
      });

      refinedData.forEach((row) => {
        const rowValues = row.map((value) => `"${value}"`).join(",");
        csvContent += rowValues + "\n";
      });

      fs.writeFileSync(outputFileName, csvContent);
    } else if (fileType === ExportFileType.XLSX) {
      switch (reportType) {
        case AefReportTypeEnum.ACTIONS:
          await this.fillTemplate(
            "aef_actions_template.xlsx",
            "Actions",
            headers,
            data,
            11,
            outputFileName
          );
          break;
        case AefReportTypeEnum.HOLDINGS:
          await this.fillTemplate(
            "aef_holdings_template.xlsx",
            "Holdings",
            headers,
            data,
            7,
            outputFileName
          );
          break;
        default:
          break;
      }
    }

    const content = fs.readFileSync(outputFileName, { encoding: "base64" });
    const url = await this.fileHandler.uploadFile("documents/exports/" + outputFileName, content);

    console.log("Export completed", "exports/", url);
    return { url, outputFileName };
  }

  async fillTemplate(
    templateName: string,
    sheetName: string,
    headers: string[],
    data: Record<string, any>[],
    startRow: number,
    outputFileName: string
  ) {
    const templatePath = path.resolve(__dirname, "shared", "src", "templates", templateName);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(templatePath);

    const sheet = wb.getWorksheet(sheetName);
    if (!sheet) throw new Error(`Sheet ${sheetName} not found in ${templateName}`);

    if (templateName === "aef_actions_template.xlsx") {
      sheet.getCell("B3").value = this.configService.get("AEF.party");
      sheet.getCell("B4").value = new Date().getFullYear();
      sheet.getCell("B3").font = { name: "Times New Roman", size: 10 };
      sheet.getCell("B4").font = { name: "Times New Roman", size: 10 };
    }

    let rowIdx = startRow;

    console.log(headers);
    for (const item of data) {
      const row = sheet.getRow(rowIdx++);
      headers.forEach((key, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        const v = item[key];
        cell.value = v == null ? "" : v;
        cell.font = { name: "Times New Roman", size: 10 };
        cell.alignment = {
          wrapText: true,
          vertical: "top",
          horizontal: "left",
        };
      });
      row.commit();
    }

    await wb.xlsx.writeFile(outputFileName);
    return outputFileName;
  }
}
