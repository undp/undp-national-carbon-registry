import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { InjectEntityManager } from "@nestjs/typeorm";
import { PRECISION } from "@undp/carbon-credit-calculator/dist/esm/calculator";
import { plainToClass } from "class-transformer";
import { dom } from "ion-js";
import axios from "axios";
import { generateSerialNumber } from "@undp/serial-number-gen";
import { EntityManager } from "typeorm";
import { ProgrammeHistoryDto } from "../dto/programme.history.dto";
import { CreditOverall } from "../entities/credit.overall.entity";
import { Programme } from "../entities/programme.entity";
import { ProgrammeTransfer } from "../entities/programme.transfer";
import { TxType } from "../enum/txtype.enum";
import { ProgrammeStage } from "../enum/programme-status.enum";
import {
  ArrayIn,
  ArrayLike,
  LedgerDBInterface,
} from "../ledger-db/ledger.db.interface";
import { HelperService } from "../util/helpers.service";
import { Company } from "../entities/company.entity";
import { url } from "inspector";
import { CompanyRole } from "../enum/company.role.enum";
import { MitigationProperties } from "../dto/mitigation.properties";
import { RetireType } from "../enum/retire.type.enum";
import { GovernmentCreditAccounts } from "../enum/government.credit.accounts.enum";
import { ProgrammeSl } from "../entities/programmeSl.entity";
import { CreditRetirementSl } from "../entities/creditRetirementSl.entity";
import { ProjectProposalStage } from "../enum/projectProposalStage.enum";
import { CreditType } from "../enum/creditType.enum";
import { OrganisationCreditAccounts } from "../enum/organisation.credit.accounts.enum";
import { SLCFSerialNumberGeneratorService } from "../util/slcfSerialNumberGenerator.service";
import { VerificationRequestEntity } from "../entities/verification.request.entity";
import { ProjectEntity } from "../entities/projects.entity";

@Injectable()
export class ProgrammeLedgerService {
  constructor(
    private readonly logger: Logger,
    @InjectEntityManager() private entityManger: EntityManager,
    private ledger: LedgerDBInterface,
    private helperService: HelperService,
    private serialNumberGenerator: SLCFSerialNumberGeneratorService
  ) {}

  public async createProgramme(programme: Programme): Promise<Programme> {
    // this.logger.debug("Creating programme", JSON.stringify(programme));
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
            this.helperService.formatReqMessagesString(
              "programme.programmeExistsWithSameExetrnalId",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }

        let insertMap = {};
        insertMap[this.ledger.tableName] = programme;

        return [{}, {}, insertMap];
      }
    );

    return programme;
  }

  public async createProgrammeSl(programme: ProgrammeSl): Promise<ProgrammeSl> {
    const getQueries = {};
    getQueries[this.ledger.programmeSlTable] = {
      programmeId: programme.programmeId,
    };

    const resp = await this.ledger.getAndUpdateTx(
      getQueries,
      (results: Record<string, dom.Value[]>) => {
        const programmes: ProgrammeSl[] = results[
          this.ledger.programmeSlTable
        ].map((domValue) => {
          return plainToClass(
            ProgrammeSl,
            JSON.parse(JSON.stringify(domValue))
          );
        });
        if (programmes.length > 0) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "programmeSl.programmeExistsWithSameProgrammeId",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }

        let insertMap = {};
        insertMap[this.ledger.programmeSlTable + "#"] = programme;

        return [{}, {}, insertMap];
      }
    );

    return programme;
  }

  public async createProject(project: ProjectEntity): Promise<ProjectEntity> {
    const getQueries = {};
    getQueries[this.ledger.projectTable] = {
      refId: project.refId,
    };

    const resp = await this.ledger.getAndUpdateTx(
      getQueries,
      (results: Record<string, dom.Value[]>) => {
        const projects: ProjectEntity[] = results[this.ledger.projectTable].map(
          (domValue) => {
            return plainToClass(
              ProjectEntity,
              JSON.parse(JSON.stringify(domValue))
            );
          }
        );
        if (projects.length > 0) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "project.projectExistsWithSameRefId",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }

        let insertMap = {};
        insertMap[this.ledger.projectTable + "#"] = project;

        return [{}, {}, insertMap];
      }
    );

    return project;
  }

  //MARK: updateProgrammeSlProposalStage
  public async updateProgrammeSlProposalStage(
    programmeId: string,
    txType: TxType,
    data?: any
  ): Promise<ProgrammeSl> {
    const getQueries = {};
    getQueries[this.ledger.programmeSlTable] = {
      programmeId: programmeId,
    };

    let updatedProgramme = undefined;
    const resp = await this.ledger.getAndUpdateTx(
      getQueries,
      (results: Record<string, dom.Value[]>) => {
        const programmes: ProgrammeSl[] = results[
          this.ledger.programmeSlTable
        ].map((domValue) => {
          return plainToClass(
            ProgrammeSl,
            JSON.parse(JSON.stringify(domValue))
          );
        });
        if (programmes.length <= 0) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "programmeSl.programmeNotExist",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }
        const programme = programmes[0];
        const prvTxTime = programme.txTime;
        programme.txTime = new Date().getTime();
        programme.txType = txType;
        let updateMap = {};
        let updateWhereMap = {};
        let insertMap = {};

        updatedProgramme = programme;
        let uPayload = {
          txTime: programme.txTime,
          txType: programme.txType,
          updatedTime: programme.updatedTime,
          proposalStageUpdatedTime: programme.txTime,
        };

        switch (txType) {
          case TxType.CREATE_CMA:
            uPayload["projectProposalStage"] =
              ProjectProposalStage.SUBMITTED_CMA;
            break;
          case TxType.APPROVE_INF:
            uPayload["projectProposalStage"] =
              ProjectProposalStage.APPROVED_INF;
            break;
          case TxType.REJECT_INF:
            uPayload["projectProposalStage"] =
              ProjectProposalStage.REJECTED_INF;
            break;
          case TxType.CREATE_COST_QUOTATION:
            uPayload["estimatedProjectCost"] = data?.estimatedProjectCost;
            uPayload["projectProposalStage"] =
              ProjectProposalStage.SUBMITTED_COST_QUOTATION;
            break;
          case TxType.CREATE_PROJECT_PROPOSAL:
            uPayload["projectProposalStage"] =
              ProjectProposalStage.SUBMITTED_PROPOSAL;
            break;
          case TxType.CREATE_VALIDATION_AGREEMENT:
            uPayload["projectProposalStage"] =
              ProjectProposalStage.SUBMITTED_VALIDATION_AGREEMENT;
            break;
          case TxType.APPROVE_PROPOSAL:
            uPayload["projectProposalStage"] =
              ProjectProposalStage.ACCEPTED_PROPOSAL;
            break;
          case TxType.REJECT_PROPOSAL:
            uPayload["projectProposalStage"] =
              ProjectProposalStage.REJECTED_PROPOSAL;
            break;
          case TxType.APPROVE_CMA:
            uPayload["projectProposalStage"] =
              ProjectProposalStage.APPROVED_CMA;
            break;
          case TxType.REJECT_CMA:
            uPayload["projectProposalStage"] =
              ProjectProposalStage.REJECTED_CMA;
            break;
          case TxType.CREATE_VALIDATION_REPORT:
            uPayload["projectProposalStage"] =
              ProjectProposalStage.VALIDATION_PENDING;
            break;
          case TxType.APPROVE_VALIDATION:
            uPayload["serialNo"] = data?.serialNo;
            uPayload["registrationCertificateUrl"] =
              data?.registrationCertificateUrl;
            uPayload["creditEst"] = data?.creditEst;
            uPayload["creditUpdatedTime"] = programme.txTime;
            uPayload["authorisedCreditUpdatedTime"] = programme.txTime;
            uPayload["projectProposalStage"] = ProjectProposalStage.AUTHORISED;
            break;
          case TxType.REJECT_VALIDATION:
            uPayload["projectProposalStage"] =
              ProjectProposalStage.REJECTED_VALIDATION;
            break;
          default:
            break;
        }

        updateMap[this.ledger.programmeSlTable + "#"] = uPayload;
        updateWhereMap[this.ledger.programmeSlTable + "#"] = {
          programmeId: programme.programmeId,
          txTime: prvTxTime,
        };

        return [updateMap, updateWhereMap, insertMap];
      }
    );

    return updatedProgramme;
  }

  public async updateProjectProposalStage(
    refId: string,
    txType: TxType,
    txRef?: string,
    data?: any
  ): Promise<ProjectEntity> {
    const getQueries = {};
    getQueries[this.ledger.projectTable] = {
      refId: refId,
    };

    let updatedProject = undefined;
    const resp = await this.ledger.getAndUpdateTx(
      getQueries,
      (results: Record<string, dom.Value[]>) => {
        const projects: ProjectEntity[] = results[this.ledger.projectTable].map(
          (domValue) => {
            return plainToClass(
              ProjectEntity,
              JSON.parse(JSON.stringify(domValue))
            );
          }
        );
        if (projects.length <= 0) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "project.projectNotExist",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }
        const project = projects[0];
        const prvTxTime = project.txTime;
        project.txTime = new Date().getTime();
        project.txType = txType;
        let updateMap = {};
        let updateWhereMap = {};
        let insertMap = {};

        updatedProject = project;
        let uPayload = {
          txTime: project.txTime,
          txType: project.txType,
          txRef: txRef,
          updateTime: project.txTime,
        };
        let expectedCurrentProposalStages = [project.projectProposalStage];

        switch (txType) {
          case TxType.APPROVE_INF:
            uPayload["projectProposalStage"] = ProjectProposalStage.APPROVED;
            uPayload["noObjectionLetterUrl"] = data?.noObjectionLetterUrl;
            expectedCurrentProposalStages = [ProjectProposalStage.PENDING];
            break;
          case TxType.REJECT_INF:
            uPayload["projectProposalStage"] = ProjectProposalStage.REJECTED;
            expectedCurrentProposalStages = [ProjectProposalStage.PENDING];
            break;
          case TxType.CREATE_PDD:
            uPayload["projectProposalStage"] =
              ProjectProposalStage.PDD_SUBMITTED;
            expectedCurrentProposalStages = [
              ProjectProposalStage.APPROVED,
              ProjectProposalStage.PDD_REJECTED_BY_CERTIFIER,
              ProjectProposalStage.PDD_REJECTED_BY_DNA,
            ];
            break;
          case TxType.APPROVE_PDD_BY_IC:
            uPayload["projectProposalStage"] =
              ProjectProposalStage.PDD_APPROVED_BY_CERTIFIER;
            expectedCurrentProposalStages = [
              ProjectProposalStage.PDD_SUBMITTED,
            ];
            break;
          case TxType.REJECT_PDD_BY_IC:
            uPayload["projectProposalStage"] =
              ProjectProposalStage.PDD_REJECTED_BY_CERTIFIER;
            expectedCurrentProposalStages = [
              ProjectProposalStage.PDD_SUBMITTED,
            ];
            break;
          case TxType.APPROVE_PDD_BY_DNA:
            uPayload["projectProposalStage"] =
              ProjectProposalStage.PDD_APPROVED_BY_DNA;
            expectedCurrentProposalStages = [
              ProjectProposalStage.PDD_APPROVED_BY_CERTIFIER,
            ];
            break;
          case TxType.REJECT_PDD_BY_DNA:
            uPayload["projectProposalStage"] =
              ProjectProposalStage.PDD_REJECTED_BY_DNA;
            expectedCurrentProposalStages = [
              ProjectProposalStage.PDD_APPROVED_BY_CERTIFIER,
            ];
            break;
          default:
            break;
        }

        if (
          !expectedCurrentProposalStages.includes(project.projectProposalStage)
        ) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "project.programmeIsNotInSuitableStageToProceed",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }

        updateMap[this.ledger.projectTable + "#"] = uPayload;
        updateWhereMap[this.ledger.projectTable + "#"] = {
          refId: project.refId,
          txTime: prvTxTime,
        };

        return [updateMap, updateWhereMap, insertMap];
      }
    );

    return updatedProject;
  }
  //MARK: Issue SLCF Credits
  public async issueSlCredits(
    verificationRequest: VerificationRequestEntity,
    creditType: CreditType,
    companyId: number,
    txRef: string
  ) {
    this.logger.log(
      `Issue SLCF Credits ${JSON.stringify(verificationRequest)}`
    );
    const companyAccount = companyId + "#" + creditType;

    const getQueries = {};
    getQueries[`history(${this.ledger.programmeSlTable})`] = {
      "data.programmeId": verificationRequest.programmeId,
      "data.txRef": new ArrayLike(
        "data.txRef",
        "%#" + verificationRequest.id + "#%"
      ),
    };
    getQueries[this.ledger.programmeSlTable] = {
      programmeId: verificationRequest.programmeId,
    };
    getQueries[this.ledger.companyTableName] = {
      txId: [companyAccount],
    };

    let updatedProgramme = undefined;
    const resp = await this.ledger.getAndUpdateTx(
      getQueries,
      (results: Record<string, dom.Value[]>) => {
        const alreadyProcessed =
          results[`history(${this.ledger.programmeSlTable})`];
        if (alreadyProcessed.length > 0) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "programme.issueRequestALreadyProcessed",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }

        const programmes: ProgrammeSl[] = results[
          this.ledger.programmeSlTable
        ].map((domValue) => {
          return plainToClass(
            ProgrammeSl,
            JSON.parse(JSON.stringify(domValue))
          );
        });
        if (programmes.length <= 0) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "programme.programmeNotExistWIthId",
              [verificationRequest.programmeId]
            ),
            HttpStatus.BAD_REQUEST
          );
        }

        const programme = programmes[0];
        const prvTxTime = programme.txTime;

        programme.creditBalance = programme.creditBalance
          ? Number(programme.creditBalance) +
            Number(verificationRequest.creditAmount)
          : Number(verificationRequest.creditAmount);

        programme.creditIssued = programme.creditIssued
          ? Number(programme.creditIssued) +
            Number(verificationRequest.creditAmount)
          : Number(verificationRequest.creditAmount);

        programme.creditChange = Number(verificationRequest.creditAmount);
        programme.txType = TxType.ISSUE_SL;
        programme.txRef = txRef;
        programme.txTime = new Date().getTime();
        programme.creditUpdatedTime = programme.txTime;
        programme.issuedCreditUpdatedTime = programme.txTime;

        updatedProgramme = programme;
        const uPayload = {
          txTime: programme.txTime,
          txRef: programme.txRef,
          txType: programme.txType,
          creditChange: programme.creditChange,
          creditBalance: programme.creditBalance,
          companyId: programme.companyId,
          creditIssued: programme.creditIssued,
          creditUpdatedTime: programme.creditUpdatedTime,
          issuedCreditUpdatedTime: programme.issuedCreditUpdatedTime,
        };

        if (
          !programme.creditStartSerialNumber ||
          programme.creditStartSerialNumber == null ||
          programme.creditStartSerialNumber == ""
        ) {
          programme.creditStartSerialNumber = `SLCCS/REG/${programme.programmeId}/1`;
          uPayload["creditStartSerialNumber"] =
            programme.creditStartSerialNumber;
        }

        let updateMap = {};
        let updateWhereMap = {};
        let insertMap = {};
        updateMap[this.ledger.programmeSlTable] = uPayload;
        updateWhereMap[this.ledger.programmeSlTable] = {
          programmeId: programme.programmeId,
          projectProposalStage: ProjectProposalStage.AUTHORISED.valueOf(),
          txTime: prvTxTime,
        };

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

        // Increase Company credits
        if (companyCreditBalances[companyAccount] != undefined) {
          updateMap[this.ledger.companyTableName + "#" + companyAccount] = {
            credit: this.helperService.halfUpToPrecision(
              companyCreditBalances[companyAccount] +
                Number(verificationRequest.creditAmount)
            ),
            txRef: verificationRequest.id + "#" + programme.serialNo,
            txType: TxType.ISSUE_SL,
          };
          updateWhereMap[this.ledger.companyTableName + "#" + companyAccount] =
            {
              txId: companyAccount,
            };
        } else {
          insertMap[this.ledger.companyTableName + "#" + companyAccount] = {
            credit: this.helperService.halfUpToPrecision(
              verificationRequest.creditAmount
            ),
            txRef: verificationRequest.id + "#" + programme.serialNo,
            txType: TxType.ISSUE_SL,
            txId: companyAccount,
          };
        }

        return [updateMap, updateWhereMap, insertMap];
      }
    );

    const affected = resp[this.ledger.programmeSlTable];
    if (affected && affected.length > 0) {
      return updatedProgramme;
    }
    return updatedProgramme;
  }

  //MARK: approve SLCF Credit Transfer
  public async approveCreditTransfer(
    retirementRequest: CreditRetirementSl,
    slcfCompanyId: number,
    txRef: string
  ) {
    this.logger.log(
      `Approve Credit Transfer ${JSON.stringify(retirementRequest)}`
    );

    const txType =
      retirementRequest.creditType === CreditType.TRACK_1
        ? TxType.TRANSFER_SL
        : TxType.RETIRE_SL;
    const slcfRetiredAccount =
      slcfCompanyId + "#" + GovernmentCreditAccounts.LOCAL;
    const toCompanyId =
      retirementRequest.creditType === CreditType.TRACK_1
        ? retirementRequest.toCompanyId
        : retirementRequest.fromCompanyId;
    const fromCompanyAccount =
      retirementRequest.fromCompanyId + "#" + retirementRequest.creditType;
    const toCompanyAccount =
      toCompanyId + "#" + OrganisationCreditAccounts.LOCAL;

    const getQueries = {};
    getQueries[`history(${this.ledger.programmeSlTable})`] = {
      "data.programmeId": retirementRequest.programmeId,
      "data.txRef": new ArrayLike(
        "data.txRef",
        "%#%" + retirementRequest.requestId + "#%"
      ),
    };
    getQueries[this.ledger.programmeSlTable] = {
      programmeId: retirementRequest.programmeId,
    };
    getQueries[this.ledger.companyTableName] = {
      txId: [fromCompanyAccount, toCompanyAccount, slcfRetiredAccount],
    };

    let updatedProgramme = undefined;
    const resp = await this.ledger.getAndUpdateTx(
      getQueries,
      (results: Record<string, dom.Value[]>) => {
        const alreadyProcessed =
          results[`history(${this.ledger.programmeSlTable})`];
        if (alreadyProcessed.length > 0) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "programme.transferRequestALreadyProcessed",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }

        const programmes: ProgrammeSl[] = results[
          this.ledger.programmeSlTable
        ].map((domValue) => {
          return plainToClass(
            ProgrammeSl,
            JSON.parse(JSON.stringify(domValue))
          );
        });
        if (programmes.length <= 0) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "programme.programmeNotExistWIthId",
              [retirementRequest.programmeId]
            ),
            HttpStatus.BAD_REQUEST
          );
        }

        const programme = programmes[0];
        const prvTxTime = programme.txTime;

        programme.creditBalance =
          Number(programme.creditBalance) -
          Number(retirementRequest.creditAmount);

        programme.creditChange = Number(retirementRequest.creditAmount);
        programme.txType = txType;
        programme.txRef = txRef;
        programme.txTime = new Date().getTime();
        programme.creditUpdatedTime = programme.txTime;

        if (retirementRequest.creditType === CreditType.TRACK_1) {
          programme.transferredCreditUpdatedTime = programme.txTime;
        } else {
          programme.retiredCreditUpdatedTime = programme.txTime;
        }

        programme.creditStartSerialNumber =
          this.serialNumberGenerator.calculateCreditSerialNumber(
            programme.creditStartSerialNumber,
            retirementRequest.creditAmount
          );

        updatedProgramme = programme;
        const uPayload = {
          txTime: programme.txTime,
          txRef: programme.txRef,
          txType: programme.txType,
          creditChange: programme.creditChange,
          creditBalance: programme.creditBalance,
          companyId: programme.companyId,
          creditStartSerialNumber: programme.creditStartSerialNumber,
          creditUpdatedTime: programme.creditUpdatedTime,
          transferredCreditUpdatedTime: programme.transferredCreditUpdatedTime,
          retiredCreditUpdatedTime: programme.retiredCreditUpdatedTime,
        };

        if (retirementRequest.creditType === CreditType.TRACK_1) {
          programme.creditTransferred = programme.creditTransferred
            ? programme.creditTransferred + retirementRequest.creditAmount
            : retirementRequest.creditAmount;
          uPayload["creditTransferred"] = programme.creditTransferred;
        } else {
          programme.creditRetired = programme.creditRetired
            ? programme.creditRetired + retirementRequest.creditAmount
            : retirementRequest.creditAmount;
          uPayload["creditRetired"] = programme.creditRetired;
        }

        let updateMap = {};
        let updateWhereMap = {};
        let insertMap = {};
        updateMap[this.ledger.programmeSlTable] = uPayload;
        updateWhereMap[this.ledger.programmeSlTable] = {
          programmeId: programme.programmeId,
          projectProposalStage: ProjectProposalStage.AUTHORISED.valueOf(),
          txTime: prvTxTime,
        };

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

        // Transfer from fromCompany
        if (companyCreditBalances[fromCompanyAccount] != undefined) {
          updateMap[this.ledger.companyTableName + "#" + fromCompanyAccount] = {
            credit: this.helperService.halfUpToPrecision(
              companyCreditBalances[fromCompanyAccount] -
                retirementRequest.creditAmount
            ),
            txRef: retirementRequest.requestId + "#" + programme.serialNo,
            txType: txType,
          };
          updateWhereMap[
            this.ledger.companyTableName + "#" + fromCompanyAccount
          ] = {
            txId: fromCompanyAccount,
          };
        } else {
          throw new HttpException(
            this.helperService.formatReqMessagesString("company.noCredits", [
              retirementRequest.programmeId,
            ]),
            HttpStatus.BAD_REQUEST
          );
        }

        // Transfer to toCompany secondary account
        if (companyCreditBalances[toCompanyAccount] != undefined) {
          updateMap[this.ledger.companyTableName + "#" + toCompanyAccount] = {
            credit: this.helperService.halfUpToPrecision(
              companyCreditBalances[toCompanyAccount] +
                retirementRequest.creditAmount
            ),
            txRef: retirementRequest.requestId + "#" + programme.serialNo,
            txType: txType,
          };
          updateWhereMap[
            this.ledger.companyTableName + "#" + toCompanyAccount
          ] = {
            txId: toCompanyAccount,
          };
        } else {
          insertMap[this.ledger.companyTableName + "#" + toCompanyAccount] = {
            credit: this.helperService.halfUpToPrecision(
              retirementRequest.creditAmount
            ),
            txRef: retirementRequest.requestId + "#" + programme.serialNo,
            txType: txType,
            txId: toCompanyAccount,
          };
        }

        // Increase SLCF Retirement credits
        if (companyCreditBalances[slcfRetiredAccount] != undefined) {
          updateMap[this.ledger.companyTableName + "#" + slcfRetiredAccount] = {
            credit: this.helperService.halfUpToPrecision(
              companyCreditBalances[slcfRetiredAccount] +
                retirementRequest.creditAmount
            ),
            txRef: retirementRequest.requestId + "#" + programme.serialNo,
            txType: txType,
          };
          updateWhereMap[
            this.ledger.companyTableName + "#" + slcfRetiredAccount
          ] = {
            txId: slcfRetiredAccount,
          };
        } else {
          insertMap[this.ledger.companyTableName + "#" + slcfRetiredAccount] = {
            credit: this.helperService.halfUpToPrecision(
              retirementRequest.creditAmount
            ),
            txRef: retirementRequest.requestId + "#" + programme.serialNo,
            txType: txType,
            txId: slcfRetiredAccount,
          };
        }

        return [updateMap, updateWhereMap, insertMap];
      }
    );

    const affected = resp[this.ledger.programmeSlTable];
    if (affected && affected.length > 0) {
      return updatedProgramme;
    }
    return updatedProgramme;
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
    const omgeAccount =
      transfer.retirementType === RetireType.CROSS_BORDER
        ? transfer.toCompanyId + "#" + GovernmentCreditAccounts.OMGE
        : undefined;
    const fromAccount = String(transfer.fromCompanyId);
    getQueries[this.ledger.companyTableName] = {
      txId:
        transfer.retirementType === RetireType.CROSS_BORDER
          ? [fromAccount, toAccountID, omgeAccount]
          : [fromAccount, toAccountID],
    };
    let updatedProgramme = undefined;
    const resp = await this.ledger.getAndUpdateTx(
      getQueries,
      (results: Record<string, dom.Value[]>) => {
        const alreadyProcessed = results[`history(${this.ledger.tableName})`];
        if (alreadyProcessed.length > 0) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "programme.transferRequestALreadyProcessed",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }
        if (
          transfer.retirementType === RetireType.CROSS_BORDER &&
          !transfer.omgePercentage
        ) {
          transfer.omgePercentage = 0;
        }
        const programmes: Programme[] = results[this.ledger.tableName].map(
          (domValue) => {
            let programme = plainToClass(
              Programme,
              JSON.parse(JSON.stringify(domValue))
            );
            const intCompanyIds = programme.companyId.map((id) => {
              return Number(id);
            });
            programme.companyId = intCompanyIds;
            return programme;
          }
        );

        if (programmes.length <= 0) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "programme.programmeNotExistWIthId",
              [transfer.programmeId]
            ),
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
              this.helperService.halfUpToPrecision(
                (programme.creditBalance * programme.creditOwnerPercentage[i]) /
                  100
              );

            frozenCredit[programme.companyId[i]] = programme.creditFrozen
              ? programme.creditFrozen[i]
              : 0;
          }
          if (!currentCredit[transfer.fromCompanyId]) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "programme.companyIsNotTheOwnerOfProg",
                [transfer.fromCompanyId]
              ),
              HttpStatus.BAD_REQUEST
            );
          }
          if (
            this.helperService.halfUpToPrecision(
              currentCredit[transfer.fromCompanyId] -
                frozenCredit[transfer.fromCompanyId]
            ) < transfer.creditAmount
          ) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "programme.companyHaveNoEnoughCredits",
                [transfer.fromCompanyId]
              ),
              HttpStatus.BAD_REQUEST
            );
          }

          for (const i in programme.creditOwnerPercentage) {
            if (programme.companyId[i] == transfer.fromCompanyId) {
              const creditOwnerPercentage =
                programme.creditBalance - transfer.creditAmount != 0
                  ? this.helperService.halfUpToPrecision(
                      ((currentCredit[transfer.fromCompanyId] -
                        transfer.creditAmount) *
                        100) /
                        (programme.creditBalance - transfer.creditAmount),
                      6
                    )
                  : 0;
              percentages.push(
                creditOwnerPercentage > 100 ? 100 : creditOwnerPercentage
              );
            } else {
              const creditOwnerPercentage =
                programme.creditBalance - transfer.creditAmount != 0
                  ? this.helperService.halfUpToPrecision(
                      (currentCredit[programme.companyId[i]] * 100) /
                        (programme.creditBalance - transfer.creditAmount),
                      6
                    )
                  : 0;
              percentages.push(
                creditOwnerPercentage > 100 ? 100 : creditOwnerPercentage
              );
            }
          }
          programme.creditOwnerPercentage = percentages;
          this.logger.verbose("Updated owner percentages", percentages);
        }
        let omgeCredits = 0;
        if (transfer.retirementType === RetireType.CROSS_BORDER) {
          omgeCredits = (transfer.creditAmount * transfer.omgePercentage) / 100;
          companyCreditDistribution[omgeAccount] = omgeCredits;
        }
        companyCreditDistribution[fromAccount] = -transfer.creditAmount;
        companyCreditDistribution[toAccountID] =
          transfer.creditAmount - omgeCredits;

        const prvTxTime = programme.txTime;
        programme.txTime = new Date().getTime();
        programme.txRef = `${name}#${transfer.requestId}#${transfer.retirementType}#${reason}#${transfer.omgePercentage}`;

        const compIndex = programme.companyId.indexOf(transfer.fromCompanyId);
        if (compIndex < 0) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "programme.companyIsNotTheOwnerOfProg",
              [transfer.fromCompanyId]
            ),
            HttpStatus.BAD_REQUEST
          );
        }
        if (isRetirement) {
          programme.txType = TxType.RETIRE;
          if (!programme.creditRetired) {
            programme.creditRetired = new Array(
              programme.creditOwnerPercentage.length
            ).fill(0);
          } else if (
            programme.creditRetired.length !==
              programme.creditOwnerPercentage.length &&
            programme.creditRetired.length <
              programme.creditOwnerPercentage.length
          ) {
            programme.creditRetired.push(
              ...new Array(
                programme.creditOwnerPercentage.length -
                  programme.creditRetired.length
              ).fill(0)
            );
          }
          programme.creditRetired[compIndex] =
            this.helperService.halfUpToPrecision(
              programme.creditRetired[compIndex] + transfer.creditAmount
            );
        } else {
          programme.txType = TxType.TRANSFER;
          if (!programme.creditTransferred) {
            programme.creditTransferred = new Array(
              programme.creditOwnerPercentage.length
            ).fill(0);
          } else if (
            programme.creditTransferred.length !==
              programme.creditOwnerPercentage.length &&
            programme.creditTransferred.length <
              programme.creditOwnerPercentage.length
          ) {
            programme.creditTransferred.push(
              ...new Array(
                programme.creditOwnerPercentage.length -
                  programme.creditTransferred.length
              ).fill(0)
            );
          }
          programme.creditTransferred[compIndex] =
            this.helperService.halfUpToPrecision(
              programme.creditTransferred[compIndex] + transfer.creditAmount
            );
        }
        programme.creditChange = transfer.creditAmount;
        programme.creditBalance = this.helperService.halfUpToPrecision(
          programme.creditBalance - transfer.creditAmount
        );

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

        const involvedCompanies =
          transfer.retirementType === RetireType.CROSS_BORDER
            ? [fromAccount, toAccountID, omgeAccount]
            : [fromAccount, toAccountID];
        for (const com of involvedCompanies) {
          if (companyCreditBalances[com] != undefined) {
            updateMap[this.ledger.companyTableName + "#" + com] = {
              credit: this.helperService.halfUpToPrecision(
                companyCreditBalances[com] + companyCreditDistribution[com]
              ),
              txRef: transfer.requestId + "#" + programme.serialNo,
              txType: isRetirement ? TxType.RETIRE : TxType.TRANSFER,
            };
            updateWhereMap[this.ledger.companyTableName + "#" + com] = {
              txId: com,
            };
          } else {
            insertMap[this.ledger.companyTableName + "#" + com] = {
              credit: this.helperService.halfUpToPrecision(
                companyCreditDistribution[com]
              ),
              txRef: transfer.requestId + "#" + programme.serialNo,
              txType: isRetirement ? TxType.RETIRE : TxType.TRANSFER,
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
      let programme = plainToClass(
        Programme,
        JSON.parse(JSON.stringify(domValue))
      );
      const intCompanyIds = programme.companyId.map((id) => {
        return Number(id);
      });
      programme.companyId = intCompanyIds;
      return programme;
    });
    return p.length <= 0 ? null : p[0];
  }

  public async getProgrammeSlById(programmeId: string): Promise<ProgrammeSl> {
    const p = (
      await this.ledger.fetchRecords(
        {
          programmeId: programmeId,
        },
        this.ledger.programmeSlTable
      )
    ).map((domValue) => {
      let programme = plainToClass(
        ProgrammeSl,
        JSON.parse(JSON.stringify(domValue))
      );
      return programme;
    });
    return p.length <= 0 ? null : p[0];
  }

  public async getProjectById(refId: string): Promise<ProjectEntity> {
    const p = (
      await this.ledger.fetchRecords(
        {
          refId: refId,
        },
        this.ledger.projectTable
      )
    ).map((domValue) => {
      let project = plainToClass(
        ProjectEntity,
        JSON.parse(JSON.stringify(domValue))
      );
      return project;
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

  public async getProgrammeHistoryByExternalId(
    externalId: string
  ): Promise<ProgrammeHistoryDto[]> {
    return (
      await this.ledger.fetchHistory({
        externalId: externalId,
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
    user: string,
    updatePrStatus?: ProgrammeStage
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
            this.helperService.formatReqMessagesString(
              "programme.programmeNotExist",
              []
            ),
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
              this.helperService.formatReqMessagesString(
                "programme.alreadyCertified",
                []
              ),
              HttpStatus.BAD_REQUEST
            );
          }

          if (
            !(
              programme.currentStage == ProgrammeStage.AUTHORISED ||
              programme.currentStage == ProgrammeStage.APPROVED ||
              programme.currentStage == ProgrammeStage.AWAITING_AUTHORIZATION
            )
          ) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "programme.unAuth",
                []
              ),
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
              this.helperService.formatReqMessagesString(
                "programme.notCertifiedByCertifier",
                []
              ),
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
      this.helperService.formatReqMessagesString(
        "programme.failedToUpdate",
        []
      ),
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
        return [updateMap, updateWhere, {}];
      }
    );

    return programmesId;
  }

  public async freezeCompany(
    companyId: number,
    user: any,
    isFreeze: boolean
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
              this.helperService.formatReqMessagesString(
                "programme.doesNotOwnByCompany",
                []
              ),
              HttpStatus.BAD_REQUEST
            );
          }

          if (isFreeze) {
            if (programme.companyId.length > 1) {
              if (!programme.creditOwnerPercentage) {
                throw new HttpException(
                  this.helperService.formatReqMessagesString(
                    "programme.noOwnershipPercForCompany",
                    []
                  ),
                  HttpStatus.BAD_REQUEST
                );
              }
            } else {
              programme.creditOwnerPercentage = [100];
            }

            const freezeCredit = this.helperService.halfUpToPrecision(
              (programme.creditBalance *
                programme.creditOwnerPercentage[index]) /
                100
            );
            if (!programme.creditFrozen) {
              programme.creditFrozen = new Array(
                programme.creditOwnerPercentage.length
              ).fill(0);
            }
            if (freezeCredit === 0) continue;
            programme.creditFrozen[index] = freezeCredit;
            programme.creditChange = freezeCredit;
          } else {
            if (
              programme.creditFrozen === undefined ||
              programme.creditFrozen[index] === null
            )
              continue;
            const unFrozenCredit = this.helperService.halfUpToPrecision(
              programme.creditFrozen[index]
            );
            if (unFrozenCredit === 0) continue;
            programme.creditChange = unFrozenCredit;
            programme.creditFrozen[index] = 0;
          }

          const prvTxTime = programme.txTime;
          (programme.txTime = new Date().getTime()),
            (programme.txRef = user),
            (programme.txType = isFreeze ? TxType.FREEZE : TxType.UNFREEZE);

          updateMap[this.ledger.tableName + "#" + programme.programmeId] = {
            currentStage: programme.currentStage,
            txType: programme.txType,
            txTime: programme.txTime,
            txRef: programme.txRef,
            creditFrozen: programme.creditFrozen,
            creditChange: programme.creditChange,
          };
          updateWhere[this.ledger.tableName + "#" + programme.programmeId] = {
            programmeId: programme.programmeId,
            txTime: prvTxTime,
          };

          programmesId.push(programme.programmeId);
        }
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
              this.helperService.formatReqMessagesString(
                "programme.doesNotOwnByCompany",
                []
              ),
              HttpStatus.BAD_REQUEST
            );
          }

          if (programme.companyId.length > 1) {
            if (!programme.creditOwnerPercentage) {
              throw new HttpException(
                this.helperService.formatReqMessagesString(
                  "programme.noOwnershipPercForCompany",
                  []
                ),
                HttpStatus.BAD_REQUEST
              );
            }
          } else {
            programme.creditOwnerPercentage = [100];
          }

          const freezeCredit = //this.helperService.halfUpToPrecision
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
        return [updateMap, updateWhere, {}];
      }
    );

    const affected = resp[this.ledger.tableName];
    if (affected && affected.length > 0) {
      return updatedProgramme;
    }
    throw new HttpException(
      this.helperService.formatReqMessagesString(
        "programme.failedToUpdate",
        []
      ),
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

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
        txType:
          status == ProgrammeStage.REJECTED
            ? TxType.REJECT
            : status == ProgrammeStage.APPROVED
            ? TxType.APPROVE
            : null,
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
    if (val) return parseFloat(val.toFixed(PRECISION));
    else return 0;
  }

  // MARK: authProgrammeStatus
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
            this.helperService.formatReqMessagesString(
              "programme.programmeNotExist",
              []
            ),
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
            this.helperService.formatReqMessagesString(
              "programme.overallCreditNotFoundforCountryCode",
              [countryCodeA2]
            ),
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
        const startBlock = Math.ceil(overall.credit + 1);
        const endBlock = Math.ceil(overall.credit + programme.creditEst);
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
        } else {
          programme.creditIssued =
            this.helperService.halfUpToPrecision(issueCredit);
        }
        programme.creditBalance = programme.creditIssued;
        programme.creditChange = programme.creditIssued;
        programme.emissionReductionAchieved = programme.creditIssued;
        programme.txRef = user;
        programme.txType = TxType.AUTH;
        updatedProgramme = programme;

        let companyCreditDistribution = {};
        if (programme.creditOwnerPercentage) {
          for (const j in programme.creditOwnerPercentage) {
            companyCreditDistribution[String(programme.companyId[j])] =
              this.helperService.halfUpToPrecision(
                (programme.creditIssued * programme.creditOwnerPercentage[j]) /
                  100
              );
          }
        } else if (programme.companyId.length == 1) {
          companyCreditDistribution[String(programme.companyId[0])] =
            programme.creditIssued;
        } else {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "programme.unExpectedProgOwnerPerc",
              []
            ),
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
          emissionReductionAchieved: programme.emissionReductionAchieved,
          txRef: programme.txRef,
          txTime: programme.txTime,
          txType: programme.txType,
        };
        updateWhereMap[this.ledger.tableName] = {
          programmeId: programmeId,
          currentStage: ProgrammeStage.APPROVED.valueOf(),
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
              credit: this.helperService.halfUpToPrecision(
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
              credit: this.helperService.halfUpToPrecision(
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
    user: string,
    mitigationActions: any
  ): Promise<Programme> {
    this.logger.log(`Issue programme credit ${programmeId}`);

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
            this.helperService.formatReqMessagesString(
              "programme.programmeNotExist",
              []
            ),
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
          programme.creditChange = this.helperService.halfUpToPrecision(
            programme.creditEst - programme.creditIssued
          );
          programme.creditIssued = programme.creditEst;
        } else {
          programme.creditIssued = this.helperService.halfUpToPrecision(
            programme.creditIssued + issueCredit
          );
          programme.creditChange = issueCredit;
        }
        programme.emissionReductionAchieved = programme.creditIssued;
        const currentTotalBalance = programme.creditBalance;
        programme.creditBalance = this.helperService.halfUpToPrecision(
          programme.creditBalance + programme.creditChange
        );
        programme.txRef = user;
        programme.txType = TxType.ISSUE;
        updatedProgramme = programme;

        let companyCreditDistribution = {};
        if (programme.creditOwnerPercentage) {
          const percentages = [];

          for (const i in programme.creditOwnerPercentage) {
            const currentCredit = this.helperService.halfUpToPrecision(
              (currentTotalBalance * programme.creditOwnerPercentage[i]) / 100
            );
            const changeCredit = this.helperService.halfUpToPrecision(
              (programme.creditChange * programme.proponentPercentage[i]) / 100
            );

            companyCreditDistribution[String(programme.companyId[i])] =
              changeCredit;
            percentages.push(
              this.helperService.halfUpToPrecision(
                ((currentCredit + changeCredit) * 100) /
                  programme.creditBalance,
                6
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
          emissionReductionAchieved: programme.emissionReductionAchieved,
          mitigationActions: mitigationActions,
        };
        updateWhereMap[this.ledger.tableName] = {
          programmeId: programmeId,
          currentStage: ProgrammeStage.AUTHORISED.valueOf(),
        };

        for (const com of programme.companyId) {
          if (companyCreditBalances[String(com)] != undefined) {
            updateMap[this.ledger.companyTableName + "#" + com] = {
              credit: this.helperService.halfUpToPrecision(
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

  public async freezeIssuedCredit(
    programmeId: string,
    issueAmount: number,
    txRef: string,
    suspendedCompanies?: Company[]
  ) {
    const getQueries = {};
    getQueries[this.ledger.tableName] = {
      programmeId: programmeId,
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
        let programme: Programme = programmes[0];

        if (!programme.creditFrozen) {
          programme.creditFrozen = new Array(
            programme.creditOwnerPercentage.length
          ).fill(0);
        }

        let updateMap = {};
        let updateWhereMap = {};

        suspendedCompanies.forEach(async (company) => {
          const index = programme.companyId.indexOf(company.companyId);
          const freezeCredit = this.helperService.halfUpToPrecision(
            (issueAmount * programme.proponentPercentage[index]) / 100
          );
          programme.creditFrozen[index] = this.helperService.halfUpToPrecision(
            programme.creditFrozen[index] + freezeCredit
          );
          programme.creditChange = freezeCredit;

          (programme.txTime = new Date().getTime()),
            (programme.txRef = `${txRef}##${company.name}`),
            (programme.txType = TxType.FREEZE);

          updatedProgramme = programme;

          updateMap[this.ledger.tableName + "#" + company.companyId] = {
            creditFrozen: programme.creditFrozen,
            creditChange: programme.creditChange,
            txRef: programme.txRef,
            txTime: programme.txTime,
            txType: programme.txType,
          };
          updateWhereMap[this.ledger.tableName + "#" + company.companyId] = {
            programmeId: programmeId,
          };
        });

        return [updateMap, updateWhereMap, {}];
      }
    );

    return updatedProgramme;
  }

  public async addDocument(
    externalId: string,
    actionId: string,
    documentUrl: string,
    documentTxtime: number,
    documentStatus: string,
    type: string,
    creditEst: number,
    certifierId: number
  ) {
    const getQueries = {};
    getQueries[this.ledger.tableName] = {
      externalId: externalId,
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
            this.helperService.formatReqMessagesString(
              "programme.programmeNotExist",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }
        let programme: Programme = programmes[0];

        let updateMap = {};
        let updateWhereMap = {};
        programme.txTime = new Date().getTime();
        programme.txType = TxType.ADD_DOCUMENT;
        programme.txRef = CompanyRole.API;

        updateMap[this.ledger.tableName] = {
          txRef: programme.txRef,
          txTime: programme.txTime,
          txType: programme.txType,
        };

        if (certifierId) {
          const index = programme.certifierId
            ? programme.certifierId.indexOf(certifierId)
            : -1;

          if (index < 0) {
            if (!programme.certifierId) {
              programme.certifierId = [certifierId];
            } else {
              programme.certifierId.push(certifierId);
            }

            updateMap[this.ledger.tableName]["certifierId"] =
              programme.certifierId;
            const reIndex = programme.revokedCertifierId
              ? programme.revokedCertifierId.indexOf(certifierId)
              : -1;
            if (reIndex >= 0) {
              programme.revokedCertifierId.splice(reIndex, 1);
              updateMap[this.ledger.tableName]["revokedCertifierId"] =
                programme.revokedCertifierId;
            }
          }
        }

        if (actionId) {
          const actionIndex = programme.mitigationActions?.findIndex(
            (e) => e.actionId == actionId
          );

          if (!programme.mitigationActions || actionIndex < 0) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "programme.noMitigationActionFound",
                []
              ),
              HttpStatus.BAD_REQUEST
            );
          }

          if (!programme.mitigationActions[actionIndex].projectMaterial) {
            programme.mitigationActions[actionIndex].projectMaterial = [];
          }

          programme.mitigationActions[actionIndex].projectMaterial.push({
            url: documentUrl,
            timestamp: documentTxtime,
            accept: documentStatus,
          });

          updateMap[this.ledger.tableName]["mitigationActions"] =
            programme.mitigationActions;
        } else {
          if (!programme.programmeProperties.programmeMaterials) {
            programme.programmeProperties.programmeMaterials = [];
          }
          programme.programmeProperties.programmeMaterials.push({
            url: documentUrl,
            timestamp: documentTxtime,
            accept: documentStatus,
          });
          updateMap[this.ledger.tableName]["programmeProperties"] =
            programme.programmeProperties;
        }

        if (creditEst > 0) {
          programme.currentStage = ProgrammeStage.APPROVED;
          programme.creditEst = creditEst;
          updateMap[this.ledger.tableName]["currentStage"] =
            programme.currentStage;
          updateMap[this.ledger.tableName]["creditEst"] = programme.creditEst;
        }

        updatedProgramme = programme;
        updateWhereMap[this.ledger.tableName] = {
          programmeId: programme.programmeId,
        };

        return [updateMap, updateWhereMap, {}];
      }
    );

    return updatedProgramme;
  }

  public async addMitigation(
    externalId: string,
    mitigation: MitigationProperties
  ) {
    const getQueries = {};
    getQueries[this.ledger.tableName] = {
      externalId: externalId,
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
            this.helperService.formatReqMessagesString(
              "programme.programmeNotExist",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }

        let programme: Programme = programmes[0];

        const actionIndex = programme.mitigationActions?.findIndex(
          (e) => e.actionId == mitigation.actionId
        );
        if (programme.mitigationActions && actionIndex >= 0) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "programme.mitigationActionAlreadyExist",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }

        let updateMap = {};
        let updateWhereMap = {};
        programme.txTime = new Date().getTime();
        programme.txType = TxType.ADD_MITIGATION;
        programme.txRef = CompanyRole.API;

        if (!programme.mitigationActions) {
          programme.mitigationActions = [];
        }

        if (mitigation.properties) {
          mitigation.properties = {
            ...mitigation.properties,
            issuedCredits: 0,
            availableCredits: mitigation.userEstimatedCredits,
          };
        } else {
          mitigation.properties = {
            issuedCredits: 0,
            availableCredits: mitigation.userEstimatedCredits,
          };
        }
        programme.mitigationActions.push(mitigation);
        updateMap[this.ledger.tableName] = {
          txRef: programme.txRef,
          txTime: programme.txTime,
          txType: programme.txType,
          mitigationActions: programme.mitigationActions,
        };

        updatedProgramme = programme;
        updateWhereMap[this.ledger.tableName] = {
          programmeId: programme.programmeId,
        };

        return [updateMap, updateWhereMap, {}];
      }
    );

    return updatedProgramme;
  }

  public async addCompanyInvestment(
    requestId: number,
    toComapnyId: number,
    amount: number,
    txRef: string
  ) {
    this.logger.log(`Add national investment ${requestId}`);
    const getQueries = {};
    getQueries[this.ledger.companyTableName] = {
      txId: `${toComapnyId}#investment#${requestId}`,
    };
    const resp = await this.ledger.getAndUpdateTx(
      getQueries,
      (results: Record<string, dom.Value[]>) => {
        const alreadyProcessed = results[this.ledger.companyTableName];
        if (alreadyProcessed.length > 0) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "programme.investmentRequestALreadyProcessed",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }
        let updateMap = {};
        let updateWhereMap = {};
        let insertMap = {};
        insertMap[
          this.ledger.companyTableName +
            "#" +
            `${toComapnyId}#investment#${requestId}`
        ] = {
          amount: this.round2Precision(amount),
          txRef: txRef,
          txType: TxType.ADD_INVESTMENT,
          requestId: requestId,
          txId: `${toComapnyId}#investment#${requestId}`,
        };
        return [updateMap, updateWhereMap, insertMap];
      }
    );
    return resp[this.ledger.companyTableName];
  }

  public async updateOwnership(
    externalId: string,
    companyIds: number[],
    taxIds: string[],
    propPercentages: number[],
    investor: number,
    owner: number,
    shareFromOwner: number,
    user: string,
    amount: number,
    investmentRequestId?: number
  ) {
    const getQueries = {};
    getQueries[this.ledger.tableName] = {
      externalId: externalId,
    };
    if (investmentRequestId) {
      getQueries[this.ledger.companyTableName] = {
        txId: `${investor}#investment#${investmentRequestId}`,
      };
    }

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
            this.helperService.formatReqMessagesString(
              "programme.programmeNotExist",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }
        let investment: any;
        if (investmentRequestId) {
          if (results[this.ledger.companyTableName].length < 1) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "programme.nationalInvestmentNotExist",
                []
              ),
              HttpStatus.BAD_REQUEST
            );
          }
          investment = results[this.ledger.companyTableName][0];
          if (investment.amount < amount) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "programme.nationalInvestmentAmountNotEnough",
                []
              ),
              HttpStatus.BAD_REQUEST
            );
          }
        }

        let programme: Programme = programmes[0];

        let updateMap = {};
        let updateWhereMap = {};

        const creditOwnership = {};
        let ownershipPercentage = {};
        let ownershipPercentageList = [];

        const ownerIndex = programme.companyId
          .map((e) => Number(e))
          .indexOf(owner);
        if (ownerIndex < 0) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "programme.noOwnershipPercForCompany",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }

        let investmentPerc = undefined;

        for (const j in programme.companyId) {
          if (ownershipPercentage[companyIds[j]]) {
            ownershipPercentage[companyIds[j]] =
              this.helperService.halfUpToPrecision(
                ownershipPercentage[companyIds[j]] +
                  programme.creditOwnerPercentage[j],
                6
              );
          } else {
            ownershipPercentage[companyIds[j]] =
              programme.creditOwnerPercentage[j];
          }
        }

        if (!ownershipPercentage[investor]) {
          ownershipPercentage[investor] = 0;
        }

        for (const x in companyIds) {
          ownershipPercentageList.push(ownershipPercentage[companyIds[x]]);
          if (Number(companyIds[x]) === investor) {
            investmentPerc = propPercentages[x];
          }
        }

        programme.txTime = new Date().getTime();
        programme.txType = TxType.OWNERSHIP_UPDATE;
        programme.txRef = `${user}#${investmentPerc}`;
        programme.proponentTaxVatId = taxIds;
        programme.proponentPercentage = propPercentages;
        programme.companyId = companyIds;
        programme.creditOwnerPercentage = ownershipPercentageList;

        if (!programme.creditFrozen) {
          programme.creditFrozen = new Array(
            programme.creditOwnerPercentage.length
          ).fill(0);
        }
        const investorIndex = programme.companyId.indexOf(investor);
        if (!programme.creditFrozen[investorIndex]) {
          programme.creditFrozen[investorIndex] = 0;
        }

        updateMap[this.ledger.tableName] = {
          txRef: programme.txRef,
          txTime: programme.txTime,
          txType: programme.txType,
          proponentTaxVatId: programme.proponentTaxVatId,
          proponentPercentage: programme.proponentPercentage,
          companyId: programme.companyId,
          creditOwnerPercentage: programme.creditOwnerPercentage,
          creditFrozen: programme.creditFrozen,
        };

        updatedProgramme = programme;
        updateWhereMap[this.ledger.tableName] = {
          programmeId: programme.programmeId,
        };

        if (investmentRequestId) {
          updateMap[this.ledger.companyTableName] = {
            amount: this.round2Precision(investment.amount - amount),
            txRef: programme.txRef,
            txType: programme.txType,
          };
          updateWhereMap[this.ledger.companyTableName] = {
            txId: `${investor}#investment#${investmentRequestId}`,
          };
        }

        return [updateMap, updateWhereMap, {}];
      }
    );

    return updatedProgramme;
  }
}
