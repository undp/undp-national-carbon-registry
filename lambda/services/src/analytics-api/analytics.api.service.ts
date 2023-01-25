import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { DataCountResponseDto } from "../shared/dto/data.count.response";
import { Programme } from "../shared/entities/programme.entity";
import { ProgrammeTransfer } from "../shared/entities/programme.transfer";
import { Repository } from "typeorm";
import { StatList } from "../shared/dto/stat.list.dto";
import { StatType } from "../shared/enum/stat.type.enum";
import { ChartStatList } from "../shared/dto/chartStats.list.dto";
import { ChartType } from "../shared/enum/chart.type.enum";
import { HelperService } from "../shared/util/helpers.service";
import { ProgrammeStage } from "../shared/enum/programme-status.enum";
import { programmeStatusRequestDto } from "../shared/dto/programmeStatus.request.dto";
import { CreditStatType } from "../shared/enum/credit.stat.type.enum";
import { chartStatsRequestDto } from "../shared/dto/chartStats.request.dto";
import { ChartStatsResponseDto } from "../shared/dto/charts.stats.response";
import {
  chartStatsResultInMonths,
  chartStatsResultInitialValueInMonths,
  chartStatsResultSend,
  chartStatsResultInitialValueSend,
} from "../shared/dto/chart.stats.result";

@Injectable()
export class AnalyticsAPIService {
  constructor(
    private configService: ConfigService,
    private helperService: HelperService,
    @InjectRepository(Programme) private programmeRepo: Repository<Programme>,
    @InjectRepository(ProgrammeTransfer)
    private programmeTransferRepo: Repository<ProgrammeTransfer>
  ) {}

  async programmesStaticChartsDetails(
    abilityCondition: string,
    query: ChartStatList,
    companyId: any
  ): Promise<ChartStatsResponseDto> {
    let result: chartStatsResultSend = chartStatsResultInitialValueSend;
    let resultsX: chartStatsResultSend = chartStatsResultInitialValueSend;
    let userCompanyId = companyId;
    let category = query?.category;
    let results = {};
    for (const stat of query.stats) {
      switch (stat.type) {
        case ChartType.TOTAL_PROGRAMS:
          const startTime = query.startTime;
          const endTime = query.endTime;
          // const startTime = 1672531200000;
          // const endTime = 1703894400000;
          const duration = endTime - startTime;
          const durationInDays = Math.ceil(duration / 1000 / 60 / 60 / 24);
          let sTime = startTime;
          let params: chartStatsRequestDto = {
            type: "TOTAL_PROGRAMS",
            companyId:
              userCompanyId !== null && category === "mine" ? companyId : "",
            startDate: startTime,
            endDate: endTime,
          };
          let totalProgrammesResponse = await this.programmeRepo
            .createQueryBuilder()
            .select([
              `"programmeId"`,
              `"currentStage"`,
              `"companyId"`,
              `"createdTime"`,
            ])
            .where(
              this.helperService.generateWhereSQLChartStastics(
                params,
                this.helperService.parseMongoQueryToSQL(abilityCondition)
              )
            )
            .getRawMany();
          let duraion: number;
          let durationCounts: number;
          if (durationInDays > 365) {
            duraion = 31104000000;
            durationCounts = Math.ceil(duration / 1000 / 60 / 60 / 24 / 365);
          } else if (durationInDays > 31) {
            duraion = 2592000000;
            durationCounts = Math.ceil(duration / 1000 / 60 / 60 / 24 / 30);
          } else if (durationInDays > 7) {
            duraion = 604800000;
            durationCounts = Math.ceil(duration / 1000 / 60 / 60 / 24 / 7);
          } else if (durationInDays > 1) {
            duraion = 86400000;
            durationCounts = Math.ceil(duration / 1000 / 60 / 60 / 24);
          }
          let data = {
            awaitingAuthorization: [],
            issued: [],
            rejected: [],
            programmes: [],
          };
          for (let index = 1; index <= durationCounts; index++) {
            let eTime = sTime + duraion;
            let pendingC = 0;
            let issuedC = 0;
            let rejectedC = 0;
            let programmesC = 0;
            // console.log("week count ---- ", index, { sTime, eTime });
            for (
              let indexProgramme = 0;
              indexProgramme < totalProgrammesResponse.length;
              indexProgramme++
            ) {
              if (
                totalProgrammesResponse[indexProgramme]?.createdTime >= sTime &&
                totalProgrammesResponse[indexProgramme]?.createdTime < eTime
              ) {
                programmesC++;
                totalProgrammesResponse[indexProgramme]?.currentStage ===
                  "AwaitingAuthorization" && pendingC++;
                totalProgrammesResponse[indexProgramme]?.currentStage ===
                  "Issued" && issuedC++;
                totalProgrammesResponse[indexProgramme]?.currentStage ===
                  "Rejected" && rejectedC++;
              }
              if (indexProgramme === totalProgrammesResponse.length - 1) {
                data?.awaitingAuthorization.push({ [sTime]: pendingC });
                data?.issued.push({ [sTime]: issuedC });
                data?.rejected.push({ [sTime]: rejectedC });
              }
            }
            sTime = eTime;
          }
          console.log("data ----------- > ", data);
          results[stat.type] = data;
          break;

        case ChartType.TOTAL_PROGRAMS_SECTOR:
          const startTimeSector = query.startTime;
          const endTimeSector = query.endTime;
          const durationSector = endTimeSector - startTimeSector;
          const durationSectorInDays = Math.ceil(
            durationSector / 1000 / 60 / 60 / 24
          );
          let sTimeSector = startTimeSector;
          let paramsSector: chartStatsRequestDto = {
            type: "TOTAL_PROGRAMS",
            companyId:
              userCompanyId !== null && category === "mine" ? companyId : "",
            startDate: startTimeSector,
            endDate: endTimeSector,
          };
          let totalProgrammesResponseSector = await this.programmeRepo
            .createQueryBuilder()
            .select([
              `"programmeId"`,
              `"sector"`,
              `"companyId"`,
              `"createdTime"`,
            ])
            .where(
              this.helperService.generateWhereSQLChartStastics(
                paramsSector,
                this.helperService.parseMongoQueryToSQL(abilityCondition)
              )
            )
            .getRawMany();
          let duraionSectorT: number;
          let durationSectorCounts: number;
          if (durationSectorInDays > 31) {
            duraionSectorT = 2592000000;
            durationSectorCounts = Math.ceil(
              durationSector / 1000 / 60 / 60 / 24 / 30
            );
          } else if (durationSectorInDays > 7) {
            duraionSectorT = 604800000;
            durationSectorCounts = Math.ceil(
              durationSector / 1000 / 60 / 60 / 24 / 7
            );
          } else if (durationSectorInDays > 1) {
            duraionSectorT = 86400000;
            durationSectorCounts = Math.ceil(
              durationSector / 1000 / 60 / 60 / 24
            );
          }
          let dataSector = {
            energy: [],
            health: [],
            education: [],
            transport: [],
            manufacturing: [],
            hospitality: [],
            forestry: [],
            waste: [],
            agriculture: [],
            other: [],
            programmes: [],
          };
          for (let index = 1; index <= durationSectorCounts; index++) {
            let eTime = sTimeSector + duraionSectorT;
            let energyC = 0;
            let healthC = 0;
            let educationC = 0;
            let transportC = 0;
            let manufacturingC = 0;
            let hospitalityC = 0;
            let forestryC = 0;
            let wasteC = 0;
            let agricultureC = 0;
            let otherC = 0;
            let programmesC = 0;
            // console.log("week count ---- ", index, { sTimeSector, eTime });
            for (
              let indexProgramme = 0;
              indexProgramme < totalProgrammesResponseSector.length;
              indexProgramme++
            ) {
              if (
                totalProgrammesResponseSector[indexProgramme]?.createdTime >=
                  sTimeSector &&
                totalProgrammesResponseSector[indexProgramme]?.createdTime <
                  eTime
              ) {
                let prgramme =
                  totalProgrammesResponseSector[indexProgramme]?.programmeId;
                programmesC++;
                totalProgrammesResponseSector[indexProgramme]?.sector ===
                  "Energy" && energyC++;
                totalProgrammesResponseSector[indexProgramme]?.sector ===
                  "Health" && healthC++;
                totalProgrammesResponseSector[indexProgramme]?.sector ===
                  "Education" && educationC++;
                totalProgrammesResponseSector[indexProgramme]?.sector ===
                  "Transport" && transportC++;
                totalProgrammesResponseSector[indexProgramme]?.sector ===
                  "Manufacturing" && manufacturingC++;
                totalProgrammesResponseSector[indexProgramme]?.sector ===
                  "Hospitality" && hospitalityC++;
                totalProgrammesResponseSector[indexProgramme]?.sector ===
                  "Forestry" && forestryC++;
                totalProgrammesResponseSector[indexProgramme]?.sector ===
                  "Waste" && wasteC++;
                totalProgrammesResponseSector[indexProgramme]?.sector ===
                  "Agriculture" && agricultureC++;
                totalProgrammesResponseSector[indexProgramme]?.sector ===
                  "Other" && otherC++;
              }
              if (indexProgramme === totalProgrammesResponseSector.length - 1) {
                dataSector?.energy.push({ [sTimeSector]: energyC });
                dataSector?.health.push({ [sTimeSector]: healthC });
                dataSector?.education.push({ [sTimeSector]: educationC });
                dataSector?.transport.push({ [sTimeSector]: transportC });
                dataSector?.manufacturing.push({
                  [sTimeSector]: manufacturingC,
                });
                dataSector?.hospitality.push({ [sTimeSector]: hospitalityC });
                dataSector?.forestry.push({ [sTimeSector]: forestryC });
                dataSector?.waste.push({ [sTimeSector]: wasteC });
                dataSector?.agriculture.push({ [sTimeSector]: agricultureC });
                dataSector?.other.push({ [sTimeSector]: otherC });
              }
            }
            sTimeSector = eTime;
          }
          console.log("dataSector ----------- > ", dataSector);
          results[stat.type] = dataSector;
          break;

        case ChartType.TOTAL_CREDITS:
          const startTimeCredit = query.startTime;
          const endTimeCredit = query.endTime;
          const durationCredit = endTimeCredit - startTimeCredit;
          const durationCreditInDays = Math.ceil(
            durationCredit / 1000 / 60 / 60 / 24
          );
          let sTimeCredit = startTimeCredit;
          let paramsCredit: chartStatsRequestDto = {
            type: "TOTAL_PROGRAMS",
            companyId:
              userCompanyId !== null && category === "mine" ? companyId : "",
            startDate: startTimeCredit,
            endDate: endTimeCredit,
          };
          let totalResponseCredit = await this.programmeRepo
            .createQueryBuilder()
            .select([
              `"programmeId"`,
              `"companyId"`,
              `"creditIssued"`,
              `"creditEst"`,
              `"creditBalance"`,
              `"creditTransferred"`,
              `"creditRetired"`,
              `"createdTime"`,
            ])
            .where(
              this.helperService.generateWhereSQLChartStastics(
                paramsCredit,
                this.helperService.parseMongoQueryToSQL(abilityCondition)
              )
            )
            .getRawMany();
          let duraionCreditT: number;
          let durationCreditCounts: number;
          if (durationCreditInDays > 31) {
            duraionCreditT = 2592000000;
            durationCreditCounts = Math.ceil(
              durationCredit / 1000 / 60 / 60 / 24 / 30
            );
          } else if (durationCreditInDays > 7) {
            duraionCreditT = 604800000;
            durationCreditCounts = Math.ceil(
              durationCredit / 1000 / 60 / 60 / 24 / 7
            );
          } else if (durationCreditInDays > 1) {
            duraionCreditT = 86400000;
            durationCreditCounts = Math.ceil(
              durationCredit / 1000 / 60 / 60 / 24
            );
          }
          let dataCredits = {
            authorized: [],
            issued: [],
            transferred: [],
            retired: [],
          };
          for (let index = 1; index <= durationCreditCounts; index++) {
            let eTimeCredit = sTimeCredit + duraionCreditT;
            let availableS = 0;
            let estimatedS = 0;
            let issuedS = 0;
            let transferredS = 0;
            let retiredS = 0;
            // console.log("week count ---- ", index, { sTime, eTime });
            for (
              let indexProgramme = 0;
              indexProgramme < totalResponseCredit.length;
              indexProgramme++
            ) {
              if (
                totalResponseCredit[indexProgramme]?.createdTime >=
                  sTimeCredit &&
                totalResponseCredit[indexProgramme]?.createdTime < eTimeCredit
              ) {
                if (
                  totalResponseCredit[indexProgramme]?.creditBalance !== null
                ) {
                  availableS =
                    availableS +
                    parseFloat(
                      totalResponseCredit[indexProgramme]?.creditBalance
                    );
                }
                if (
                  totalResponseCredit[indexProgramme]?.creditIssued !== null
                ) {
                  issuedS =
                    issuedS +
                    parseFloat(
                      totalResponseCredit[indexProgramme]?.creditIssued
                    );
                }
                if (
                  totalResponseCredit[indexProgramme]?.creditTransferred !==
                  null
                ) {
                  transferredS =
                    transferredS +
                    parseFloat(
                      totalResponseCredit[indexProgramme]?.creditTransferred
                    );
                }
                if (
                  totalResponseCredit[indexProgramme]?.creditRetired !== null
                ) {
                  retiredS =
                    retiredS +
                    parseFloat(
                      totalResponseCredit[indexProgramme]?.creditRetired
                    );
                }
                if (totalResponseCredit[indexProgramme]?.creditEst !== null) {
                  estimatedS =
                    estimatedS +
                    parseFloat(totalResponseCredit[indexProgramme]?.creditEst);
                }
              }
              if (indexProgramme === totalResponseCredit.length - 1) {
                dataCredits?.authorized.push({
                  [sTimeCredit]: estimatedS - issuedS,
                });
                dataCredits?.issued.push({ [sTimeCredit]: availableS });
                dataCredits?.transferred.push({ [sTimeCredit]: transferredS });
                dataCredits?.retired.push({ [sTimeCredit]: retiredS });
              }
            }
            sTimeCredit = eTimeCredit;
          }
          results[stat.type] = dataCredits;
          break;

        case ChartType.TOTAL_CREDITS_CERTIFIED:
          const startTimeCreditsCertified = query.startTime;
          const endTimeCreditsCertified = query.endTime;
          const durationCreditCertified =
            endTimeCreditsCertified - startTimeCreditsCertified;
          const durationCreditInDaysCertified = Math.ceil(
            durationCreditCertified / 1000 / 60 / 60 / 24
          );
          let sTimeCreditCertified = startTimeCreditsCertified;
          let paramsCreditsCertified: chartStatsRequestDto = {
            type: "TOTAL_CREDITS_CERTIFIED",
            companyId:
              userCompanyId !== null && category === "mine" ? companyId : "",
            startDate: startTimeCreditsCertified,
            endDate: endTimeCreditsCertified,
          };
          let totalResponseCreditsCertified = await this.programmeRepo
            .createQueryBuilder()
            .select([
              `"programmeId"`,
              `"companyId"`,
              `"creditBalance"`,
              `"certifierId"`,
              `"createdTime"`,
            ])
            .where(
              this.helperService.generateWhereSQLChartStastics(
                paramsCreditsCertified,
                this.helperService.parseMongoQueryToSQL(abilityCondition)
              )
            )
            .getRawMany();
          let duraionCreditCertifiedT: number;
          let durationCreditCertifiedCounts: number;
          if (durationCreditInDaysCertified > 31) {
            duraionCreditCertifiedT = 2592000000;
            durationCreditCertifiedCounts = Math.ceil(
              durationCreditCertified / 1000 / 60 / 60 / 24 / 30
            );
          } else if (durationCreditInDaysCertified > 7) {
            duraionCreditCertifiedT = 604800000;
            durationCreditCertifiedCounts = Math.ceil(
              durationCreditCertified / 1000 / 60 / 60 / 24 / 7
            );
          } else if (durationCreditInDaysCertified > 1) {
            duraionCreditCertifiedT = 86400000;
            durationCreditCertifiedCounts = Math.ceil(
              durationCreditCertified / 1000 / 60 / 60 / 24
            );
          }
          let dataCreditsCertified = {
            certified: [],
            uncertified: [],
          };
          for (let index = 1; index <= durationCreditCertifiedCounts; index++) {
            let eTimeCreditCertified =
              sTimeCreditCertified + duraionCreditCertifiedT;
            let certifiedS = 0;
            let unCertifiedS = 0;
            // console.log("week count ---- ", index, { sTime, eTime });
            for (
              let indexProgramme = 0;
              indexProgramme < totalResponseCreditsCertified.length;
              indexProgramme++
            ) {
              if (
                totalResponseCreditsCertified[indexProgramme]?.createdTime >=
                  sTimeCreditCertified &&
                totalResponseCreditsCertified[indexProgramme]?.createdTime <
                  eTimeCreditCertified
              ) {
                if (
                  totalResponseCreditsCertified[indexProgramme]
                    ?.creditBalance !== null &&
                  totalResponseCreditsCertified[indexProgramme]?.certifierId !==
                    null
                ) {
                  certifiedS =
                    certifiedS +
                    parseFloat(
                      totalResponseCreditsCertified[indexProgramme]
                        ?.creditBalance
                    );
                }
                if (
                  totalResponseCreditsCertified[indexProgramme]
                    ?.creditBalance !== null &&
                  totalResponseCreditsCertified[indexProgramme]?.certifierId ===
                    null
                ) {
                  unCertifiedS =
                    unCertifiedS +
                    parseFloat(
                      totalResponseCreditsCertified[indexProgramme]
                        ?.creditBalance
                    );
                }
              }
              if (indexProgramme === totalResponseCreditsCertified.length - 1) {
                dataCreditsCertified?.certified.push({
                  [sTimeCreditCertified]: certifiedS,
                });
                dataCreditsCertified?.uncertified.push({
                  [sTimeCreditCertified]: unCertifiedS,
                });
              }
            }
            sTimeCreditCertified = eTimeCreditCertified;
          }
          results[stat.type] = dataCreditsCertified;
          break;

        case ChartType.PROGRAMME_LOCATIONS:
          const startTimeProgrammeLocations = query.startTime;
          const endTimeProgrammeLocations = query.endTime;
          interface ProgrammeLocationFeatureGeometry {
            type: string;
            coordinates: any[];
          }

          interface ProgrammeLocationFeatureProperties {
            id: string;
            count: number;
          }

          interface ProgrammeLocationFeature {
            type: string;
            properties: ProgrammeLocationFeatureProperties;
            geometry: ProgrammeLocationFeatureGeometry;
          }

          interface ProgrammeLocationData {
            type: string;
            features: ProgrammeLocationFeature[];
          }
          let paramsProgrammeLocations: chartStatsRequestDto = {
            type: "TOTAL_PROGRAMS",
            companyId:
              userCompanyId !== null && category === "mine" ? companyId : "",
            startDate: startTimeProgrammeLocations,
            endDate: endTimeProgrammeLocations,
          };
          let totalResponseProgrammeLocation = await this.programmeRepo
            .createQueryBuilder()
            .select([
              `"programmeId"`,
              `"companyId"`,
              `"programmeProperties"`,
              `"createdTime"`,
            ])
            .where(
              this.helperService.generateWhereSQLChartStastics(
                paramsProgrammeLocations,
                this.helperService.parseMongoQueryToSQL(abilityCondition)
              )
            )
            .getRawMany();
          let locationsGeoData: any = {};
          let features: any[] = [];
          locationsGeoData.type = "FeatureCollection";
          for (let i = 0; i < totalResponseProgrammeLocation.length; i++) {
            let programme: any =
              totalResponseProgrammeLocation[i]?.programmeProperties;
            let programmePropertiesGeoCordinates: any[] =
              programme?.geographicalLocationCordintes;
            if (programmePropertiesGeoCordinates) {
              for (
                let j = 0;
                j < programmePropertiesGeoCordinates?.length;
                j++
              ) {
                console.log(
                  "cordinates ---- > ",
                  programmePropertiesGeoCordinates[j]
                );
                let programmeGeoData: any = {};
                let location: any = programmePropertiesGeoCordinates[j];
                programmeGeoData.type = "Feature";
                let properties: any = {};
                let geometry: any = {};
                properties.id = String(i) + String(j);
                properties.count = 1;
                geometry.type = "Point";
                geometry.coordinates = location;
                programmeGeoData.properties = properties;
                programmeGeoData.geometry = geometry;
                features.push(programmeGeoData);
              }
            }
          }
          // for (let i = 0; i < features.length; i++) {
          //   for (let j = i + 1; i < features.length; j++) {
          //     if (
          //       features[i]?.geometry?.coordinates &&
          //       features[j]?.geometry?.coordinates
          //     ) {
          //       if (
          //         features[i]?.geometry?.coordinates ===
          //         features[j]?.geometry?.coordinates
          //       ) {
          //         features[i].properties.count =
          //           features[i]?.properties?.count + 1;
          //         features[j].properties.count =
          //           features[j]?.properties?.count + 1;
          //       }
          //     }
          //   }
          // }
          locationsGeoData.features = [...features];

          results[stat.type] = locationsGeoData;
          break;
      }
    }
    return new ChartStatsResponseDto(results);
  }

  async programmesStaticDetails(
    abilityCondition: string,
    query: StatList,
    companyId: any
  ): Promise<DataCountResponseDto> {
    let userCompanyId = companyId;
    let category = query?.category;
    let results = {};
    for (const stat of query.stats) {
      switch (stat.type) {
        case StatType.TOTAL_PROGRAMS:
          const startTimeProgramme = query.startTime;
          const endTimeProgramme = query.endTime;
          const valuesProgrammes: programmeStatusRequestDto = {
            type: "TOTAL_PROGRAMS",
            companyId:
              userCompanyId !== null && category === "mine" ? companyId : "",
            startTime: startTimeProgramme,
            endTime: endTimeProgramme,
          };
          let totalProgrammesResponse = await this.programmeRepo
            .createQueryBuilder()
            .where(
              this.helperService.generateWhereSQLStastics(
                valuesProgrammes,
                this.helperService.parseMongoQueryToSQL(abilityCondition)
              )
            )
            .getCount();

          results[stat.type] = totalProgrammesResponse;
          break;

        case StatType.PROGRAMS_BY_STATUS:
          const startTimeProgrammeStatus = query.startTime;
          const endTimeProgrammeStatus = query.endTime;
          const values: programmeStatusRequestDto = {
            type: "PROGRAMS_BY_STATUS",
            value: stat.value,
            companyId:
              userCompanyId !== null && category === "mine" ? companyId : "",
            startTime: startTimeProgrammeStatus,
            endTime: endTimeProgrammeStatus,
          };
          let programmeByStatus = await this.programmeRepo
            .createQueryBuilder()
            .where(
              this.helperService.generateWhereSQLStastics(
                values,
                this.helperService.parseMongoQueryToSQL(abilityCondition)
              )
            )
            .getCount();
          results[stat.value] = programmeByStatus;
          break;

        case StatType.TRANSFER_REQUEST:
          let transferRequest = await this.programmeTransferRepo
            .createQueryBuilder()
            .where(
              abilityCondition
                ? this.helperService.parseMongoQueryToSQL(abilityCondition)
                : ""
            )
            .getCount();
          results[stat.type] = transferRequest;
          break;

        case StatType.TRANSFER_REQUEST_SENT:
          const valuesTransferRequestSent: programmeStatusRequestDto = {
            type: stat.type,
          };
          let transferRequestSent = await this.programmeTransferRepo
            .createQueryBuilder()
            .where(
              this.helperService.generateWhereSQLChartStasticsWithoutTimeRange(
                valuesTransferRequestSent,
                this.helperService.parseMongoQueryToSQL(abilityCondition)
              )
            )
            .getCount();
          results[stat.type] = transferRequestSent;
          break;

        case StatType.PROGRAMS_CERTIFIED:
          const valuesProgrammesCertified: programmeStatusRequestDto = {
            type: stat.type,
          };
          let programmesCertified = await this.programmeRepo
            .createQueryBuilder()
            .where(
              this.helperService.generateWhereSQLChartStasticsWithoutTimeRange(
                valuesProgrammesCertified,
                this.helperService.parseMongoQueryToSQL(abilityCondition)
              )
            )
            .getCount();
          results[stat.type] = programmesCertified;
          break;

        case StatType.PROGRAMS_UNCERTIFIED:
          const valuesProgrammesUnCertified: programmeStatusRequestDto = {
            type: stat.type,
          };
          let programmesUnCertified = await this.programmeRepo
            .createQueryBuilder()
            .where(
              this.helperService.generateWhereSQLChartStasticsWithoutTimeRange(
                valuesProgrammesUnCertified,
                this.helperService.parseMongoQueryToSQL(abilityCondition)
              )
            )
            .getCount();
          results[stat.type] = programmesUnCertified;
          break;

        case StatType.TRANSFER_REQUEST_RECEIVED:
          const valuesTransferRequestReceived: programmeStatusRequestDto = {
            type: stat.type,
          };
          let transferRequestReceived = await this.programmeTransferRepo
            .createQueryBuilder()
            .where(
              this.helperService.generateWhereSQLChartStasticsWithoutTimeRange(
                valuesTransferRequestReceived,
                this.helperService.parseMongoQueryToSQL(abilityCondition)
              )
            )
            .getCount();
          results[stat.type] = transferRequestReceived;
          break;

        case StatType.CREDIT_STATS_BALANCE:
        case StatType.CREDIT_STATS_TRANSFERRED:
        case StatType.CREDIT_STATS_RETIRED:
        case StatType.CREDIT_STATS_ISSUED:
        case StatType.CREDIT_STATS_ESTIMATED:
          const startTimeProgrammeCredits = query.startTime;
          const endTimeProgrammeCredits = query.endTime;
          const valuesCreditRequest: programmeStatusRequestDto = {
            type: stat.type,
            companyId:
              userCompanyId !== null && category === "mine" ? companyId : "",
            startTime: startTimeProgrammeCredits,
            endTime: endTimeProgrammeCredits,
          };
          let creditStat = await this.programmeRepo
            .createQueryBuilder()
            .select(`SUM("${CreditStatType[stat.type]}")`)
            .where(
              this.helperService.generateWhereSQLStastics(
                valuesCreditRequest,
                this.helperService.parseMongoQueryToSQL(abilityCondition)
              )
            )
            .getRawOne();
          results[stat.type] = creditStat;
          break;

        case StatType.CREDIT_CERTIFIED_BALANCE:
        case StatType.CREDIT_CERTIFIED_TRANSFERRED:
        case StatType.CREDIT_CERTIFIED_RETIRED:
        case StatType.CREDIT_CERTIFIED_ISSUED:
        case StatType.CREDIT_CERTIFIED:
        case StatType.CREDIT_UNCERTIFIED:
        case StatType.CREDIT_REVOKED:
          const startTimeProgrammeCreditsCertified = query.startTime;
          const endTimeProgrammeCreditsCertified = query.endTime;
          const certifiedRequestParams: programmeStatusRequestDto = {
            type: stat.type,
            companyId:
              userCompanyId !== null && category === "mine" ? companyId : "",
            startTime: startTimeProgrammeCreditsCertified,
            endTime: endTimeProgrammeCreditsCertified,
          };
          let creditCertifiedResponse = await this.programmeRepo
            .createQueryBuilder()
            .select(`SUM("${CreditStatType[stat.type]}")`)
            .where(
              this.helperService.generateWhereSQLStastics(
                certifiedRequestParams,
                this.helperService.parseMongoQueryToSQL(abilityCondition)
              )
            )
            .getRawOne();
          results[stat.type] = creditCertifiedResponse;
          break;
      }
    }
    return new DataCountResponseDto(results);
  }
}
