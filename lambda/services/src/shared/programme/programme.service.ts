import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ProgrammeDto } from '../dto/programme.dto';
import { Programme } from '../entities/programme.entity';
import { ProgrammeLedgerService } from '../programme-ledger/programme-ledger.service';
import { instanceToPlain, plainToClass } from 'class-transformer';
import { ProgrammeStage } from '../enum/programme-status.enum';
import { AgricultureConstants, AgricultureCreationRequest, calculateCredit, SolarConstants, SolarCreationRequest } from 'carbon-credit-calculator';
import { QueryDto } from '../dto/query.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PrimaryGeneratedColumnType } from 'typeorm/driver/types/ColumnTypes';
import { CounterService } from '../util/counter.service';
import { CounterType } from '../util/counter.type.enum';
import { ConstantEntity } from '../entities/constants.entity';
import { DataResponseDto } from '../dto/data.response.dto';
import { ConstantUpdateDto } from '../dto/constants.update.dto';
import { ProgrammeApprove } from '../dto/programme.approve';
import { DataListResponseDto } from '../dto/data.list.response';
import { BasicResponseDto } from '../dto/basic.response.dto';
import { ConfigService } from '@nestjs/config';
import { TypeOfMitigation } from '../enum/typeofmitigation.enum';
import { CompanyService } from '../company/company.service';
import { ProgrammeTransferRequest } from '../dto/programme.transfer.request';
import { EmailService } from '../email/email.service';
import { EmailTemplates } from '../email/email.template';
import { User } from '../entities/user.entity';
import { ProgrammeTransfer } from '../entities/programme.transfer';
import { TransferStatus } from '../enum/transform.status.enum';
import { ProgrammeTransferApprove } from '../dto/programme.transfer.approve';
import { ProgrammeTransferReject } from '../dto/programme.transfer.reject';
import { Company } from '../entities/company.entity';
import { HelperService } from '../util/helpers.service';
import { CompanyRole } from '../enum/company.role.enum';
import { ProgrammeCertify } from '../dto/programme.certify';
import { ProgrammeQueryEntity } from '../entities/programme.view.entity';
import { ProgrammeTransferViewEntityQuery } from '../entities/programmeTransfer.view.entity';
import { ProgrammeRetire } from '../dto/programme.retire';
import { ProgrammeTransferCancel } from '../dto/programme.transfer.cancel';
import { CompanyState } from '../enum/company.state.enum';
import { ProgrammeReject } from '../dto/programme.reject';
import { ProgrammeIssue } from '../dto/programme.issue';
import { RetireType } from '../enum/retire.type.enum';
import { UserService } from '../user/user.service';
import { Role } from '../casl/role.enum';

export declare function PrimaryGeneratedColumn(options: PrimaryGeneratedColumnType): Function;

@Injectable()
export class ProgrammeService {

    constructor(
        private programmeLedger: ProgrammeLedgerService,
        private counterService: CounterService,
        private configService: ConfigService,
        private companyService: CompanyService,
        private userService: UserService,
        private emailService: EmailService,
        private helperService: HelperService,
        @InjectRepository(Programme) private programmeRepo: Repository<Programme>,
        @InjectRepository(ProgrammeQueryEntity) private programmeViewRepo: Repository<ProgrammeQueryEntity>,
        @InjectRepository(ProgrammeTransferViewEntityQuery) private programmeTransferViewRepo: Repository<ProgrammeTransferViewEntityQuery>,
        @InjectRepository(Company) private companyRepo: Repository<Company>,
        @InjectRepository(ProgrammeTransfer) private programmeTransferRepo: Repository<ProgrammeTransfer>,
        @InjectRepository(ConstantEntity) private constantRepo: Repository<ConstantEntity>,
        private logger: Logger) { }

    private toProgramme(programmeDto: ProgrammeDto): Programme {
        const data = instanceToPlain(programmeDto);
        this.logger.verbose('Converted programme', JSON.stringify(data))
        return plainToClass(Programme, data);
    }

    private async getCreditRequest(programmeDto: ProgrammeDto, constants: ConstantEntity) {
        switch (programmeDto.typeOfMitigation) {
            case TypeOfMitigation.AGRICULTURE:
                const ar = new AgricultureCreationRequest()
                ar.duration = (programmeDto.endTime - programmeDto.startTime)
                ar.durationUnit = "s"
                ar.landArea = programmeDto.agricultureProperties.landArea;
                ar.landAreaUnit = programmeDto.agricultureProperties.landAreaUnit
                if (constants) {
                    ar.agricultureConstants = constants.data as AgricultureConstants
                }
                return ar;
            case TypeOfMitigation.SOLAR:
                const sr = new SolarCreationRequest()
                sr.buildingType = programmeDto.solarProperties.consumerGroup;
                sr.energyGeneration = programmeDto.solarProperties.energyGeneration;
                sr.energyGenerationUnit = programmeDto.solarProperties.energyGenerationUnit
                if (constants) {
                    sr.solarConstants = constants.data as SolarConstants
                }
                return sr;
        }
        throw Error("Not implemented for mitigation type " + programmeDto.typeOfMitigation)
    }

    async transferReject(req: ProgrammeTransferReject, approverCompanyId: number) {

        this.logger.log(`Programme reject ${JSON.stringify(req)} ${approverCompanyId}`);

        const pTransfer = await this.programmeTransferRepo.findOneBy({
            requestId: req.requestId,
        })

        if (!pTransfer) {
            throw new HttpException("Transfer request does not exist", HttpStatus.BAD_REQUEST)
        }

        if (pTransfer.status == TransferStatus.CANCELLED) {
            throw new HttpException("Transfer request already cancelled", HttpStatus.BAD_REQUEST)
        }

        if (!pTransfer.isRetirement && pTransfer.fromCompanyId != approverCompanyId) {
            throw new HttpException("Invalid approver for the transfer request", HttpStatus.FORBIDDEN)
        }
        if (pTransfer.isRetirement && pTransfer.toCompanyId != approverCompanyId) {
            throw new HttpException("Invalid approver for the retirement request", HttpStatus.FORBIDDEN)
        }

        const result = await this.programmeTransferRepo.update({
            requestId: req.requestId,
            status: TransferStatus.PENDING
        }, {
            status: pTransfer.isRetirement ? TransferStatus.NOTRECOGNISED : TransferStatus.REJECTED
        }).catch((err) => {
            this.logger.error(err);
            return err;
        });

        if (result.affected > 0) {
            return new BasicResponseDto(HttpStatus.OK, "Successfully rejected");
        }

        throw new HttpException("No pending transfer request found", HttpStatus.BAD_REQUEST)
    }

    async queryProgrammeTransfers(query: QueryDto, abilityCondition: string): Promise<any> {
        const resp = await this.programmeTransferViewRepo
          .createQueryBuilder('programme_transfer')
          .where(
            this.helperService.generateWhereSQL(
              query,
              this.helperService.parseMongoQueryToSQLWithTable("programme_transfer", abilityCondition)
            )
          )
          .orderBy(query?.sort?.key && `"${query?.sort?.key}"`, query?.sort?.order)
          .offset(query.size * query.page - query.size)
          .limit(query.size)
          .getManyAndCount();
    
        if (resp.length > 0) {
            resp[0] = resp[0].map( e => {
                e.certifier = e.certifier.length > 0 && e.certifier[0] === null ? []: e.certifier
                return e;
            })
        }
        return new DataListResponseDto(
          resp.length > 0 ? resp[0] : undefined,
          resp.length > 1 ? resp[1] : undefined
        );
      }

    async transferApprove(req: ProgrammeTransferApprove, approver: User) {
        // TODO: Handle transaction, can happen 
        console.log('Approver', approver)
        const transfer = await this.programmeTransferRepo.findOneBy({
            requestId: req.requestId,
        });

        if (!transfer) {
            throw new HttpException("Transfer request does not exist", HttpStatus.BAD_REQUEST)
        }

        if (transfer.status == TransferStatus.CANCELLED) {
            throw new HttpException("Transfer request already cancelled", HttpStatus.BAD_REQUEST)
        }

        if (transfer.status == TransferStatus.APPROVED || transfer.status == TransferStatus.RECOGNISED) {
            throw new HttpException("Transfer already approved", HttpStatus.BAD_REQUEST)
        }

        if (!transfer.isRetirement && transfer.fromCompanyId != approver.companyId) {
            throw new HttpException("Invalid approver for the transfer request", HttpStatus.FORBIDDEN)
        }
        if (transfer.isRetirement && transfer.toCompanyId != approver.companyId) {
            throw new HttpException("Invalid approver for the retirement request", HttpStatus.FORBIDDEN)
        }

        const receiver = await this.companyService.findByCompanyId(
          transfer.toCompanyId
        );
        const giver = await this.companyService.findByCompanyId(
          transfer.fromCompanyId
        );

        if (receiver.state === CompanyState.SUSPENDED) {
          await this.companyService.companyTransferCancel(transfer.toCompanyId);
          throw new HttpException(
            "Receive company suspended",
            HttpStatus.BAD_REQUEST
          );
        }

        if (giver.state === CompanyState.SUSPENDED) {
          await this.companyService.companyTransferCancel(
            transfer.fromCompanyId
          );
          throw new HttpException(
            "Credit sending company suspended",
            HttpStatus.BAD_REQUEST
          );
        }

        if (transfer.status != TransferStatus.PROCESSING) {
            const trq = await this.programmeTransferRepo.update({
                requestId: req.requestId,
                status: TransferStatus.PENDING
            }, {
                status: TransferStatus.PROCESSING
            }).catch((err) => {
                this.logger.error(err);
                return err;
            });
    
            if (trq.affected <= 0) {
                throw new HttpException("No pending transfer request found", HttpStatus.BAD_REQUEST)
            }
        }

        return await this.doTransfer(transfer, `${this.getUserRef(approver)}#${receiver.companyId}#${receiver.name}`, req.comment, transfer.isRetirement)
    }

    private async doTransfer(transfer: ProgrammeTransfer, user: string, reason: string, isRetirement: boolean) {
        const programme = await this.programmeLedger.transferProgramme(transfer, user, reason, isRetirement);

        this.logger.log('Programme updated');
        const result = await this.programmeTransferRepo.update({
            requestId: transfer.requestId
        }, {
            status: transfer.isRetirement ? TransferStatus.RECOGNISED : TransferStatus.APPROVED
        }).catch((err) => {
            this.logger.error(err);
            return err;
        });

        if (result.affected > 0) {
            return new DataResponseDto(HttpStatus.OK, programme);
        }

        throw new HttpException("Internal error on status updating", HttpStatus.INTERNAL_SERVER_ERROR)
    }

    async transferCancel(req: ProgrammeTransferCancel, requester: User) {
        this.logger.log(`Programme transfer cancel by ${requester.companyId}-${requester.id} received ${JSON.stringify(req)}`)

        const transfer = await this.programmeTransferRepo.findOneBy({
            requestId: req.requestId,
        });
        
        if (!transfer) {
            throw new HttpException("Transfer request does not exist", HttpStatus.BAD_REQUEST)
        }

        if (transfer.status != TransferStatus.PENDING) {
            throw new HttpException("Transfer already processed", HttpStatus.BAD_REQUEST)
        }

        const result = await this.programmeTransferRepo.update({
            requestId: req.requestId,
            status: TransferStatus.PENDING
        }, {
            status: TransferStatus.CANCELLED
        }).catch((err) => {
            this.logger.error(err);
            return err;
        });

        if (result.affected > 0) {
            return new BasicResponseDto(HttpStatus.OK, "Successfully cancelled");
        }
        return new BasicResponseDto(HttpStatus.BAD_REQUEST, "Transfer request does not exist in the giv");
    }

    async transferRequest(req: ProgrammeTransferRequest, requester: User) {
        this.logger.log(`Programme transfer request by ${requester.companyId}-${requester.id} received ${JSON.stringify(req)}`)
        
        // TODO: Move this to casl factory
        // if (requester.role == Role.ViewOnly) {
        //     throw new HttpException("View only user cannot create requests", HttpStatus.FORBIDDEN)
        // }

        // if (![CompanyRole.GOVERNMENT, CompanyRole.PROGRAMME_DEVELOPER].includes(requester.companyRole)) {
        //     throw new HttpException("Unsupported company role", HttpStatus.FORBIDDEN)
        // }

        if (req.companyCredit && req.companyCredit.reduce((a, b) => a + b, 0) <= 0) {
            throw new HttpException("Total Amount should be greater than 0", HttpStatus.BAD_REQUEST)
        }

        if (req.fromCompanyIds.length > 1 ) {
            if (!req.companyCredit) {
                throw new HttpException("Company credit needs to define for multiple companies", HttpStatus.BAD_REQUEST)
            } else if (req.fromCompanyIds.length != req.companyCredit.length){
                throw new HttpException("Invalid company credit for given companies", HttpStatus.BAD_REQUEST)
            }
        }

        const indexTo = req.fromCompanyIds.indexOf(req.toCompanyId);
        if (indexTo >= 0 && req.companyCredit[indexTo] > 0) {
            throw new HttpException("Cannot transfer credit within the same company", HttpStatus.BAD_REQUEST)
        }

        const programme = await this.programmeLedger.getProgrammeById(req.programmeId);

        if (!programme) {
            throw new HttpException("Programme does not exist", HttpStatus.BAD_REQUEST)
        }
        this.logger.verbose(`Transfer programme ${JSON.stringify(programme)}`)

        if (programme.currentStage != ProgrammeStage.AUTHORISED) {
            throw new HttpException("Programme is not in credit issued state", HttpStatus.BAD_REQUEST)
        }
        // if (programme.creditBalance - (programme.creditFrozen ? programme.creditFrozen.reduce((a, b) => a + b, 0) : 0) < req.creditAmount) {
        //     throw new HttpException("Not enough balance for the transfer", HttpStatus.BAD_REQUEST)
        // }
        // if (requester.companyRole != CompanyRole.GOVERNMENT && programme.companyId.includes(requester.companyId)) {
        //     throw new HttpException("Cannot initiate transfers for already owned programmes", HttpStatus.BAD_REQUEST)
        // }

        if (!req.fromCompanyIds) {
            req.fromCompanyIds = programme.companyId;
        }
        if (!programme.creditOwnerPercentage) {
            programme.creditOwnerPercentage = [100]
        }
        if (!req.companyCredit) {
            req.companyCredit = programme.creditOwnerPercentage.map((p, i) => (programme.creditBalance*p/100 - (programme.creditFrozen ? programme.creditFrozen[i]: 0)));
        }

        const requestedCompany = await this.companyService.findByCompanyId(requester.companyId);

        const allTransferList: ProgrammeTransfer[] = []
        const autoApproveTransferList: ProgrammeTransfer[] = []
        const ownershipMap = {}
        const frozenCredit = {} 
       
        for (const i in programme.companyId) {
            ownershipMap[programme.companyId[i]] = programme.creditOwnerPercentage[i]
            if (programme.creditFrozen) {
                frozenCredit[programme.companyId[i]] = programme.creditFrozen[i]
            }
        }
        
        for (const j in req.fromCompanyIds) {
            const fromCompanyId = req.fromCompanyIds[j]
            this.logger.log(`Transfer request from ${fromCompanyId} to programme owned by ${programme.companyId}`)
            const fromCompany = await this.companyService.findByCompanyId(fromCompanyId);

            if (!programme.companyId.includes(fromCompanyId)) {
                throw new HttpException("From company mentioned in the request does own the programme", HttpStatus.BAD_REQUEST)
            }

            console.log(programme.creditBalance, ownershipMap[fromCompanyId], frozenCredit[fromCompanyId])
            const companyAvailableCredit = (programme.creditBalance * ownershipMap[fromCompanyId] / 100) - (frozenCredit[fromCompanyId] ? frozenCredit[fromCompanyId] : 0);

            let transferCompanyCredit;
            if (req.fromCompanyIds.length == 1 && !req.companyCredit) {
                transferCompanyCredit = companyAvailableCredit;
            } else {
                transferCompanyCredit = req.companyCredit[j];
            }

            if (companyAvailableCredit < transferCompanyCredit) {
                throw new HttpException(`Company ${fromCompany.name} does not have enough balance for the transfer. Available: ${companyAvailableCredit}`, HttpStatus.BAD_REQUEST)
            }

            if (transferCompanyCredit == 0) {
                continue;
            }

            const transfer = new ProgrammeTransfer();
            transfer.programmeId = req.programmeId;
            transfer.fromCompanyId = fromCompanyId;
            transfer.toCompanyId = req.toCompanyId;
            transfer.initiator = requester.id;
            transfer.initiatorCompanyId = requester.companyId;
            transfer.txTime = new Date().getTime()
            transfer.comment = req.comment;
            transfer.creditAmount = transferCompanyCredit;
            transfer.toAccount = req.toAccount;
            transfer.isRetirement = false;

            if (requester.companyId != fromCompanyId) {
                transfer.status = TransferStatus.PENDING;
                await this.emailService.sendEmail(
                    fromCompany.email,
                    EmailTemplates.TRANSFER_REQUEST,
                    {
                        "name": fromCompany.name,
                        "requestedCompany": requestedCompany.name,
                        "credits": transfer.creditAmount,
                        "serialNo": programme.serialNo,
                        "programmeName": programme.title
                    });
            } else {
                transfer.status = TransferStatus.PROCESSING;
                autoApproveTransferList.push(transfer);
            }
            allTransferList.push(transfer);
        }
        const results = await this.programmeTransferRepo.insert(allTransferList)
        console.log(results)
        for (const i in allTransferList) {
            allTransferList[i].requestId = results.identifiers[i].requestId;
        }

        let updateProgramme = undefined;
        for (const trf of autoApproveTransferList) {
            this.logger.log(`Credit send received ${trf}`)
            const toCompany = await this.companyService.findByCompanyId(trf.toCompanyId);
            console.log('To Company', toCompany)
            updateProgramme  = (await this.doTransfer(trf, `${this.getUserRef(requester)}#${toCompany.companyId}#${toCompany.name}`, req.comment, false)).data;
        }
        if (updateProgramme) {
            return new DataResponseDto(HttpStatus.OK, updateProgramme)
        }
        return new DataListResponseDto(allTransferList, allTransferList.length)
    }

    async create(programmeDto: ProgrammeDto): Promise<Programme | undefined> {
        this.logger.verbose('ProgrammeDTO received', programmeDto)
        const programme: Programme = this.toProgramme(programmeDto);
        this.logger.verbose('Programme create', programme)

        if (programmeDto.proponentTaxVatId.length > 1 && (!programmeDto.proponentPercentage || programmeDto.proponentPercentage.length != programmeDto.proponentTaxVatId.length)) {
            throw new HttpException("Proponent percentage must defined for each proponent tax id", HttpStatus.BAD_REQUEST)
        }

        if (programmeDto.proponentPercentage &&  programmeDto.proponentTaxVatId.length != programmeDto.proponentPercentage.length) {
            throw new HttpException("Proponent percentage and number of tax ids does not match", HttpStatus.BAD_REQUEST)
        }

        if (programmeDto.proponentPercentage &&  programmeDto.proponentPercentage.reduce((a, b) => a + b, 0) != 100) {
            throw new HttpException("Proponent percentage sum must be equals to 100", HttpStatus.BAD_REQUEST)
        }

        if (programmeDto.proponentTaxVatId.length !== new Set(programmeDto.proponentTaxVatId).size) {
            throw new HttpException("Proponent tax id cannot be duplicated", HttpStatus.BAD_REQUEST)
        }

        const companyIds = []
        for (const taxId of programmeDto.proponentTaxVatId) {
            const projectCompany = await this.companyService.findByTaxId(taxId);
            if (!projectCompany) {
                throw new HttpException("Proponent tax id does not exist in the system", HttpStatus.BAD_REQUEST)
            }

            if (projectCompany.companyRole != CompanyRole.PROGRAMME_DEVELOPER) {
                throw new HttpException("Proponent is not a programme developer", HttpStatus.BAD_REQUEST)
            }

            companyIds.push(projectCompany.companyId)
        }


        programme.programmeId = (await this.counterService.incrementCount(CounterType.PROGRAMME, 3))
        programme.countryCodeA2 = this.configService.get('systemCountry');
        const constants = await this.getLatestConstant(programmeDto.typeOfMitigation)

        const req = await this.getCreditRequest(programmeDto, constants);
        try {
            programme.creditEst = Math.round(await calculateCredit(req));
        } catch (err) {
            this.logger.log(`Credit calculate failed ${err.message}`)
            throw new HttpException(err.message, HttpStatus.BAD_REQUEST)
        }

        if (programme.creditEst <= 0) {
            throw new HttpException("Not enough credits to create the programme", HttpStatus.BAD_REQUEST)
        }
        // programme.creditBalance = programme.creditIssued;
        // programme.creditChange = programme.creditIssued;
        programme.programmeProperties.creditYear = new Date(programme.startTime * 1000).getFullYear()
        programme.constantVersion = constants ? String(constants.version) : "default"
        programme.currentStage = ProgrammeStage.AWAITING_AUTHORIZATION;
        programme.companyId = companyIds;
        programme.txTime = new Date().getTime();
        if (programme.proponentPercentage){
            programme.creditOwnerPercentage = programme.proponentPercentage
        }
        programme.createdTime = programme.txTime;
        if (!programme.creditUnit) {
            programme.creditUnit = this.configService.get('defaultCreditUnit')
        }

        return await this.programmeLedger.createProgramme(programme);
    }

    async query(query: QueryDto, abilityCondition: string): Promise<DataListResponseDto> {
        const skip = (query.size * query.page) - query.size;
        let resp = (await this.programmeViewRepo.createQueryBuilder("programme")
            .where(this.helperService.generateWhereSQL(query, this.helperService.parseMongoQueryToSQLWithTable("programme", abilityCondition), "programme"))
            .orderBy(
                query?.sort?.key && `"programme"."${query?.sort?.key}"`,
                query?.sort?.order
            )
            .offset(skip)
            .limit(query.size)
            .getManyAndCount())

        if (resp.length > 0) {
            resp[0] = resp[0].map( e => {
                e.certifier = e.certifier.length > 0 && e.certifier[0] === null ? []: e.certifier
                e.company = e.company.length > 0 && e.company[0] === null ? []: e.company
                return e;
            })
        }

        return new DataListResponseDto(
            resp.length > 0 ? resp[0] : undefined,
            resp.length > 1 ? resp[1] : undefined
        );
    }

    async getProgrammeEvents(programmeId: string, companyId: number): Promise<any> {
        const resp = await this.programmeLedger.getProgrammeHistory(programmeId);
        // const comp = await this.companyService.findByCompanyId(companyId)
        // if (resp.length > 0 && comp.state == CompanyState.SUSPENDED) {
            
        // }
        return resp == null ? [] : resp;
    }

    async updateCustomConstants(customConstantType: TypeOfMitigation, constants: ConstantUpdateDto) {
        let config;
        if (customConstantType == TypeOfMitigation.AGRICULTURE) {
            config = new AgricultureConstants()
            const recv = instanceToPlain(constants.agricultureConstants)
            for (const key in recv) {
                if (recv.hasOwnProperty(key) && recv[key] != undefined) {
                    config[key] = recv[key]
                }
            }
        }
        else if (customConstantType == TypeOfMitigation.SOLAR) {
            config = new SolarConstants()
            const recv = instanceToPlain(constants.solarConstants)
            for (const key in recv) {
                if (recv.hasOwnProperty(key) && recv[key] != undefined) {
                    config[key] = recv[key]
                }
            }
        }

        const existing = await this.getLatestConstant(customConstantType);
        if (existing && JSON.stringify(existing.data) == JSON.stringify(config)) {
            throw new HttpException("Not difference in the config from the previous version", HttpStatus.BAD_REQUEST)
        }
        const resp = await this.constantRepo.save({
            id: customConstantType,
            data: config
        })
        return new DataResponseDto(HttpStatus.OK, resp);
    }

    async getLatestConstant(customConstantType: TypeOfMitigation) {
        return await this.constantRepo.findOne({
            where: [{ id: customConstantType }],
            order: { version: 'DESC' }
        });
    }

    async certify(req: ProgrammeCertify, add: boolean, user: User) {
        this.logger.log(`Programme ${req.programmeId} certification received by ${user.id}`)

        if (add && user.companyRole != CompanyRole.CERTIFIER) {
            throw new HttpException("Programme certification can perform only by certifier", HttpStatus.FORBIDDEN)
        }

        if (!add && ![CompanyRole.CERTIFIER, CompanyRole.GOVERNMENT].includes(user.companyRole)) {
            throw new HttpException("Programme certification revoke can perform only by certifier or government", HttpStatus.FORBIDDEN)
        }

        let certifierId;
        if (user.companyRole === CompanyRole.GOVERNMENT) {
            if (!req.certifierId) {
                throw new HttpException("certifierId required for government user", HttpStatus.FORBIDDEN)
            }
            certifierId = req.certifierId
        } else {
            certifierId = user.companyId;
        }

        const updated = await this.programmeLedger.updateCertifier(req.programmeId, certifierId, add, this.getUserRef(user))
        updated.company = await this.companyRepo.find({
            where: { companyId: In(updated.companyId) },
        })
        if (updated && updated.certifierId && updated.certifierId.length > 0) {
            updated.certifier = await this.companyRepo.find({
                where: { companyId: In(updated.certifierId) },
            })
        }
        return new DataResponseDto(HttpStatus.OK, updated)
    }

    async retireProgramme(req: ProgrammeRetire, requester: User) {
        this.logger.log(`Programme ${req.programmeId} retiring Comment: ${req.comment} type: ${req.type}`)
        
        if (req.fromCompanyIds && req.fromCompanyIds.length > 1 ) {
            if (req.companyCredit && req.fromCompanyIds.length != req.companyCredit.length){
                throw new HttpException("Invalid company credit for given companies", HttpStatus.BAD_REQUEST)
            }
        }

        // if (req.type === RetireType.CROSS_BORDER && !req.toCompanyMeta.country) {
        //     throw new HttpException("Country is required for cross border retirement", HttpStatus.BAD_REQUEST)
        // }

        const programme = await this.programmeLedger.getProgrammeById(req.programmeId);

        if (!programme) {
            throw new HttpException("Programme does not exist", HttpStatus.BAD_REQUEST)
        }
        this.logger.verbose(`Transfer programme ${JSON.stringify(programme)}`)

        if (programme.currentStage != ProgrammeStage.AUTHORISED) {
            throw new HttpException("Programme is not in credit issued state", HttpStatus.BAD_REQUEST)
        }
        

        if (!req.fromCompanyIds) {
            req.fromCompanyIds = programme.companyId;
        }
        if (!programme.creditOwnerPercentage) {
            programme.creditOwnerPercentage = [100]
        }
        if (!req.companyCredit) {
            req.companyCredit = programme.creditOwnerPercentage.map((p, i) => (programme.creditBalance*p/100 - (programme.creditFrozen ? programme.creditFrozen[i]: 0)));
        }

        const requestedCompany = await this.companyService.findByCompanyId(requester.companyId);
        const toCompany = await this.companyService.findGovByCountry(this.configService.get('systemCountry'))

        if (requestedCompany.companyRole != CompanyRole.GOVERNMENT) {
            if (!programme.companyId.includes(requester.companyId)) {
                throw new HttpException("Credit retirement can initiate only the government or programme owner", HttpStatus.BAD_REQUEST)
            }
            if (req.type !== RetireType.CROSS_BORDER) {
                throw new HttpException("Programme developer allowed to initiate only cross border transfers", HttpStatus.BAD_REQUEST)
            }
        }
        

        const allTransferList: ProgrammeTransfer[] = []
        const autoApproveTransferList: ProgrammeTransfer[] = []
        const ownershipMap = {}
        const frozenCredit = {} 

        for (const i in programme.companyId) {
            ownershipMap[programme.companyId[i]] = programme.creditOwnerPercentage[i]
            if (programme.creditFrozen) {
                frozenCredit[programme.companyId[i]] = programme.creditFrozen[i]
            }
        }
        
        for (const j in req.fromCompanyIds) {
            const fromCompanyId = req.fromCompanyIds[j]
            this.logger.log(`Retire request from ${fromCompanyId} to programme owned by ${programme.companyId}`)
            const fromCompany = await this.companyService.findByCompanyId(fromCompanyId);

            if (!programme.companyId.includes(fromCompanyId)) {
                throw new HttpException("Retire request from company does own the programme", HttpStatus.BAD_REQUEST)
            }
            const companyAvailableCredit = (programme.creditBalance * ownershipMap[fromCompanyId] / 100) - (frozenCredit[fromCompanyId] ? frozenCredit[fromCompanyId] : 0);

            let transferCompanyCredit;
            if (req.fromCompanyIds.length == 1 && !req.companyCredit) {
                transferCompanyCredit = companyAvailableCredit;
            } else {
                transferCompanyCredit = req.companyCredit[j];
            }

            if (companyAvailableCredit < transferCompanyCredit) {
                throw new HttpException(`Company ${fromCompany.name} does not have enough balance for the transfer. Available: ${companyAvailableCredit}`, HttpStatus.BAD_REQUEST)
            }

            if (transferCompanyCredit == 0) {
                continue;
            }

            const transfer = new ProgrammeTransfer();
            transfer.programmeId = req.programmeId;
            transfer.fromCompanyId = fromCompanyId;
            transfer.toCompanyId = toCompany.companyId;
            transfer.initiator = requester.id;
            transfer.initiatorCompanyId = requester.companyId;
            transfer.txTime = new Date().getTime()
            transfer.comment = req.comment;
            transfer.creditAmount = transferCompanyCredit;
            transfer.toAccount = req.type == RetireType.CROSS_BORDER ? 'international': 'local';
            transfer.isRetirement = true;
            transfer.toCompanyMeta = req.toCompanyMeta;
            transfer.retirementType = req.type;
            // await this.programmeTransferRepo.save(transfer);

            if (requester.companyId != toCompany.companyId) {
                transfer.status = TransferStatus.PENDING;
                await this.emailService.sendEmail(
                    toCompany.email,
                    EmailTemplates.RETIRE_REQUEST,
                    {
                        "name": fromCompany.name,
                        "requestedCompany": requestedCompany.name,
                        "credits": transfer.creditAmount,
                        "serialNo": programme.serialNo,
                        "programmeName": programme.title
                    });
            } else {
                transfer.status = TransferStatus.PROCESSING;
                autoApproveTransferList.push(transfer);
            }
            allTransferList.push(transfer);
        }
        const results = await this.programmeTransferRepo.insert(allTransferList)
        console.log(results)
        for (const i in allTransferList) {
            allTransferList[i].requestId = results.identifiers[i].requestId;
        }
        
        let updateProgramme = undefined;
        for (const trf of autoApproveTransferList) {
            this.logger.log(`Retire auto approve received ${trf}`)
            updateProgramme = (await this.doTransfer(trf, this.getUserRef(requester), req.comment, true)).data;
        }
        if (updateProgramme) {
            return new DataResponseDto(HttpStatus.OK, updateProgramme)
        }
        return new DataListResponseDto(allTransferList, allTransferList.length)
    }

    async issueProgrammeCredit(req: ProgrammeIssue, user: User) {
        this.logger.log(`Programme ${req.programmeId} approve. Comment: ${req.comment}`)
        const program = await this.programmeLedger.getProgrammeById(req.programmeId);
        if (!program) {
            throw new HttpException("Programme does not exist", HttpStatus.BAD_REQUEST);
        }

        if (program.currentStage != ProgrammeStage.AUTHORISED) {
            throw new HttpException("Programme is not in authorised state", HttpStatus.BAD_REQUEST);
        }
        if (program.creditEst - program.creditIssued < req.issueAmount) {
            throw new HttpException("Programme issue credit amount can not exceed pending credit amount", HttpStatus.BAD_REQUEST);
        }
        const updated: any = await this.programmeLedger.issueProgrammeStatus(req.programmeId, this.configService.get('systemCountry'), program.companyId, req.issueAmount, this.getUserRef(user))
        if (!updated) {
            return new BasicResponseDto(HttpStatus.BAD_REQUEST, `Does not found a pending programme for the given programme id ${req.programmeId}`)
        }

        updated.company = await this.companyRepo.find({
            where: { companyId: In(updated.companyId) },
        })
        if (updated.certifierId && updated.certifierId.length > 0) {
            updated.certifier = await this.companyRepo.find({
                where: { companyId: In(updated.certifierId) },
            })
        }
        return new DataResponseDto(HttpStatus.OK, updated)
    }

    async approveProgramme(req: ProgrammeApprove, user: User) {
        this.logger.log(`Programme ${req.programmeId} approve. Comment: ${req.comment}`)
        const program = await this.programmeLedger.getProgrammeById(req.programmeId);
        if (!program) {
            throw new HttpException("Programme does not exist", HttpStatus.BAD_REQUEST);
        }

        if (program.currentStage != ProgrammeStage.AWAITING_AUTHORIZATION) {
            throw new HttpException("Programme is not in pending state", HttpStatus.BAD_REQUEST);
        }
        if (program.creditEst < req.issueAmount) {
            throw new HttpException("Programme issue credit amount can not exceed estimated credit amount", HttpStatus.BAD_REQUEST);
        }
        const updated: any = await this.programmeLedger.authProgrammeStatus(req.programmeId, this.configService.get('systemCountry'), program.companyId, req.issueAmount, this.getUserRef(user))
        if (!updated) {
            return new BasicResponseDto(HttpStatus.BAD_REQUEST, `Does not found a pending programme for the given programme id ${req.programmeId}`)
        }

        updated.company = await this.companyRepo.find({
            where: { companyId: In(updated.companyId) },
        })
        if (updated.certifierId && updated.certifierId.length > 0) {
            updated.certifier = await this.companyRepo.find({
                where: { companyId: In(updated.certifierId) },
            })
        }
        return new DataResponseDto(HttpStatus.OK, updated)
    }

    async rejectProgramme(req: ProgrammeReject, user: User) {
        this.logger.log(`Programme ${req.programmeId} reject. Comment: ${req.comment}`)

        const updated = await this.programmeLedger.updateProgrammeStatus(req.programmeId, ProgrammeStage.REJECTED, ProgrammeStage.AWAITING_AUTHORIZATION, this.getUserRef(user))
        if (!updated) {
            throw new HttpException("Programme does not exist", HttpStatus.BAD_REQUEST);
        }
        return new BasicResponseDto(HttpStatus.OK, "Successfully updated")
    }

    private getUserRef = (user: any) => {
        return `${user.companyId}#${user.companyName}#${user.id}#${user.name}`;
    }
}