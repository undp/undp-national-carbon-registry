import { PG_UNIQUE_VIOLATION } from "@drdgvhbh/postgres-error-codes";
import { forwardRef, HttpException, HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { OrganisationDto } from "../dto/organisation.dto";
import { QueryFailedError, Repository } from "typeorm";
import { Company } from "../entities/company.entity";
import { CompanyRole } from "../enum/company.role.enum";
import { QueryDto } from "../dto/query.dto";
import { DataListResponseDto } from "../dto/data.list.response";
import { BasicResponseDto } from "../dto/basic.response.dto";
import { CompanyState } from "../enum/company.state.enum";
import { HelperService } from "../util/helpers.service";
import { FindOrganisationQueryDto } from "../dto/find.organisation.dto";
import { ProgrammeLedgerService } from "../programme-ledger/programme-ledger.service";
import { OrganisationUpdateDto } from "../dto/organisation.update.dto";
import { DataResponseDto } from "../dto/data.response.dto";
import { ProgrammeTransfer } from "../entities/programme.transfer";
import { TransferStatus } from "../enum/transform.status.enum";
import { User } from "../entities/user.entity";
import { EmailHelperService } from "../email-helper/email-helper.service";
import { Programme } from "../entities/programme.entity";
import { EmailTemplates } from "../email/email.template";
import { SystemActionType } from "../enum/system.action.type";

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    private logger: Logger,
    private configService: ConfigService,
    private helperService: HelperService,
    private programmeLedgerService: ProgrammeLedgerService,
    @Inject(forwardRef(() => EmailHelperService))
    private emailHelperService: EmailHelperService,
    @InjectRepository(ProgrammeTransfer)
    private programmeTransferRepo: Repository<ProgrammeTransfer>
  ) {}

  async suspend(
    companyId: number,
    user: User,
    remarks: string,
    abilityCondition: string
  ): Promise<any> {
    this.logger.verbose("Suspend company", companyId);
    const company = await this.companyRepo
      .createQueryBuilder()
      .where(
        `"companyId" = '${companyId}' and state = '1' ${
          abilityCondition
            ? " AND " +
              this.helperService.parseMongoQueryToSQL(abilityCondition)
            : ""
        }`
      )
      .getOne();
    if (!company) {
      throw new HttpException(
        "No active company found",
        HttpStatus.UNAUTHORIZED
      );
    }
    const result = await this.companyRepo
      .update(
        {
          companyId: companyId,
        },
        {
          state: CompanyState.SUSPENDED,
          remarks: remarks,
        }
      )
      .catch((err: any) => {
        this.logger.error(err);
        return err;
      });

    if (result.affected > 0) {
      // TODO: Currently there can be unfreezed credits after company suspend if transactions failed
      if (company.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
        await this.programmeLedgerService.freezeCompany(
          companyId,
          this.getUserRefWithRemarks(user, `${remarks}#${company.name}`)
        );
        await this.companyTransferCancel(companyId, `${remarks}#${user.companyId}#${user.id}#${SystemActionType.SUSPEND_AUTO_CANCEL}#${company.name}`);
        await this.emailHelperService.sendEmail(company.email,EmailTemplates.PROGRAMME_DEVELOPER_ORG_DEACTIVATION,{},user.companyId)
      } else if (company.companyRole === CompanyRole.CERTIFIER) {
        await this.programmeLedgerService.revokeCompanyCertifications(
          companyId,
          this.getUserRefWithRemarks(user, `${remarks}#${SystemActionType.SUSPEND_REVOKE}#${company.name}`),
          async (programme:Programme) => {
            const hostAddress = this.configService.get("host");
            await this.emailHelperService.sendEmailToProgrammeOwnerAdmins(programme.programmeId,EmailTemplates.PROGRAMME_CERTIFICATION_REVOKE_BY_SYSTEM,{
              organisationName: company.name,
              programmeName: programme.title,
              credits: programme.creditBalance,
              serialNumber: programme.serialNo,
              pageLink: hostAddress + `/programmeManagement/view?id=${programme.programmeId}`
            })
          }
        );

        await this.emailHelperService.sendEmail(company.email,EmailTemplates.CERTIFIER_ORG_DEACTIVATION,{},user.companyId)
      }
      return new BasicResponseDto(
        HttpStatus.OK,
        "Successfully suspended company"
      );
    }
    throw new HttpException(
      "Company suspend failed. Please try again",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  async activate(companyId: number, abilityCondition: string): Promise<any> {
    this.logger.verbose("revoke company", companyId);
    const company = await this.companyRepo
      .createQueryBuilder()
      .where(
        `"companyId" = '${companyId}' and state = '0' ${
          abilityCondition
            ? " AND " +
              this.helperService.parseMongoQueryToSQL(abilityCondition)
            : ""
        }`
      )
      .getOne();
    if (!company) {
      throw new HttpException(
        "No suspended company found",
        HttpStatus.UNAUTHORIZED
      );
    }
    const result = await this.companyRepo
      .update(
        {
          companyId: companyId,
        },
        {
          state: CompanyState.ACTIVE,
        }
      )
      .catch((err: any) => {
        this.logger.error(err);
        return err;
      });

    if (result.affected > 0) {
      return new BasicResponseDto(
        HttpStatus.OK,
        "Successfully activated company"
      );
    }
    throw new HttpException(
      "Company activate failed. Please try again",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  async query(query: QueryDto, abilityCondition: string): Promise<any> {
    const resp = await this.companyRepo
      .createQueryBuilder()
      .where(
        this.helperService.generateWhereSQL(
          query,
          this.helperService.parseMongoQueryToSQL(abilityCondition)
        )
      )
      .orderBy(query?.sort?.key && `"${query?.sort?.key}"`, query?.sort?.order)
      .offset(query.size * query.page - query.size)
      .limit(query.size)
      .getManyAndCount();

    return new DataListResponseDto(
      resp.length > 0 ? resp[0] : undefined,
      resp.length > 1 ? resp[1] : undefined
    );
  }

  async queryNames(query: QueryDto, abilityCondition: string): Promise<any> {
    const resp = await this.companyRepo
      .createQueryBuilder()
      .select([
        '"companyId"',
        '"name"'
      ])
      .where(
        this.helperService.generateWhereSQL(
          query,
          this.helperService.parseMongoQueryToSQL(abilityCondition)
        )
      )
      .orderBy(query?.sort?.key && `"${query?.sort?.key}"`, query?.sort?.order)
      .offset(query.size * query.page - query.size)
      .limit(query.size)
      .getRawMany();
    
    console.log(resp)
    return new DataListResponseDto(
      resp,
      undefined
    );
  }

  async findByTaxId(taxId: string): Promise<Company | undefined> {
    const companies = await this.companyRepo.find({
      where: {
        taxId: taxId,
      },
    });
    return companies && companies.length > 0 ? companies[0] : undefined;
  }

  async findByCompanyId(companyId: number): Promise<Company | undefined> {
    const companies = await this.companyRepo.find({
      where: {
        companyId: companyId,
      },
    });
    return companies && companies.length > 0 ? companies[0] : undefined;
  }

  async findByCompanyIds(req: FindOrganisationQueryDto): Promise<Company[] | undefined> {
    const data: Company[] = []
    for (let i = 0; i < req.companyIds.length; i++){
      const companies = await this.companyRepo.find({
        where: {
          companyId: req.companyIds[i],
        },
      });
      data.push(companies[0])
    }
    return data && data.length > 0 ? data : undefined;
  }

  async findGovByCountry(countryCode: string): Promise<Company | undefined> {
    const companies = await this.companyRepo.find({
      where: {
        country: countryCode,
        companyRole: CompanyRole.GOVERNMENT,
      },
    });
    return companies && companies.length > 0 ? companies[0] : undefined;
  }

  async create(companyDto: OrganisationDto): Promise<Company | undefined> {
    this.logger.verbose("Company create received", companyDto.email);

    return await this.companyRepo.save(companyDto).catch((err: any) => {
      if (err instanceof QueryFailedError) {
        switch (err.driverError.code) {
          case PG_UNIQUE_VIOLATION:
            throw new HttpException(
              "Company tax id already exist",
              HttpStatus.BAD_REQUEST
            );
        }
      }
      return err;
    });
  }

  async update(
    companyUpdateDto: OrganisationUpdateDto,
    abilityCondition: string
  ): Promise<DataResponseDto | undefined> {
    const company = await this.companyRepo
      .createQueryBuilder()
      .where(
        `"companyId" = '${
          companyUpdateDto.companyId
        }' AND ${this.helperService.parseMongoQueryToSQL(abilityCondition)}`
      )
      .getOne();
    if (!company) {
      throw new HttpException(
        "No active company found",
        HttpStatus.BAD_REQUEST
      );
    }

    if (companyUpdateDto.logo) {
    const response: any = await this.helperService.uploadCompanyLogoS3(
      companyUpdateDto.companyId,
      companyUpdateDto.logo
    );

    if (response.Location) {
      companyUpdateDto.logo = response.Location;
    } else {
      throw new HttpException(
        "Company update failed. Please try again",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      }
    }

    const { companyId, ...companyUpdateFields } = companyUpdateDto;
    const result = await this.companyRepo
      .update(
        {
          companyId: company.companyId,
        },
        companyUpdateFields
      )
      .catch((err: any) => {
        this.logger.error(err);
        return err;
      });

    if (result.affected > 0) {
      return new DataResponseDto(
        HttpStatus.OK,
        await this.findByCompanyId(company.companyId)
      );
    }

    throw new HttpException(
      "Company update failed. Please try again",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  async companyTransferCancel(companyId: number, remark: string) {
    await this.programmeTransferRepo
      .createQueryBuilder()
      .update(ProgrammeTransfer)
      .set({ status: TransferStatus.CANCELLED, txRef: remark })
      .where(
        "(fromCompanyId = :companyId OR toCompanyId = :companyId) AND status = :status",
        {
          companyId: companyId,
          status: TransferStatus.PENDING,
        }
      )
      .execute()
      .catch((err: any) => {
        this.logger.error(err);
        return err;
      });
  }

  private getUserRefWithRemarks = (user: any, remarks: string) => {
    return `${user.companyId}#${user.companyName}#${user.id}#${remarks}`;
}
}
