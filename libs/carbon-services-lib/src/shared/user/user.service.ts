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
import { UserDto } from "../dto/user.dto";
import {
  Connection,
  EntityManager,
  QueryFailedError,
  Repository,
} from "typeorm";
import { User } from "../entities/user.entity";
import { QueryDto } from "../dto/query.dto";
import { EmailTemplates } from "../email-helper/email.template";
import { PG_UNIQUE_VIOLATION } from "@drdgvhbh/postgres-error-codes";
import { UserUpdateDto } from "../dto/user.update.dto";
import { PasswordUpdateDto } from "../dto/password.update.dto";
import { BasicResponseDto } from "../dto/basic.response.dto";
import { Role } from "../casl/role.enum";
import { nanoid } from "nanoid";
import { API_KEY_SEPARATOR } from "../constants";
import { DataResponseDto } from "../dto/data.response.dto";
import { DataListResponseDto } from "../dto/data.list.response";
import { ConfigService } from "@nestjs/config";
import { CompanyRole } from "../enum/company.role.enum";
import { plainToClass } from "class-transformer";
import { Company } from "../entities/company.entity";
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
import { DataResponseMessageDto } from "../dto/data.response.message";
import { AsyncOperationType } from "../enum/async.operation.type.enum";

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

  async getRoot(): Promise<User | undefined> {
    const users = await this.userRepo.find({
      where: {
        role: Role.Root,
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

    userDto.email = userDto.email?.toLowerCase()

    const { id, ...update } = userDto;
    const user = await this.findById(id);
    if (!user) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("user.noUserFound", []),
        HttpStatus.NOT_FOUND
      );
    }

    const result = await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set(update)
      .where(
        `id = ${id} ${
          abilityCondition
            ? " AND (" +
              this.helperService.parseMongoQueryToSQL(abilityCondition) +
              ")"
            : ""
        }`
      )
      .execute()
      .catch((err: any) => {
        this.logger.error(err);
        return err;
      });
    if (result.affected) {
      return new DataResponseMessageDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString("user.editUserSuccess", []),
        await this.findById(id)
      );
    }
    throw new HttpException(
      this.helperService.formatReqMessagesString("user.userUnAUth", []),
      HttpStatus.FORBIDDEN
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
            ? " AND (" +
              this.helperService.parseMongoQueryToSQL(abilityCondition) + ")"
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
    email = email?.toLowerCase()
    this.logger.verbose("Regenerated api key received", email);
    const user = await this.userRepo
      .createQueryBuilder()
      .where(
        `email = '${email}' ${
          abilityCondition
            ? " AND (" +
              this.helperService.parseMongoQueryToSQL(abilityCondition) + ")"
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

  async createUserWithPassword(
    name: string,
    companyRole: CompanyRole,
    taxId: string,
    password: string,
    email: string,
    userRole: Role,
    phoneNo: string,
    APIkey: string
  ) {
    let company: Company;
    if (companyRole != CompanyRole.GOVERNMENT && companyRole !== CompanyRole.MINISTRY) {
      if (!taxId || taxId === '') {
        throw new HttpException(
          "Tax id cannot be empty:" + email,
          HttpStatus.BAD_REQUEST
        );
      }
      company = await this.companyService.findByTaxId(taxId);
    } else {
      if(companyRole === CompanyRole.GOVERNMENT) {
        company = await this.companyService.findGovByCountry(this.configService.get("systemCountry"))
      } else if(companyRole === CompanyRole.MINISTRY) {
        company = await this.companyService.findMinByCountry(this.configService.get("systemCountry"))
      }
    }

    if (!company) {
      throw new HttpException(
        "Company does not exist" + email,
        HttpStatus.BAD_REQUEST
      );
    }
    const user = new User();
    user.email = email;
    user.password = password;
    user.companyId = company.companyId;
    user.companyRole = company.companyRole;
    user.name = name;
    user.createdTime = new Date().getTime();
    user.country = this.configService.get("systemCountry");
    user.phoneNo = phoneNo;
    user.role = userRole;
    user.apiKey = APIkey;

    console.log("Inserting user", user.email);
    return await this.userRepo
      .createQueryBuilder()
      .insert()
      .values(user)
      .orUpdate(
        ["password", "companyId", "companyRole", "name", "role", "phoneNo"],
        ["email"]
      )
      .execute();
  }

  async create(
    userDto: UserDto,
    companyId: number,
    companyRole: CompanyRole
  ): Promise<User | DataResponseMessageDto | undefined> {
    this.logger.verbose(`User create received  ${userDto.email} ${companyId}`);
    userDto.email = userDto.email?.toLowerCase();
    const createdUserDto = {...userDto};
    if(userDto.company){
      createdUserDto.company={...userDto.company}
    }
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
    if (
      !company &&
      userDto.companyId &&
      companyRole === CompanyRole.GOVERNMENT
    ) {
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
      if (companyRole != CompanyRole.GOVERNMENT && companyRole != CompanyRole.API && companyRole !== CompanyRole.MINISTRY) {
        throw new HttpException(
          this.helperService.formatReqMessagesString("user.userUnAUth", []),
          HttpStatus.FORBIDDEN
        );
      }
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

      if(company.companyRole === CompanyRole.MINISTRY && companyRole === CompanyRole.MINISTRY) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "user.minUserCannotCreateMin",
            []
          ),
          HttpStatus.FORBIDDEN
        );
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
    if (userDto.role == Role.Admin && u.companyRole == CompanyRole.API) {
      u.apiKey = await this.generateApiKey(userDto.email);
    }

    const hostAddress = this.configService.get("host");

    if (company) {
      company.companyId = parseInt(
        await this.counterService.incrementCount(CounterType.COMPANY, 3)
      );
      if (company.logo && this.helperService.isBase64(company.logo)) {
        const response: any = await this.fileHandler.uploadFile(
          `profile_images/${company.companyId}_${new Date().getTime()}.png`,
          company.logo
        );
        if (response) {
          company.logo = response;
          if (process.env.ASYNC_OPERATIONS_TYPE === AsyncOperationType.Queue) {
            createdUserDto.company.logo = response;
          }
        } else {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "user.companyUpdateFailed",
              []
            ),
            HttpStatus.INTERNAL_SERVER_ERROR
          );
        }
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
      address: this.configService.get("email.adresss"),
      liveChat: this.configService.get("liveChat"),
      helpDoc: "https://nationalcarbonregistrydemo.tawk.help",
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

    // if (company && companyRole !== CompanyRole.API && userFields.role !== Role.Root && company.companyRole !== CompanyRole.API) {
    //   const registryCompanyCreateAction: AsyncAction = {
    //     actionType: AsyncActionType.RegistryCompanyCreate,
    //     actionProps: createdUserDto,
    //   };
    //   await this.asyncOperationsInterface.AddAction(
    //     registryCompanyCreateAction
    //   );
    // }

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
                      ? this.helperService.formatReqMessagesString(
                          "user.orgEmailExist",
                          []
                        )
                      : "Email already exist"
                  }`,
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

    const response = new DataResponseMessageDto(
      HttpStatus.CREATED,
      this.helperService.formatReqMessagesString("user.createUserSuccess", []),
      resp
    );

    return response;
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
        HttpStatus.FORBIDDEN
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
