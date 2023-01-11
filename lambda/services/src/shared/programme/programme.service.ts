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
import { ProgrammeRetire } from '../dto/programme.retire';

export declare function PrimaryGeneratedColumn(options: PrimaryGeneratedColumnType): Function;

@Injectable()
export class ProgrammeService {

    constructor(
        private programmeLedger: ProgrammeLedgerService,
        private counterService: CounterService,
        private configService: ConfigService,
        private companyService: CompanyService,
        private emailService: EmailService,
        private helperService: HelperService,
        @InjectRepository(Programme) private programmeRepo: Repository<Programme>,
        @InjectRepository(ProgrammeQueryEntity) private programmeViewRepo: Repository<ProgrammeQueryEntity>,
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

        if (!pTransfer.companyId.includes(approverCompanyId)) {
            throw new HttpException("No ownership to the programme", HttpStatus.FORBIDDEN)
        }
        const result = await this.programmeTransferRepo.update({
            requestId: req.requestId,
            status: TransferStatus.PENDING
        }, {
            status: TransferStatus.REJECTED
        }).catch((err) => {
            this.logger.error(err);
            return err;
        });

        if (result.affected > 0) {
            return new BasicResponseDto(HttpStatus.OK, "Successfully rejected");
        }

        throw new HttpException("No pending transfer request found", HttpStatus.BAD_REQUEST)
    }

    async transferApprove(req: ProgrammeTransferApprove, approverCompanyId: number) {
        // TODO: Handle transaction, can happen 
        const transfer = await this.programmeTransferRepo.findOneBy({
            requestId: req.requestId,
        });

        if (transfer.status == TransferStatus.APPROVED) {
            throw new HttpException("Transfer already approved", HttpStatus.BAD_REQUEST)
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
        

        if (req.companyIds && req.companyIds.length > 1 && (!req.companyCredit || req.companyCredit.length != req.companyIds.length)) {
            throw new HttpException("Incorrect company percentage", HttpStatus.BAD_REQUEST)
        }

        if (req.companyCredit && transfer.creditAmount != req.companyCredit.reduce((a, b) => a + b, 0)) {
            throw new HttpException("Incorrect company percentage", HttpStatus.BAD_REQUEST)
        }

        const received = await this.companyService.findByCompanyId(transfer.requesterCompanyId);
        const programme = await this.programmeLedger.transferProgramme(transfer, req, received.name);

        if (!programme.companyId.includes(approverCompanyId)) {
            throw new HttpException("No ownership to the programme", HttpStatus.FORBIDDEN)
        }

        this.logger.log('Programme updated');
        const result = await this.programmeTransferRepo.update({
            requestId: req.requestId
        }, {
            status: TransferStatus.APPROVED
        }).catch((err) => {
            this.logger.error(err);
            return err;
        });

        if (result.affected > 0) {
            return new DataResponseDto(HttpStatus.OK, programme);
        }

        throw new HttpException("Internal error on status updating", HttpStatus.INTERNAL_SERVER_ERROR)
    }

    async transferRequest(req: ProgrammeTransferRequest, requester: User) {
        this.logger.log(`Programme transfer request by ${requester.companyId}-${requester.id} received ${JSON.stringify(req)}`)
        const programme = await this.programmeLedger.getProgrammeById(req.programmeId);
        this.logger.verbose(`Transfer programme ${JSON.stringify(programme)}`)

        if (programme.currentStage != ProgrammeStage.ISSUED) {
            throw new HttpException("Programme is not in credit issued state", HttpStatus.BAD_REQUEST)
        }
        if (programme.creditBalance - programme.creditFrozen.reduce((a, b) => a + b, 0) < req.creditAmount) {
            throw new HttpException("Not enough balance for the transfer", HttpStatus.BAD_REQUEST)
        }
        if (programme.companyId.includes(requester.companyId)) {
            throw new HttpException("Cannot initiate transfers for already owned programmes", HttpStatus.BAD_REQUEST)
        }

        const requestedCompany = await this.companyService.findByCompanyId(requester.companyId);

        for (const companyId of programme.companyId) {
            const company = await this.companyService.findByCompanyId(companyId);
            await this.emailService.sendEmail(
                company.email,
                EmailTemplates.TRANSFER_REQUEST,
                {
                    "name": company.name,
                    "requestedCompany": requestedCompany.name,
                    "credits": req.creditAmount,
                    "serialNo": programme.serialNo,
                    "programmeName": programme.title
                });
        }

        const transfer = plainToClass(ProgrammeTransfer, req)
        transfer.status = TransferStatus.PENDING;
        transfer.txTime = new Date().getTime()
        transfer.requesterId = requester.id;
        transfer.requesterCompanyId = requester.companyId;
        transfer.companyId = programme.companyId;
        return await this.programmeTransferRepo.save(transfer);
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

    async getProgrammeEvents(programmeId: string): Promise<any> {
        const resp = await this.programmeLedger.getProgrammeHistory(programmeId);
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

        if (user.companyRole != CompanyRole.CERTIFIER) {
            throw new HttpException("Programme certification can perform only by certifier", HttpStatus.FORBIDDEN)
        }

        const company = await this.companyService.findByCompanyId(user.companyId);
        const updated = await this.programmeLedger.updateCertifier(req.programmeId, user.companyId, add, `${user.id}#${user.name}#${user.companyId}#${company.name}`)
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

    async retireProgramme(req: ProgrammeRetire, user: string) {
        this.logger.log(`Programme ${req.programmeId} retiring Comment: ${req.comment}`)
        const updated: any = await this.programmeLedger.retireProgramme(req.programmeId, req.reason, user)
        if (!updated) {
            return new BasicResponseDto(HttpStatus.BAD_REQUEST, `Does not found a programme in issued status for the given programme id ${req.programmeId}`)
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

    async updateProgrammeStatus(req: ProgrammeApprove, status: ProgrammeStage, expectedCurrentStatus: ProgrammeStage, user: string) {
        this.logger.log(`Programme ${req.programmeId} status updating to ${status}. Comment: ${req.comment}`)
        if (status == ProgrammeStage.ISSUED) {
            const program = await this.programmeLedger.getProgrammeById(req.programmeId);
            if (!program) {
                throw new HttpException("Programme does not exist", HttpStatus.BAD_REQUEST);
            }
            const updated: any = await this.programmeLedger.authProgrammeStatus(req.programmeId, this.configService.get('systemCountry'), program.companyId, user)
            if (!updated) {
                return new BasicResponseDto(HttpStatus.BAD_REQUEST, `Does not found a programme in ${expectedCurrentStatus} status for the given programme id ${req.programmeId}`)
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
        } else {
            const updated = await this.programmeLedger.updateProgrammeStatus(req.programmeId, status, expectedCurrentStatus, user)
            if (!updated) {
                throw new HttpException("Programme does not exist", HttpStatus.BAD_REQUEST);
            }
            return new BasicResponseDto(HttpStatus.OK, "Successfully updated")
        }

    }
}
