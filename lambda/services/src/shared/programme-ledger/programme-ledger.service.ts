import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { PRECISION } from "carbon-credit-calculator/dist/esm/calculator";
import { plainToClass } from "class-transformer";
import { dom } from "ion-js";
import axios from "axios";
import { generateSerialNumber } from "serial-number-gen";
import { EntityManager } from "typeorm";
import { ProgrammeHistoryDto } from "../dto/programme.history.dto";
import { ProgrammeTransferApprove } from "../dto/programme.transfer.approve";
import { Company } from "../entities/company.entity";
import { CreditOverall } from "../entities/credit.overall.entity";
import { Programme } from "../entities/programme.entity";
import { ProgrammeTransfer } from "../entities/programme.transfer";
import { TxType } from "../enum/txtype.enum";
import {
  ArrayIn,
  ArrayLike,
  LedgerDbService,
} from "../ledger-db/ledger-db.service";
import { ProgrammeStage } from "../../shared/enum/programme-status.enum";
import { User } from "../entities/user.entity";

@Injectable()
export class ProgrammeLedgerService {
  constructor(
    private readonly logger: Logger,
    @InjectEntityManager() private entityManger: EntityManager,
    private ledger: LedgerDbService
  ) {}

  async forwardGeocoding(address: any[]) {
    let geoCodinates: any[] = [];
    const ACCESS_TOKEN =
      "";

    for (let index = 0; index < address.length; index++) {
      const url =
        "https://api.mapbox.com/geocoding/v5/mapbox.places/" +
        encodeURIComponent(address[index]) +
        ".json?access_token=" +
        ACCESS_TOKEN +
        "&limit=1";
      await axios
        .get(url)
        .then(function (response) {
          // handle success
          console.log(
            "cordinates data in replicator -> ",
            response?.data?.features[0],
            response?.data?.features[0]?.center
          );
          geoCodinates.push([...response?.data?.features[0]?.center]);
        })
        .catch((err) => {
          this.logger.error(err);
          return err;
        });
    }

    return geoCodinates;
  }

  public async createProgramme(programme: Programme): Promise<Programme> {
    this.logger.debug("Creating programme", JSON.stringify(programme));
    programme.txType = TxType.CREATE;

    const getQueries = {};
    getQueries[this.ledger.tableName] = {
      externalId: programme.externalId,
    };

    const resp = await this.ledger.getAndUpdateTx(
      getQueries,
      (results: Record<string, dom.Value[]>) => {
        const programmes: Programme[] = results[this.ledger.tableName].map(
          (domValue) => {
            return plainToClass(
              Programme,
              JSON.parse(JSON.stringify(domValue))
            );
          }
        );
        if (programmes.length > 0) {
          throw new HttpException(
            "Programme already exist with the given externalId",
            HttpStatus.BAD_REQUEST
          );
        }

        let insertMap = {};
        insertMap[this.ledger.tableName] = programme;

        return [{}, {}, insertMap];
      }
    );
    // let address: any[] = [];
    // if (programme && programme.programmeProperties) {
    //   if (programme.currentStage === "AwaitingAuthorization") {
    //     const programmeProperties = programme.programmeProperties;
    //     if (programmeProperties.geographicalLocation) {
    //       for (
    //         let index = 0;
    //         index < programmeProperties.geographicalLocation.length;
    //         index++
    //       ) {
    //         address.push(programmeProperties.geographicalLocation[index]);
    //       }
    //     }
    //     await this.forwardGeocoding([...address]).then((response: any) => {
    //       programme.geographicalLocationCordintes = [...response];
    //     });
    //   }
    // }
    // if (programme) {
    //   await this.entityManger
    //     .save<Programme>(plainToClass(Programme, programme))
    //     .then((res: any) => {
    //       console.log("create programme in repo -- ", res);
    //     })
    //     .catch((e: any) => {
    //       console.log("create programme in repo -- ", e);
    //     });
    // }
    return programme;
  }

  public async transferProgramme(
    transfer: ProgrammeTransfer,
    name: string,
    reason: string,
    isRetirement: boolean = false
  ) {
    this.logger.log(`Transfer programme ${JSON.stringify(transfer)}`);

    const getQueries = {};
    getQueries[`history(${this.ledger.tableName})`] = {
      "data.programmeId": transfer.programmeId,
      "data.txRef": new ArrayLike(
        "data.txRef",
        "%#" + transfer.requestId + "#%"
      ),
    };
    getQueries[this.ledger.tableName] = {
      programmeId: transfer.programmeId,
    };

    const toAccountID = transfer.toAccount
      ? transfer.toCompanyId + "#" + transfer.toAccount
      : transfer.toCompanyId + "";
    const fromAccount = String(transfer.fromCompanyId);
    getQueries[this.ledger.companyTableName] = {
      txId: [fromAccount, toAccountID],
    };
    let updatedProgramme = undefined;
    const resp = await this.ledger.getAndUpdateTx(
      getQueries,
      (results: Record<string, dom.Value[]>) => {
        const alreadyProcessed = results[`history(${this.ledger.tableName})`];
        if (alreadyProcessed.length > 0) {
          throw new HttpException(
            "Programme transfer request already processed",
            HttpStatus.BAD_REQUEST
          );
        }
        const programmes: Programme[] = results[this.ledger.tableName].map(
          (domValue) => {
            return plainToClass(
              Programme,
              JSON.parse(JSON.stringify(domValue))
            );
          }
        );
        if (programmes.length <= 0) {
          throw new HttpException(
            "Programme does not exist",
            HttpStatus.BAD_REQUEST
          );
        }

        if (programmes.length <= 0) {
          throw new HttpException(
            `Project does not exist ${transfer.programmeId}`,
            HttpStatus.BAD_REQUEST
          );
        }
        const programme = programmes[0];
        if (!transfer.creditAmount) {
          transfer.creditAmount = programme.creditBalance;
        }

        let companyCreditBalances = {};
        const companies = results[this.ledger.companyTableName].map(
          (domValue) => {
            return plainToClass(
              CreditOverall,
              JSON.parse(JSON.stringify(domValue))
            );
          }
        );
        for (const company of companies) {
          companyCreditBalances[company.txId] = company.credit;
        }

        let companyCreditDistribution = {};
        if (programme.creditOwnerPercentage) {
          const percentages = [];
          const currentCredit = {};
          const frozenCredit = {};
          for (const i in programme.creditOwnerPercentage) {
            currentCredit[programme.companyId[i]] =
              (programme.creditBalance * programme.creditOwnerPercentage[i]) /
              100;

            frozenCredit[programme.companyId[i]] = programme.creditFrozen
              ? programme.creditFrozen[i]
              : 0;
          }
          if (!currentCredit[transfer.fromCompanyId]) {
            throw new HttpException(
              `Company ${transfer.fromCompanyId} is not an owner company of the programme`,
              HttpStatus.BAD_REQUEST
            );
          }

          if (
            currentCredit[transfer.fromCompanyId] -
              frozenCredit[transfer.fromCompanyId] <
            transfer.creditAmount
          ) {
            throw new HttpException(
              `Company ${transfer.fromCompanyId} does not have enough credits`,
              HttpStatus.BAD_REQUEST
            );
          }

          for (const i in programme.creditOwnerPercentage) {
            if (programme.companyId[i] == transfer.fromCompanyId) {
              percentages.push(
                programme.creditBalance - transfer.creditAmount != 0
                  ? parseFloat(
                      (
                        ((currentCredit[transfer.fromCompanyId] -
                          transfer.creditAmount) *
                          100) /
                        (programme.creditBalance - transfer.creditAmount)
                      ).toFixed(6)
                    )
                  : 0
              );
            } else {
              percentages.push(
                programme.creditBalance - transfer.creditAmount != 0
                  ? parseFloat(
                      (
                        (currentCredit[programme.companyId[i]] * 100) /
                        (programme.creditBalance - transfer.creditAmount)
                      ).toFixed(6)
                    )
                  : 0
              );
            }
          }
          programme.creditOwnerPercentage = percentages;
          this.logger.verbose("Updated owner percentages", percentages);
        }

        companyCreditDistribution[fromAccount] = -transfer.creditAmount;
        companyCreditDistribution[toAccountID] = transfer.creditAmount;

        const prvTxTime = programme.txTime;
        programme.txTime = new Date().getTime();
        programme.txRef = `${name}#${transfer.requestId}#${transfer.retirementType}#${reason}`;

        if (isRetirement) {
          // if (programme.creditBalance == transfer.creditAmount) {
          //   programme.currentStage = ProgrammeStage.RETIRED;
          // }
          programme.txType = TxType.RETIRE;
          if (!programme.creditRetired) {
            programme.creditRetired = 0;
          }
          programme.creditRetired += transfer.creditAmount;
        } else {
          programme.txType = TxType.TRANSFER;
          if (!programme.creditTransferred) {
            programme.creditTransferred = 0;
          }
          programme.creditTransferred += transfer.creditAmount;
        }
        programme.creditChange = transfer.creditAmount;
        programme.creditBalance -= transfer.creditAmount;

        // if (programme.creditBalance <= 0) {
        //   programme.currentStage = ProgrammeStage.TRANSFERRED;
        // }

        updatedProgramme = programme;
        const uPayload = {
          txTime: programme.txTime,
          txRef: programme.txRef,
          txType: programme.txType,
          creditChange: programme.creditChange,
          creditBalance: programme.creditBalance,
          companyId: programme.companyId,
          currentStage: programme.currentStage,
        };

        if (programme.creditOwnerPercentage) {
          uPayload["creditOwnerPercentage"] = programme.creditOwnerPercentage;
        }

        if (isRetirement) {
          uPayload["creditRetired"] = programme.creditRetired;
        } else {
          uPayload["creditTransferred"] = programme.creditTransferred;
        }

        let updateMap = {};
        let updateWhereMap = {};
        let insertMap = {};
        updateMap[this.ledger.tableName] = uPayload;
        updateWhereMap[this.ledger.tableName] = {
          programmeId: programme.programmeId,
          currentStage: ProgrammeStage.AUTHORISED.valueOf(),
          txTime: prvTxTime,
        };

        for (const com of [fromAccount, toAccountID]) {
          if (companyCreditBalances[com] != undefined) {
            updateMap[this.ledger.companyTableName + "#" + com] = {
              credit: this.round2Precision(
                companyCreditBalances[com] + companyCreditDistribution[com]
              ),
              txRef: transfer.requestId + "#" + programme.serialNo,
              txType: TxType.TRANSFER,
            };
            updateWhereMap[this.ledger.companyTableName + "#" + com] = {
              txId: com,
            };
          } else {
            insertMap[this.ledger.companyTableName + "#" + com] = {
              credit: this.round2Precision(companyCreditDistribution[com]),
              txRef: transfer.requestId + "#" + programme.serialNo,
              txType: TxType.TRANSFER,
              txId: com,
            };
          }
        }

        return [updateMap, updateWhereMap, insertMap];
      }
    );

    const affected = resp[this.ledger.tableName];
    if (affected && affected.length > 0) {
      return updatedProgramme;
    }
    return updatedProgramme;
  }

  public async getProgrammeById(programmeId: string): Promise<Programme> {
    const p = (
      await this.ledger.fetchRecords({
        programmeId: programmeId,
      })
    ).map((domValue) => {
      return plainToClass(Programme, JSON.parse(JSON.stringify(domValue)));
    });
    return p.length <= 0 ? null : p[0];
  }

  public async getProgrammeHistory(
    programmeId: string
  ): Promise<ProgrammeHistoryDto[]> {
    return (
      await this.ledger.fetchHistory({
        programmeId: programmeId,
      })
    )?.map((domValue) => {
      return plainToClass(
        ProgrammeHistoryDto,
        JSON.parse(JSON.stringify(domValue))
      );
    });
  }

  public async updateCertifier(
    programmeId: string,
    certifierId: number,
    add: boolean,
    user: string
  ) {
    const getQueries = {};
    getQueries[this.ledger.tableName] = {
      programmeId: programmeId,
    };

    let updatedProgramme;
    const resp = await this.ledger.getAndUpdateTx(
      getQueries,
      (results: Record<string, dom.Value[]>) => {
        const programmes: Programme[] = results[this.ledger.tableName].map(
          (domValue) => {
            return plainToClass(
              Programme,
              JSON.parse(JSON.stringify(domValue))
            );
          }
        );
        if (programmes.length <= 0) {
          throw new HttpException(
            "Programme does not exist",
            HttpStatus.BAD_REQUEST
          );
        }

        let programme = programmes[0];
        const index = programme.certifierId
          ? programme.certifierId.indexOf(certifierId)
          : -1;
        if (add) {
          if (index >= 0) {
            throw new HttpException(
              "Certifier already certified the programme",
              HttpStatus.BAD_REQUEST
            );
          }

          if (programme.currentStage != ProgrammeStage.AUTHORISED) {
            throw new HttpException(
              "Can certify only issued programmes",
              HttpStatus.BAD_REQUEST
            );
          }

          if (!programme.certifierId) {
            programme.certifierId = [certifierId];
          } else {
            programme.certifierId.push(certifierId);
          }

          const reIndex = programme.revokedCertifierId
            ? programme.revokedCertifierId.indexOf(certifierId)
            : -1;
          if (reIndex >= 0) {
            programme.revokedCertifierId.splice(reIndex, 1);
          }
        } else {
          if (index < 0) {
            throw new HttpException(
              "Certifier does not certified the programme",
              HttpStatus.BAD_REQUEST
            );
          }
          programme.certifierId.splice(index, 1);

          if (!programme.revokedCertifierId) {
            programme.revokedCertifierId = [certifierId];
          } else {
            const reIndex = programme.revokedCertifierId.indexOf(certifierId);
            if (reIndex < 0) {
              programme.revokedCertifierId.push(certifierId);
            }
          }
        }

        programme.txRef = user;
        programme.txTime = new Date().getTime();
        programme.txType = add ? TxType.CERTIFY : TxType.REVOKE;

        let updateMap = {};
        let updateWhere = {};
        updateMap[this.ledger.tableName] = {
          certifierId: programme.certifierId,
          txType: programme.txType,
          txTime: programme.txTime,
          txRef: programme.txRef,
        };

        if (programme.revokedCertifierId) {
          updateMap[this.ledger.tableName]["revokedCertifierId"] =
            programme.revokedCertifierId;
        }

        updateWhere[this.ledger.tableName] = {
          programmeId: programme.programmeId,
        };

        updatedProgramme = programme;
        return [updateMap, updateWhere, {}];
      }
    );

    const affected = resp[this.ledger.tableName];
    if (affected && affected.length > 0) {
      return updatedProgramme;
    }
    throw new HttpException(
      "Programme failed to update",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  public async revokeCompanyCertifications(
    companyId: number,
    user: string,
    sendRevokeEmail: Function
  ): Promise<number[]> {
    this.logger.log(
      `Freezing programme credits companyId:${companyId} user:${user}`
    );
    const getQueries = {};
    companyId = Number(companyId);
    getQueries[this.ledger.tableName] = {
      certifierId: new ArrayIn("certifierId", companyId),
    };

    let programmesId = [];
    const resp = await this.ledger.getAndUpdateTx(
      getQueries,
      (results: Record<string, dom.Value[]>) => {
        const programmes: Programme[] = results[this.ledger.tableName].map(
          (domValue) => {
            return plainToClass(
              Programme,
              JSON.parse(JSON.stringify(domValue))
            );
          }
        );

        let updateMap = {};
        let updateWhere = {};

        for (const programme of programmes) {
          const index = programme.certifierId.indexOf(companyId);
          if (index < 0) {
            continue;
          }

          const prvTxTime = programme.txTime;
          programme.txTime = new Date().getTime();
          programme.txRef = `${user}`;
          programme.txType = TxType.REVOKE;
          programme.certifierId.splice(index, 1);

          updateMap[this.ledger.tableName + "#" + programme.programmeId] = {
            txType: programme.txType,
            txTime: programme.txTime,
            txRef: programme.txRef,
            certifierId: programme.certifierId,
          };
          updateWhere[this.ledger.tableName + "#" + programme.programmeId] = {
            programmeId: programme.programmeId,
            txTime: prvTxTime,
          };

          programmesId.push(programme.programmeId);

          sendRevokeEmail(programme);
        }
        // updatedProgramme = programme;
        return [updateMap, updateWhere, {}];
      }
    );

    return programmesId;
  }

  public async freezeCompany(
    companyId: number,
    user: any
  ): Promise<number[]> {
    this.logger.log(
      `Freezing programme credits companyId:${companyId} user:${user}`
    );
    const getQueries = {};
    companyId = Number(companyId);
    getQueries[this.ledger.tableName] = {
      companyId: new ArrayIn("companyId", companyId),
    };

    let programmesId = [];
    const resp = await this.ledger.getAndUpdateTx(
      getQueries,
      (results: Record<string, dom.Value[]>) => {
        const programmes: Programme[] = results[this.ledger.tableName].map(
          (domValue) => {
            return plainToClass(
              Programme,
              JSON.parse(JSON.stringify(domValue))
            );
          }
        );

        let updateMap = {};
        let updateWhere = {};

        for (const programme of programmes) {
          const index = programme.companyId.indexOf(companyId);
          if (index < 0) {
            throw new HttpException(
              "Programme does not own by the company",
              HttpStatus.BAD_REQUEST
            );
          }

          if (programme.companyId.length > 1) {
            if (!programme.creditOwnerPercentage) {
              throw new HttpException(
                "Not ownership percentage for the company",
                HttpStatus.BAD_REQUEST
              );
            }
          } else {
            programme.creditOwnerPercentage = [100];
          }

          const freezeCredit =
            (programme.creditBalance * programme.creditOwnerPercentage[index]) /
            100;
          if (!programme.creditFrozen) {
            programme.creditFrozen = new Array(
              programme.creditOwnerPercentage.length
            ).fill(0);
          }

          const prvTxTime = programme.txTime;
          (programme.txTime = new Date().getTime()),
            (programme.txRef = user),
            (programme.txType = TxType.FREEZE);
          programme.creditFrozen[index] = freezeCredit;

          updateMap[this.ledger.tableName + "#" + programme.programmeId] = {
            currentStage: programme.currentStage,
            txType: programme.txType,
            txTime: programme.txTime,
            txRef: programme.txRef,
            creditFrozen: programme.creditFrozen,
          };
          updateWhere[this.ledger.tableName + "#" + programme.programmeId] = {
            programmeId: programme.programmeId,
            txTime: prvTxTime,
          };

          programmesId.push(programme.programmeId);
        }
        // updatedProgramme = programme;
        return [updateMap, updateWhere, {}];
      }
    );

    return programmesId;
  }

  public async freezeProgramme(
    programmeId: string,
    companyId: number,
    reason: string,
    user: string
  ): Promise<boolean> {
    this.logger.log(
      `Freezing programme credits:${programmeId} reason:${reason} companyId:${companyId} user:${user}`
    );
    const getQueries = {};
    getQueries[this.ledger.tableName] = {
      companyId: new ArrayIn("companyId", companyId),
    };

    let updatedProgramme;
    const resp = await this.ledger.getAndUpdateTx(
      getQueries,
      (results: Record<string, dom.Value[]>) => {
        const programmes: Programme[] = results[this.ledger.tableName].map(
          (domValue) => {
            return plainToClass(
              Programme,
              JSON.parse(JSON.stringify(domValue))
            );
          }
        );

        let updateMap = {};
        let updateWhere = {};

        for (const programme of programmes) {
          const index = programme.companyId.indexOf(companyId);
          if (index < 0) {
            throw new HttpException(
              "Programme does not own by the company",
              HttpStatus.BAD_REQUEST
            );
          }

          if (programme.companyId.length > 1) {
            if (!programme.creditOwnerPercentage) {
              throw new HttpException(
                "Not ownership percentage for the company",
                HttpStatus.BAD_REQUEST
              );
            }
          } else {
            programme.creditOwnerPercentage = [100];
          }

          const freezeCredit =
            (programme.creditBalance * programme.creditOwnerPercentage[index]) /
            100;
          if (!programme.creditFrozen) {
            programme.creditFrozen = new Array(
              programme.creditOwnerPercentage.length
            ).fill(0);
          }

          const prvTxTime = programme.txTime;
          (programme.txTime = new Date().getTime()),
            (programme.txRef = `${user}#${reason}`),
            (programme.txType = TxType.FREEZE);
          programme.creditFrozen[index] = freezeCredit;

          updateMap[this.ledger.tableName + "#" + programme.programmeId] = {
            currentStage: programme.currentStage,
            txType: programme.txType,
            txTime: programme.txTime,
            txRef: programme.txRef,
            creditFrozen: programme.creditFrozen,
          };
          updateWhere[this.ledger.tableName + "#" + programme.programmeId] = {
            programmeId: programme.programmeId,
            txTime: prvTxTime,
          };
        }
        // updatedProgramme = programme;
        return [updateMap, updateWhere, {}];
      }
    );

    const affected = resp[this.ledger.tableName];
    if (affected && affected.length > 0) {
      return updatedProgramme;
    }
    throw new HttpException(
      "Programme failed to update",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  // public async retireProgramme(
  //   programmeId: string,
  //   reason: string,
  //   user: string
  // ): Promise<boolean> {
  //   this.logger.log(`Retiring programme:${programmeId} reason:${reason} user:${user}`);
  //   const getQueries = {};
  //   getQueries[this.ledger.tableName] = {
  //     programmeId: programmeId,
  //   };

  //   let updatedProgramme;
  //   const resp = await this.ledger.getAndUpdateTx(
  //     getQueries,
  //     (results: Record<string, dom.Value[]>) => {
  //       const programmes: Programme[] = results[this.ledger.tableName].map(
  //         (domValue) => {
  //           return plainToClass(
  //             Programme,
  //             JSON.parse(JSON.stringify(domValue))
  //           );
  //         }
  //       );
  //       if (programmes.length <= 0) {
  //         throw new HttpException(
  //           "Programme does not exist",
  //           HttpStatus.BAD_REQUEST
  //         );
  //       }

  //       let programme = programmes[0];
  //       const prvTxTime = programme.txTime;
  //       programme.currentStage = ProgrammeStage.RETIRED,
  //       programme.txTime = new Date().getTime(),
  //       programme.txRef = `${user}#${reason}`,
  //       programme.txType = TxType.RETIRE
  //       programme.creditRetired = programme.creditBalance;
  //       programme.creditBalance = 0;
  //       programme.creditChange = programme.creditRetired;

  //       let updateMap = {};
  //       let updateWhere = {};
  //       updateMap[this.ledger.tableName] = {
  //         currentStage: programme.currentStage,
  //         txType: programme.txType,
  //         txTime: programme.txTime,
  //         txRef: programme.txRef,
  //         creditRetired: programme.creditRetired,
  //         creditBalance: programme.creditBalance,
  //         creditChange: programme.creditChange
  //       };
  //       updateWhere[this.ledger.tableName] = {
  //         programmeId: programme.programmeId,
  //         txTime: prvTxTime
  //       };

  //       updatedProgramme = programme;
  //       return [updateMap, updateWhere, {}];
  //     }
  //   );

  //   const affected = resp[this.ledger.tableName];
  //   if (affected && affected.length > 0) {
  //     return updatedProgramme;
  //   }
  //   throw new HttpException(
  //     "Programme failed to update",
  //     HttpStatus.INTERNAL_SERVER_ERROR
  //   );
  // }

  public async updateProgrammeStatus(
    programmeId: string,
    status: ProgrammeStage,
    currentExpectedStatus: ProgrammeStage,
    user: string
  ): Promise<boolean> {
    this.logger.log(`Updating programme ${programmeId} status ${status}`);
    const affected = await this.ledger.updateRecords(
      {
        currentStage: status.valueOf(),
        txTime: new Date().getTime(),
        txRef: user,
        txType: status == ProgrammeStage.REJECTED ? TxType.REJECT : null,
      },
      {
        programmeId: programmeId,
        currentStage: currentExpectedStatus.valueOf(),
      }
    );
    if (affected && affected.length > 0) {
      return true;
    }
    return false;
  }

  private round2Precision(val) {
    return parseFloat(val.toFixed(PRECISION));
  }
  public async authProgrammeStatus(
    programmeId: string,
    countryCodeA2: string,
    companyIds: number[],
    issueCredit: number,
    user: string
  ): Promise<Programme> {
    this.logger.log(`Authorizing programme ${programmeId}`);

    const getQueries = {};
    getQueries[this.ledger.tableName] = {
      programmeId: programmeId,
    };
    getQueries[this.ledger.overallTableName] = {
      txId: countryCodeA2,
    };

    getQueries[this.ledger.companyTableName] = {
      txId: companyIds.map((e) => String(e)),
    };

    let updatedProgramme = undefined;
    const resp = await this.ledger.getAndUpdateTx(
      getQueries,
      (results: Record<string, dom.Value[]>) => {
        const programmes: Programme[] = results[this.ledger.tableName].map(
          (domValue) => {
            return plainToClass(
              Programme,
              JSON.parse(JSON.stringify(domValue))
            );
          }
        );
        if (programmes.length <= 0) {
          throw new HttpException(
            "Programme does not exist",
            HttpStatus.BAD_REQUEST
          );
        }

        const creditOveralls = results[this.ledger.overallTableName].map(
          (domValue) => {
            return plainToClass(
              CreditOverall,
              JSON.parse(JSON.stringify(domValue))
            );
          }
        );
        if (creditOveralls.length <= 0) {
          throw new HttpException(
            `Overall credit does not found for the country code ${countryCodeA2}`,
            HttpStatus.BAD_REQUEST
          );
        }

        let companyCreditBalances = {};
        const companies = results[this.ledger.companyTableName].map(
          (domValue) => {
            return plainToClass(
              CreditOverall,
              JSON.parse(JSON.stringify(domValue))
            );
          }
        );
        this.logger.verbose(results[this.ledger.companyTableName]);
        for (const company of companies) {
          companyCreditBalances[company.txId] = company.credit;
        }

        const programme = programmes[0];
        const overall = creditOveralls[0];
        const year = new Date(programme.startTime * 1000).getFullYear();
        const startBlock = overall.credit + 1;
        const endBlock = overall.credit + programme.creditEst;
        const serialNo = generateSerialNumber(
          programme.countryCodeA2,
          programme.sectoralScope,
          programme.programmeId,
          year,
          startBlock,
          endBlock,
          programme.creditUnit
        );
        programme.serialNo = serialNo;
        programme.txTime = new Date().getTime();
        programme.currentStage = ProgrammeStage.AUTHORISED;

        if (!issueCredit) {
          programme.creditIssued = 0;
          // programme.creditPending = 0
        } else {
          programme.creditIssued = issueCredit;
          // programme.creditPending = programme.creditEst - issueCredit;
        }
        programme.creditBalance = programme.creditIssued;
        programme.creditChange = programme.creditIssued;
        programme.txRef = user;
        programme.txType = TxType.AUTH;
        updatedProgramme = programme;

        let companyCreditDistribution = {};
        if (programme.creditOwnerPercentage) {
          for (const j in programme.creditOwnerPercentage) {
            companyCreditDistribution[String(programme.companyId[j])] =
              (programme.creditIssued * programme.creditOwnerPercentage[j]) /
              100;
          }
        } else if (programme.companyId.length == 1) {
          companyCreditDistribution[String(programme.companyId[0])] =
            programme.creditIssued;
        } else {
          throw new HttpException(
            "Unexpected programme owner percentages",
            HttpStatus.BAD_REQUEST
          );
        }

        let updateMap = {};
        let updateWhereMap = {};
        let insertMap = {};
        updateMap[this.ledger.tableName] = {
          currentStage: ProgrammeStage.AUTHORISED.valueOf(),
          serialNo: serialNo,
          creditIssued: programme.creditIssued,
          creditBalance: programme.creditBalance,
          creditChange: programme.creditChange,
          txRef: programme.txRef,
          txTime: programme.txTime,
          txType: programme.txType,
        };
        updateWhereMap[this.ledger.tableName] = {
          programmeId: programmeId,
          currentStage: ProgrammeStage.AWAITING_AUTHORIZATION.valueOf(),
        };

        updateMap[this.ledger.overallTableName] = {
          credit: endBlock,
          txRef: serialNo,
          txType: TxType.AUTH,
        };
        updateWhereMap[this.ledger.overallTableName] = {
          txId: countryCodeA2,
        };

        for (const com of programme.companyId) {
          if (companyCreditBalances[String(com)] != undefined) {
            updateMap[this.ledger.companyTableName + "#" + com] = {
              credit: this.round2Precision(
                companyCreditBalances[String(com)] +
                  companyCreditDistribution[String(com)]
              ),
              txRef: serialNo,
              txType: TxType.AUTH,
            };
            updateWhereMap[this.ledger.companyTableName + "#" + com] = {
              txId: String(com),
            };
          } else {
            insertMap[this.ledger.companyTableName + "#" + com] = {
              credit: this.round2Precision(
                companyCreditDistribution[String(com)]
              ),
              txRef: serialNo,
              txType: TxType.AUTH,
              txId: String(com),
            };
          }
        }
        return [updateMap, updateWhereMap, insertMap];
      }
    );

    const affected = resp[this.ledger.tableName];
    if (affected && affected.length > 0) {
      return updatedProgramme;
    }
    return updatedProgramme;
  }

  public async issueProgrammeStatus(
    programmeId: string,
    countryCodeA2: string,
    companyIds: number[],
    issueCredit: number,
    user: string
  ): Promise<Programme> {
    this.logger.log(`Authorizing programme ${programmeId}`);

    const getQueries = {};
    getQueries[this.ledger.tableName] = {
      programmeId: programmeId,
    };

    getQueries[this.ledger.companyTableName] = {
      txId: companyIds.map((e) => String(e)),
    };

    let updatedProgramme = undefined;
    const resp = await this.ledger.getAndUpdateTx(
      getQueries,
      (results: Record<string, dom.Value[]>) => {
        const programmes: Programme[] = results[this.ledger.tableName].map(
          (domValue) => {
            return plainToClass(
              Programme,
              JSON.parse(JSON.stringify(domValue))
            );
          }
        );
        if (programmes.length <= 0) {
          throw new HttpException(
            "Programme does not exist",
            HttpStatus.BAD_REQUEST
          );
        }

        let companyCreditBalances = {};
        const companies = results[this.ledger.companyTableName].map(
          (domValue) => {
            return plainToClass(
              CreditOverall,
              JSON.parse(JSON.stringify(domValue))
            );
          }
        );
        this.logger.verbose(results[this.ledger.companyTableName]);
        for (const company of companies) {
          companyCreditBalances[company.txId] = company.credit;
        }

        const programme = programmes[0];
        programme.txTime = new Date().getTime();

        if (!issueCredit) {
          programme.creditChange = programme.creditEst - programme.creditIssued;
          programme.creditIssued = programme.creditEst;
          // programme.creditPending = 0
        } else {
          programme.creditIssued += issueCredit;
          programme.creditChange = issueCredit;
          // programme.creditPending = programme.creditEst - issueCredit;
        }
        const currentTotalBalance = programme.creditBalance;
        programme.creditBalance += programme.creditChange;
        programme.txRef = user;
        programme.txType = TxType.ISSUE;
        updatedProgramme = programme;

        let companyCreditDistribution = {};
        if (programme.creditOwnerPercentage) {
          const percentages = [];

          for (const i in programme.creditOwnerPercentage) {
            const currentCredit =
              (currentTotalBalance * programme.creditOwnerPercentage[i]) / 100;
            const changeCredit =
              (programme.creditChange * programme.proponentPercentage[i]) / 100;

            companyCreditDistribution[String(programme.companyId[i])] =
              changeCredit;
            percentages.push(
              parseFloat(
                (
                  ((currentCredit + changeCredit) * 100) /
                  programme.creditBalance
                ).toFixed(6)
              )
            );
          }
          programme.creditOwnerPercentage = percentages;
          this.logger.verbose("Updated owner percentages", percentages);
        } else {
          companyCreditDistribution[String(programme.companyId[0])] =
            programme.creditChange;
        }

        let updateMap = {};
        let updateWhereMap = {};
        updateMap[this.ledger.tableName] = {
          creditIssued: programme.creditIssued,
          creditBalance: programme.creditBalance,
          creditChange: programme.creditChange,
          txRef: programme.txRef,
          txTime: programme.txTime,
          txType: programme.txType,
          creditOwnerPercentage: programme.creditOwnerPercentage,
        };
        updateWhereMap[this.ledger.tableName] = {
          programmeId: programmeId,
          currentStage: ProgrammeStage.AUTHORISED.valueOf(),
        };

        for (const com of programme.companyId) {
          console.log(
            "Credit issue",
            com,
            companyCreditBalances[String(com)],
            companyCreditDistribution[String(com)]
          );
          if (companyCreditBalances[String(com)] != undefined) {
            updateMap[this.ledger.companyTableName + "#" + com] = {
              credit: this.round2Precision(
                companyCreditBalances[String(com)] +
                  companyCreditDistribution[String(com)]
              ),
              txRef: programme.serialNo,
              txType: TxType.ISSUE,
            };
            updateWhereMap[this.ledger.companyTableName + "#" + com] = {
              txId: String(com),
            };
          }
        }
        return [updateMap, updateWhereMap, {}];
      }
    );

    const affected = resp[this.ledger.tableName];
    if (affected && affected.length > 0) {
      return updatedProgramme;
    }
    return updatedProgramme;
  }
}
