import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TxType } from "../shared/enum/txtype.enum";
import { Repository } from "typeorm";
import { Company } from "../shared/entities/company.entity";
import { Programme } from "../shared/entities/programme.entity";
import { CreditOverall } from "../shared/entities/credit.overall.entity";
import { LocationInterface } from "../shared/location/location.interface";
import { CompanyRole } from "src/shared/enum/company.role.enum";

@Injectable()
export class ProcessEventService {
  constructor(
    private logger: Logger,
    @InjectRepository(Programme) private programmeRepo: Repository<Programme>,
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    private locationService: LocationInterface,
  ) {}

  async process(programme: Programme, overall: CreditOverall, version: number, txTime: number): Promise<any> {
    this.logger.log(`Processing message ${programme} ${overall} ${version} ${txTime}`)
    if (programme) {
      const previousProgramme = await this.programmeRepo.findOneBy({
        programmeId: programme.programmeId,
      });

      if (
        previousProgramme == null ||
        programme.txTime == undefined ||
        previousProgramme.txTime == undefined ||
        previousProgramme.txTime <= programme.txTime
      ) {
        try {
          let address: any[] = [];
          if (programme && programme.programmeProperties) {
            if (programme.txType === TxType.CREATE) {
              const programmeProperties = programme.programmeProperties;
              if (programmeProperties.geographicalLocation) {
                for (
                  let index = 0;
                  index < programmeProperties.geographicalLocation.length;
                  index++
                ) {
                  address.push(programmeProperties.geographicalLocation[index]);
                }
              }
              await this.locationService.getCoordinatesForRegion([...address]).then(
                (response: any) => {
                  console.log(
                    "response from forwardGeoCoding function -> ",
                    response
                  );
                  programme.geographicalLocationCordintes = [...response];
                }
              );
            } else if (
              programme.txType === TxType.CERTIFY ||
              programme.txType === TxType.REVOKE
            ) {
              programme.certifiedTime = programme.txTime;
            } else if (programme.txType === TxType.AUTH) {
              programme.authTime = programme.txTime;
            }

            if (
              [TxType.AUTH, TxType.REJECT, TxType.CREATE].includes(
                programme.txType
              )
            ) {
              programme.statusUpdateTime = programme.txTime;
            }
            if (
              [TxType.ISSUE, TxType.RETIRE, TxType.TRANSFER, TxType.AUTH, TxType.FREEZE, TxType.UNFREEZE].includes(
                programme.txType
              )
            ) {
              programme.creditUpdateTime = programme.txTime;
            }
          }
        } catch (error) {
          console.log(
            "Getting cordinates with forward geocoding failed -> ",
            error
          );
        } finally {
          programme.updatedAt = new Date(programme.txTime);
          programme.createdAt = new Date(programme.createdTime);
          const columns =
            this.programmeRepo.manager.connection.getMetadata(
              "Programme"
            ).columns;
          // const columnNames = columns
          //   .filter(function (item) {
          //     return (
          //       item.propertyName !== "programmeId" &&
          //       item.propertyName !== "geographicalLocationCordintes"
          //     );
          //   })
          //   .map((e) => e.propertyName);
          const columnNames = columns
            .filter(function (item) {
              return programme[item.propertyName] != undefined;
            })
            .map((e) => e.propertyName);

          this.logger.debug(`${columnNames} ${JSON.stringify(programme)}`);
          return await this.programmeRepo
            .createQueryBuilder()
            .insert()
            .values(programme)
            .orUpdate(columnNames, ["programmeId"])
            .execute();
        }
      } else {
        this.logger.error(
          `Skipping the programme due to old record ${JSON.stringify(
            programme
          )} ${previousProgramme}`
        );
      }
    }

    if (overall) {
      const parts = overall.txId.split("#");
            const companyId = parseInt(parts[0]);
            let account;
            if (parts.length > 1) {
              account = parts[1];
            }
            const company = await this.companyRepo.findOneBy({
              companyId: companyId,
            });

            if (company) {
              // const meta = JSON.parse(
              //   JSON.stringify(
              //     ionRecord.get("payload").get("revision").get("metadata")
              //   )
              // );

              // if (company && meta["version"]) {
              //   if (company.lastUpdateVersion >= parseInt(meta["version"])) {
              //     return;
              //   }
              // }

        let updateObj;
        if (account) {
          if (
            company.secondaryAccountBalance &&
            company.secondaryAccountBalance[account]
          ) {
            company.secondaryAccountBalance[account]["total"] = overall.credit;
            company.secondaryAccountBalance[account]["count"] += 1;
          } else {
            company.secondaryAccountBalance = {
              account: { total: overall.credit, count: 1 },
            };
          }

          updateObj = {
            secondaryAccountBalance: company.secondaryAccountBalance,
            lastUpdateVersion: version,
          };
        } else {
          updateObj = {
            creditBalance: overall.credit,
            programmeCount:
              company.companyRole === CompanyRole.GOVERNMENT
                ? null
                : Number(company.programmeCount) +
                  (overall.txType == TxType.AUTH ? 1 : 0),
            lastUpdateVersion: version,
            creditTxTime: [
              TxType.ISSUE,
              TxType.TRANSFER,
              TxType.RETIRE,
              TxType.FREEZE,
              TxType.UNFREEZE,
            ].includes(overall.txType)
              ? txTime
              : undefined,
          };
        }

              const response = await this.companyRepo
                .update(
                  {
                    companyId: parseInt(overall.txId),
                  },
                  updateObj
                )
                .catch((err: any) => {
                  this.logger.error(err);
                  return err;
                });
            } else {
              this.logger.error(
                "Unexpected programme. Company does not found",
                companyId
              );
            }
    }
  }
}
