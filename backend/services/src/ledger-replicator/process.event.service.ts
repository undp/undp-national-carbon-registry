import { Injectable, Logger } from "@nestjs/common";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager } from "typeorm";
import { TxType } from "@app/shared/enum/txtype.enum";
import { Company } from "@app/shared/entities/company.entity";
import { Programme } from "@app/shared/entities/programme.entity";
import { CreditOverall } from "@app/shared/entities/credit.overall.entity";
import { LocationInterface } from "@app/shared/location/location.interface";
import { CompanyRole } from "@app/shared/enum/company.role.enum";
import { AsyncOperationsInterface } from "@app/shared/async-operations/async-operations.interface";
import { AsyncActionType } from "@app/shared/enum/async.action.type.enum";
import { ProgrammeSl } from "@app/shared/entities/programmeSl.entity";
import { OrganisationCreditAccounts } from "@app/shared/enum/organisation.credit.accounts.enum";

@Injectable()
export class ProcessEventService {
  constructor(
    private logger: Logger,
    @InjectRepository(Programme) private programmeRepo: Repository<Programme>,
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    @InjectRepository(ProgrammeSl)
    private programmeSlRepo: Repository<ProgrammeSl>,
    private asyncOperationsInterface: AsyncOperationsInterface,
    private locationService: LocationInterface,
    @InjectEntityManager() private entityManager: EntityManager
  ) {}

  async process(
    programme: Programme,
    overall: CreditOverall,
    version: number,
    txTime: number
  ): Promise<any> {
    this.logger.log(
      `Processing message ${programme} ${overall} ${version} ${txTime}`
    );
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
              await this.locationService
                .getCoordinatesForRegion([...address])
                .then((response: any) => {
                  programme.geographicalLocationCordintes = [...response];
                });

              if (programme.article6trade == true) {
                await this.asyncOperationsInterface.AddAction({
                  actionType: AsyncActionType.CADTProgrammeCreate,
                  actionProps: programme,
                });
              }
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
              [
                TxType.ISSUE,
                TxType.RETIRE,
                TxType.TRANSFER,
                TxType.AUTH,
                TxType.FREEZE,
                TxType.UNFREEZE,
              ].includes(programme.txType)
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
          if (account === OrganisationCreditAccounts.TRACK_1) {
            if (
              company.slcfAccountBalance &&
              company.slcfAccountBalance["TRACK_1"]
            ) {
              company.slcfAccountBalance["TRACK_1"] = overall.credit;
            } else {
              if (!company.slcfAccountBalance) {
                company.slcfAccountBalance = {};
              }
              company.slcfAccountBalance["TRACK_1"] = overall.credit;
            }

            updateObj = {
              slcfAccountBalance: company.slcfAccountBalance,
              lastUpdateVersion: version,
            };
          } else if (account == OrganisationCreditAccounts.TRACK_2) {
            if (
              company.slcfAccountBalance &&
              company.slcfAccountBalance["TRACK_2"]
            ) {
              company.slcfAccountBalance["TRACK_2"] = overall.credit;
            } else {
              if (!company.slcfAccountBalance) {
                company.slcfAccountBalance = {};
              }
              company.slcfAccountBalance["TRACK_2"] = overall.credit;
            }

            updateObj = {
              slcfAccountBalance: company.slcfAccountBalance,
              lastUpdateVersion: version,
            };
          } else {
            if (
              company.secondaryAccountBalance &&
              company.secondaryAccountBalance[account]
            ) {
              company.secondaryAccountBalance[account]["total"] =
                overall.credit;
              company.secondaryAccountBalance[account]["count"] += 1;
            } else {
              if (!company.secondaryAccountBalance) {
                company.secondaryAccountBalance = {};
              }
              company.secondaryAccountBalance[account] = {
                total: overall.credit,
                count: 1,
              };
            }

            updateObj = {
              secondaryAccountBalance: company.secondaryAccountBalance,
              lastUpdateVersion: version,
            };
          }
        } else {
          updateObj = {
            creditBalance: overall.credit,
            programmeCount:
              Number(company.programmeCount) +
              (overall.txType == TxType.AUTH ? 1 : 0),
            lastUpdateVersion: version,
            creditTxTime: [
              TxType.ISSUE,
              TxType.TRANSFER,
              TxType.RETIRE,
              TxType.FREEZE,
              TxType.UNFREEZE,
              TxType.TRANSFER_SL,
              TxType.RETIRE_SL,
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

  async processProgrammeSl(programme: ProgrammeSl): Promise<any> {
    this.logger.log(`Processing message ${programme}`);
    if (programme) {
      const previousProgramme = await this.programmeSlRepo.findOneBy({
        programmeId: programme.programmeId,
      });
      if (
        previousProgramme == null ||
        programme.txTime == undefined ||
        previousProgramme.txTime == undefined ||
        previousProgramme.txTime <= programme.txTime
      ) {
        const columns =
          this.programmeRepo.manager.connection.getMetadata(
            "ProgrammeSl"
          ).columns;

        const columnNames = columns
          .filter(function (item) {
            return programme[item.propertyName] != undefined;
          })
          .map((e) => e.propertyName);

        this.logger.debug(`${columnNames} ${JSON.stringify(programme)}`);
        await this.entityManager.transaction(async (em) => {
          await em
            .getRepository(ProgrammeSl)
            .createQueryBuilder()
            .insert()
            .values(programme)
            .orUpdate(columnNames, ["programmeId"])
            .execute();

          if (!previousProgramme) {
            await em
              .getRepository(Company)
              .createQueryBuilder()
              .update(Company)
              .set({
                programmeCount: () => `COALESCE("programmeCount", 0) + 1`,
              })
              .where("companyId = :id", { id: programme.companyId })
              .execute();
          }
        });
      } else {
        this.logger.error(
          `Skipping the programme due to old record ${JSON.stringify(
            programme
          )} ${previousProgramme}`
        );
      }
    }
  }
}
