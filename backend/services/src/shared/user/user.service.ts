import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UseFilters,
} from "@nestjs/common";
import {
  InjectConnection,
  InjectEntityManager,
  InjectRepository,
} from "@nestjs/typeorm";
import { UserDto } from "../../shared/dto/user.dto";
import {
  Connection,
  EntityManager,
  QueryFailedError,
  Repository,
} from "typeorm";
import { User } from "../../shared/entities/user.entity";
import { QueryDto } from "../../shared/dto/query.dto";
import { EmailTemplates } from "../email-helper/email.template";
import { PG_UNIQUE_VIOLATION } from "@drdgvhbh/postgres-error-codes";
import { UserUpdateDto } from "../../shared/dto/user.update.dto";
import { PasswordUpdateDto } from "../../shared/dto/password.update.dto";
import { BasicResponseDto } from "../../shared/dto/basic.response.dto";
import { Role } from "../../shared/casl/role.enum";
import { nanoid } from "nanoid";
import { API_KEY_SEPARATOR } from "../../shared/constants";
import { DataResponseDto } from "../../shared/dto/data.response.dto";
import { DataListResponseDto } from "../../shared/dto/data.list.response";
import { ConfigService } from "@nestjs/config";
import { CompanyRole } from "../../shared/enum/company.role.enum";
import { plainToClass } from "class-transformer";
import { Company } from "../../shared/entities/company.entity";
import { CompanyService } from "../company/company.service";
import { HelperService } from "../util/helpers.service";
import { CounterService } from "../util/counter.service";
import { CounterType } from "../util/counter.type.enum";
import { FileHandlerInterface } from "../file-handler/filehandler.interface";
import { CountryService } from "../util/country.service";
import {
  AsyncAction,
  AsyncOperationsInterface,
} from "../async-operations/async-operations.interface";
import { AsyncActionType } from "../enum/async.action.type.enum";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private logger: Logger,
    private configService: ConfigService,
    private helperService: HelperService,
    @InjectEntityManager() private entityManger: EntityManager,
    @Inject(forwardRef(() => CompanyService))
    private companyService: CompanyService,
    private counterService: CounterService,
    private countryService: CountryService,
    private fileHandler: FileHandlerInterface,
    private asyncOperationsInterface: AsyncOperationsInterface
  ) {}

  private async generateApiKey(email) {
    return Buffer.from(
      `${email}${API_KEY_SEPARATOR}${await nanoid()}`
    ).toString("base64");
  }

  async getAdminUserDetails(companyId) {
    const result = await this.userRepo.find({
      where: {
        role: Role.Admin,
        companyId: parseInt(companyId),
      },
    });

    return result;
  }

  async getUserCredentials(username: string): Promise<User | undefined> {
    const users = await this.userRepo.find({
      select: [
        "id",
        "email",
        "password",
        "role",
        "apiKey",
        "companyId",
        "companyRole",
        "name",
      ],
      where: {
        email: username,
      },
    });
    return users && users.length > 0 ? users[0] : undefined;
  }

  async findOne(username: string): Promise<User | undefined> {
    const users = await this.userRepo.find({
      where: {
        email: username,
      },
    });
    return users && users.length > 0 ? users[0] : undefined;
  }

  async getUserProfileDetails(id: number) {
    const userProfileDetails = await this.findById(id);
    const organisationDetails = await this.companyService.findByCompanyId(
      userProfileDetails.companyId
    );
    return {
      user: userProfileDetails,
      Organisation: organisationDetails,
    };
  }

  async findById(id: number): Promise<User | undefined> {
    return await this.userRepo.findOneBy({
      id: id,
    });
  }

  async update(
    userDto: UserUpdateDto,
    abilityCondition: string
  ): Promise<DataResponseDto | undefined> {
    this.logger.verbose("User update received", abilityCondition);
    const { id, ...update } = userDto;

    const sql = await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set(update)
      .where(
        `id = ${id} ${
          abilityCondition
            ? " AND " +
              this.helperService.parseMongoQueryToSQL(abilityCondition)
            : ""
        }`
      )
      .getSql();

    console.log("sql user update --- ", sql);
    // .catch((err: any) => {
    //   this.logger.error(err);
    //   return err;
    // });

    const result = await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set(update)
      .where(
        `id = ${id} ${
          abilityCondition
            ? " AND " +
              this.helperService.parseMongoQueryToSQL(abilityCondition)
            : ""
        }`
      )
      .execute()
      .catch((err: any) => {
        this.logger.error(err);
        return err;
      });
    if (result.affected) {
      return new DataResponseDto(HttpStatus.OK, await this.findById(id));
    }
    throw new HttpException(
      this.helperService.formatReqMessagesString("user.userUnAUth", []),
      HttpStatus.NOT_FOUND
    );
  }

  async resetPassword(
    id: number,
    passwordResetDto: PasswordUpdateDto,
    abilityCondition: string
  ) {
    this.logger.verbose("User password reset received", id);

    const user = await this.userRepo
      .createQueryBuilder()
      .where(
        `id = '${id}' ${
          abilityCondition
            ? " AND " +
              this.helperService.parseMongoQueryToSQL(abilityCondition)
            : ""
        }`
      )
      .addSelect(["User.password"])
      .getOne();
    if (!user || user.password != passwordResetDto.oldPassword) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "user.oldPasswordIncorrect",
          []
        ),
        HttpStatus.UNAUTHORIZED
      );
    }
    const result = await this.userRepo
      .update(
        {
          id: id,
        },
        {
          password: passwordResetDto.newPassword,
        }
      )
      .catch((err: any) => {
        this.logger.error(err);
        return err;
      });
    if (result.affected > 0) {
      const templateData = {
        name: user.name,
        countryName: this.configService.get("systemCountryName"),
      };
      const action: AsyncAction = {
        actionType: AsyncActionType.Email,
        actionProps: {
          emailType: EmailTemplates.CHANGE_PASSOWRD.id,
          sender: user.email,
          subject: this.helperService.getEmailTemplateMessage(
            EmailTemplates.CHANGE_PASSOWRD["subject"],
            templateData,
            true
          ),
          emailBody: this.helperService.getEmailTemplateMessage(
            EmailTemplates.CHANGE_PASSOWRD["html"],
            templateData,
            false
          ),
        },
      };
      await this.asyncOperationsInterface.AddAction(action);
      return new BasicResponseDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString("user.resetSuccess", [])
      );
    }
    throw new HttpException(
      this.helperService.formatReqMessagesString(
        "user.passwordUpdateFailed",
        []
      ),
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  async regenerateApiKey(email, abilityCondition) {
    this.logger.verbose("Regenerated api key received", email);
    const user = await this.userRepo
      .createQueryBuilder()
      .where(
        `email = '${email}' ${
          abilityCondition
            ? " AND " +
              this.helperService.parseMongoQueryToSQL(abilityCondition)
            : ""
        }`
      )
      .getOne();
    if (!user) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("user.noUserFound", []),
        HttpStatus.UNAUTHORIZED
      );
    }
    const apiKey = await this.generateApiKey(email);
    const result = await this.userRepo
      .update(
        {
          id: user.id,
        },
        {
          apiKey: apiKey,
        }
      )
      .catch((err: any) => {
        this.logger.error(err);
        return err;
      });

    if (result.affected > 0) {
      const templateData = {
        name: user.name,
        apiKey: apiKey,
      };

      const action: AsyncAction = {
        actionType: AsyncActionType.Email,
        actionProps: {
          emailType: EmailTemplates.API_KEY_EMAIL.id,
          sender: user.email,
          subject: this.helperService.getEmailTemplateMessage(
            EmailTemplates.API_KEY_EMAIL["subject"],
            templateData,
            true
          ),
          emailBody: this.helperService.getEmailTemplateMessage(
            EmailTemplates.API_KEY_EMAIL["html"],
            templateData,
            false
          ),
        },
      };
      await this.asyncOperationsInterface.AddAction(action);

      return new BasicResponseDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString("user.resetSuccess", [])
      );
    }
    throw new HttpException(
      this.helperService.formatReqMessagesString(
        "user.passwordUpdateFailed",
        []
      ),
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  async create(
    userDto: UserDto,
    companyId: number,
    companyRole: CompanyRole
  ): Promise<User | undefined> {
    this.logger.verbose(`User create received  ${userDto.email} ${companyId}`);
    const user = await this.findOne(userDto.email);
    if (user) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "user.createExistingUser",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    let { company, ...userFields } = userDto;
    if (!company && userDto.companyId) {
      const adminUserdetails = await this.getAdminUserDetails(
        userDto.companyId
      );
      if (adminUserdetails?.length > 0) {
        throw new HttpException(
          this.helperService.formatReqMessagesString("user.userUnAUth", []),
          HttpStatus.FORBIDDEN
        );
      }
    }
    if (company) {
      if (
        userFields.role &&
        ![Role.Admin, Role.Root].includes(userFields.role)
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "user.companyCreateUserShouldbeAdmin",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      } else if (!userFields.role) {
        userFields.role = Role.Admin;
      }

      if (company.companyRole != CompanyRole.CERTIFIER || !company.country) {
        company.country = this.configService.get("systemCountry");
      }

      console.log(
        "Company Log",
        company,
        this.configService.get("systemCountry")
      );

      if (company.companyRole == CompanyRole.GOVERNMENT) {
        const companyGov = await this.companyService.findGovByCountry(
          company.country
        );
        if (companyGov) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "user.governmentUserAlreadyExist",
              [company.country]
            ),
            HttpStatus.BAD_REQUEST
          );
        }
      }

      if (companyRole != CompanyRole.GOVERNMENT) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "user.companyCreateNotPermittedForTheCompanyRole",
            []
          ),
          HttpStatus.FORBIDDEN
        );
      }

      company.createdTime = new Date().getTime();
    }

    if (
      CompanyRole.GOVERNMENT != companyRole &&
      userDto.companyId &&
      userDto.companyId != companyId
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("user.userUnAUth", []),
        HttpStatus.FORBIDDEN
      );
    }

    const u: User = plainToClass(User, userFields);
    if (userDto.company) {
      u.companyRole = userDto.company.companyRole;
    } else if (u.companyId) {
      const company = await this.companyService.findByCompanyId(u.companyId);
      if (!company) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "user.addUserToUnRegisteredCompany",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      u.companyRole = company.companyRole;
    } else {
      u.companyId = companyId;
      u.companyRole = companyRole;
    }

    if (u.companyRole != CompanyRole.CERTIFIER || !u.country) {
      u.country = this.configService.get("systemCountry");
    }

    u.password = this.helperService.generateRandomPassword();
    if (userDto.role == Role.Admin && u.companyRole == CompanyRole.MRV) {
      u.apiKey = await this.generateApiKey(userDto.email);
    }

    const hostAddress = this.configService.get("host");

    if (company) {
      company.companyId = parseInt(
        await this.counterService.incrementCount(CounterType.COMPANY, 3)
      );
      const response: any = await this.fileHandler.uploadFile(
        `profile_images/${company.companyId}_${new Date().getTime()}.png`,
        company.logo
      );
      if (response) {
        company.logo = response;
      } else {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "user.companyUpdateFailed",
            []
          ),
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      if (!company.hasOwnProperty("website")) {
        company["website"] = "";
      }

      if (company.email) {
        const templateData = {
          organisationName: company.name,
          countryName: this.configService.get("systemCountryName"),
          organisationRole:
            company.companyRole === CompanyRole.PROGRAMME_DEVELOPER
              ? "Programme Developer"
              : company.companyRole,
          home: hostAddress,
        };

        const action: AsyncAction = {
          actionType: AsyncActionType.Email,
          actionProps: {
            emailType: EmailTemplates.ORGANISATION_CREATE.id,
            sender: company.email,
            subject: this.helperService.getEmailTemplateMessage(
              EmailTemplates.ORGANISATION_CREATE["subject"],
              templateData,
              true
            ),
            emailBody: this.helperService.getEmailTemplateMessage(
              EmailTemplates.ORGANISATION_CREATE["html"],
              templateData,
              false
            ),
          },
        };
        await this.asyncOperationsInterface.AddAction(action);
      }
    }

    const templateData = {
      name: u.name,
      countryName: this.configService.get("systemCountryName"),
      tempPassword: u.password,
      home: hostAddress,
      email: u.email,
      liveChat: this.configService.get("liveChat"),
      helpDoc: hostAddress + "/help",
    };

    const action: AsyncAction = {
      actionType: AsyncActionType.Email,
      actionProps: {
        emailType: EmailTemplates.USER_CREATE.id,
        sender: u.email,
        subject: this.helperService.getEmailTemplateMessage(
          EmailTemplates.USER_CREATE["subject"],
          templateData,
          true
        ),
        emailBody: this.helperService.getEmailTemplateMessage(
          EmailTemplates.USER_CREATE["html"],
          templateData,
          false
        ),
      },
    };
    await this.asyncOperationsInterface.AddAction(action);

    u.createdTime = new Date().getTime();

    const usr = await this.entityManger
      .transaction(async (em) => {
        if (company) {
          const c: Company = await em.save<Company>(
            plainToClass(Company, company)
          );
          u.companyId = c.companyId;
          u.companyRole = company.companyRole;
        }
        const user = await em.save<User>(u);
        return user;
      })
      .catch((err: any) => {
        console.log(err);
        if (err instanceof QueryFailedError) {
          console.log(err);
          switch (err.driverError.code) {
            case PG_UNIQUE_VIOLATION:
              if (err.driverError.detail.includes("email")) {
                throw new HttpException(
                  `${
                    err.driverError.table == "company"
                      ? "Company email"
                      : "Email"
                  } already exist`,
                  HttpStatus.BAD_REQUEST
                );
              } else if (err.driverError.detail.includes("taxId")) {
                throw new HttpException(
                  this.helperService.formatReqMessagesString(
                    "user.taxIdExistAlready",
                    []
                  ),
                  HttpStatus.BAD_REQUEST
                );
              }
          }
          this.logger.error(`User add error ${err}`);
        } else {
          this.logger.error(`User add error ${err}`);
        }
        return err;
      });

    const { apiKey, password, ...resp } = usr;

    return resp;
  }

  async query(query: QueryDto, abilityCondition: string): Promise<any> {
    const resp = await this.userRepo
      .createQueryBuilder("user")
      .where(
        this.helperService.generateWhereSQL(
          query,
          this.helperService.parseMongoQueryToSQLWithTable(
            '"user"',
            abilityCondition
          ),
          '"user"'
        )
      )
      .leftJoinAndMapOne(
        "user.company",
        Company,
        "company",
        "company.companyId = user.companyId"
      )
      .orderBy(
        query?.sort?.key ? `"user"."${query?.sort?.key}"` : `"user"."id"`,
        query?.sort?.order ? query?.sort?.order : "DESC"
      )
      .offset(query.size * query.page - query.size)
      .limit(query.size)
      .getManyAndCount();

    return new DataListResponseDto(
      resp.length > 0 ? resp[0] : undefined,
      resp.length > 1 ? resp[1] : undefined
    );
  }

  async delete(userId: number, ability: string): Promise<BasicResponseDto> {
    this.logger.verbose(
      this.helperService.formatReqMessagesString("user.noUserFound", []),
      userId
    );

    const result = await this.userRepo
      .createQueryBuilder()
      .where(
        `id = '${userId}' ${
          ability
            ? ` AND (${this.helperService.parseMongoQueryToSQL(ability)})`
            : ""
        }`
      )
      .getMany();
    if (result.length <= 0) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("user.userUnAUth", []),
        HttpStatus.NOT_FOUND
      );
    }

    if (result[0].role == Role.Root) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("user.rootUserDelete", []),
        HttpStatus.FORBIDDEN
      );
    } else if (result[0].role == Role.Admin) {
      const admins = await this.userRepo
        .createQueryBuilder()
        .where(
          `"companyId" = '${result[0].companyId}' and role = '${Role.Admin}'`
        )
        .getMany();
      if (admins.length <= 1) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "user.deleteOneAdminWhenOnlyOneAdmin",
            []
          ),
          HttpStatus.FORBIDDEN
        );
      }
    }

    const result2 = await this.userRepo.delete({ id: userId });
    if (result2.affected > 0) {
      return new BasicResponseDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString("user.deleteUserSuccess", [])
      );
    }
    throw new HttpException(
      this.helperService.formatReqMessagesString("user.userDeletionFailed", []),
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  async getGovAdminAndManagerUsers() {
    const result = await this.userRepo
      .createQueryBuilder("user")
      .where("user.role in (:admin, :manager)", {
        admin: Role.Admin,
        manager: Role.Manager,
      })
      .andWhere("user.companyRole= :companyRole", {
        companyRole: CompanyRole.GOVERNMENT,
      })
      .select(["user.name", "user.email"])
      .getRawMany();

    return result;

    //return result.map((item) => {return item.user_email});
  }

  async getOrganisationAdminAndManagerUsers(organisationId) {
    const result = await this.userRepo
      .createQueryBuilder("user")
      .where("user.role in (:admin,:manager)", {
        admin: Role.Admin,
        manager: Role.Manager,
      })
      .andWhere("user.companyId= :companyId", { companyId: organisationId })
      .select(["user.name", "user.email"])
      .getRawMany();

    return result;
  }
}
