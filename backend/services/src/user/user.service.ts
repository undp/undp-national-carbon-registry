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
import { LocationInterface } from "../location/location.interface";
import { CompanyState } from "../enum/company.state.enum";
import { OrganisationDto } from "../dto/organisation.dto";
import { PasswordHashService } from "../util/passwordHash.service";
import { DataExportService } from "../util/data.export.service";
import { DataExportQueryDto } from "../dto/data.export.query.dto";
import { DataExportUserDto } from "../dto/data.export.user.dto";
import { FilterEntry } from "../dto/filter.entry";
import { EmailHelperService } from '../email-helper/email-helper.service';
import { HttpUtilService } from "../util/http.util.service";
import { SYSTEM_TYPE } from "../enum/system.names.enum";
import { GovDepartment, ministryOrgs } from "../enum/govDep.enum";
import { Ministry } from "../enum/ministry.enum";

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
    @Inject(forwardRef(() => EmailHelperService))
    private emailHelperService: EmailHelperService,
    private counterService: CounterService,
    private countryService: CountryService,
    private fileHandler: FileHandlerInterface,
    private asyncOperationsInterface: AsyncOperationsInterface,
    private locationService: LocationInterface,
    private passwordHashService: PasswordHashService,
    private dataExportService: DataExportService,
    private httpUtilService: HttpUtilService
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
        "isPending"
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
    
    passwordResetDto.oldPassword = this.passwordHashService.getPasswordHash(passwordResetDto.oldPassword);
    passwordResetDto.newPassword = this.passwordHashService.getPasswordHash(passwordResetDto.newPassword);
    
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

  async approveUser(
    company: Company
  ) {
    this.logger.verbose("User approve request received for company", company.companyId);

    const generatedPassword = this.helperService.generateRandomPassword();
    const hostAddress = this.configService.get("host");
    let users;
    try{
      users = await this.getPendingOrganisationAdminUsers(company.companyId);
  
      for (const user of users) {
        const result = await this.userRepo
        .update(
          {
            id: user.user_id,
          },
          {
            isPending: false,
            password: this.passwordHashService.getPasswordHash(generatedPassword),
          }
        ).catch((err: any) => {
          this.logger.error(err);
          return err;
        });
        if (result.affected > 0) {
          const templateData = {
            name: user.user_name,
            countryName: this.configService.get("systemCountryName"),
            systemName: this.configService.get("systemName"),
            tempPassword: generatedPassword,
            home: hostAddress,
            email: user.user_email,
            address: this.configService.get("email.adresss"),
            liveChat: this.configService.get("liveChat"),
            helpDoc: hostAddress +`/help`,
          };
          const action: AsyncAction = {
            actionType: AsyncActionType.Email,
            actionProps: {
              emailType: EmailTemplates.USER_CREATE.id,
              sender: user.user_email,
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

          const userDto = new UserDto();
          userDto.email = user.user_email;
          userDto.role = user.user_role;
          userDto.name = user.user_name;

          const organisationDto = new OrganisationDto();
          organisationDto.taxId = company.taxId;
          organisationDto.paymentId = company.paymentId;
          organisationDto.name = company.name;
          organisationDto.email = company.email;
          organisationDto.phoneNo = company.phoneNo;
          organisationDto.address = company.address;
          organisationDto.logo = company.logo;
          organisationDto.companyRole = company.companyRole;
          organisationDto.regions = company.regions;
          if(company.website && company.website.trim().length>0){
            organisationDto.website = company.website;
          }
          userDto.company = organisationDto;

          if (company && user.user_role !== Role.Root && company.companyRole !== CompanyRole.API) {
            const registryCompanyCreateAction: AsyncAction = {
              actionType: AsyncActionType.RegistryCompanyCreate,
              actionProps: userDto,
            };
            await this.asyncOperationsInterface.AddAction(
              registryCompanyCreateAction
            );
          }
        }
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "user.approvalFailed",
            []
          ),
          HttpStatus.INTERNAL_SERVER_ERROR
        );

      }
      return users;
    } catch (err) {
      this.logger.error(err);
      return err;
    }

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

  async validateAndCreateUser(
    userDto: UserDto,
    companyId: number,
    companyRole: CompanyRole,
    isRegistration?: boolean
  ): Promise<User | DataResponseMessageDto | undefined> {

    this.logger.verbose(`User received for validation ${userDto.email} ${companyId}`);
    userDto.email = userDto.email?.toLowerCase();
    const createdUserDto = {...userDto};
    if (userDto.company) {
      createdUserDto.company = { ...userDto.company }
      if (this.configService.get('systemType') !== SYSTEM_TYPE.CARBON_UNIFIED) {
        const companyExists = await this.companyService.checkCompanyExistOnOtherSystem({
          taxId: createdUserDto.company?.taxId,
          paymentId: createdUserDto.company?.paymentId,
          email: createdUserDto.company?.email
        })
        if (companyExists) {
          this.handleDuplicateCompanyError(createdUserDto.company, companyExists)
        }
      }
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
    if(this.configService.get('systemType') !== SYSTEM_TYPE.CARBON_UNIFIED){
      const userExists = await this.checkUserExistOnOtherSystem(userDto.email);
      if (userExists) {
        let errorMessage = "user.createExistingUser";
        if (this.configService.get('systemType') == SYSTEM_TYPE.CARBON_TRANSPARENCY) {
          errorMessage = "user.createExistingUserInRegistry";
        } else if (this.configService.get('systemType') == SYSTEM_TYPE.CARBON_REGISTRY) {
          errorMessage = "user.createExistingUserInTransparency";
        }
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            errorMessage,
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
    }

    return await this.create(userDto, companyId, companyRole, isRegistration);
  };

  async create(
    userDto: UserDto,
    companyId: number,
    companyRole: CompanyRole,
    isRegistration?: boolean
  ): Promise<User | DataResponseMessageDto | undefined> {
    this.logger.verbose(`User create received  ${userDto.email} ${companyId}`);
    const isRegistrationValue = isRegistration || false; // Use false as the default value
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
      if (
        company.companyRole == CompanyRole.MINISTRY ||
        company.companyRole == CompanyRole.GOVERNMENT
      ) {
        const ministrykey =
          Object.keys(Ministry)[
            Object.values(Ministry).indexOf(company.ministry as Ministry)
          ];
        if (
          (company.companyRole == CompanyRole.MINISTRY ||
            company.companyRole == CompanyRole.GOVERNMENT) &&
          !ministryOrgs[ministrykey].includes(
            Object.keys(GovDepartment)[
              Object.values(GovDepartment).indexOf(
                company.govDep as GovDepartment,
              )
            ],
          )
        ) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              'user.wrongMinistryAndGovDep',
              [],
            ),
            HttpStatus.BAD_REQUEST,
          );
        }
      }
      if (companyRole != CompanyRole.GOVERNMENT && companyRole != CompanyRole.API && companyRole !== CompanyRole.MINISTRY && !isRegistrationValue) {
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
            "user.userUnAUth",
            []
          ),
          HttpStatus.FORBIDDEN
        );
      }

      if (company.companyRole != CompanyRole.CERTIFIER || !company.country) {
        company.country = this.configService.get("systemCountry");
      }

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

      if (company.companyRole == CompanyRole.MINISTRY) {
        
        company.taxId = "00000"+this.configService.get("systemCountry")+"-"+company.ministry+"-"+company.govDep
        const ministry = await this.companyService.findMinistryByDepartment(
          company.govDep
        );
        if ((company.companyRole == CompanyRole.MINISTRY || company.companyRole == CompanyRole.GOVERNMENT) && ministry && ministry.ministry==company.ministry && ministry.govDep==company.govDep) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "user.MinistryDepartmentAlreadyExist",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }
      }

      const duplicateCompany = await this.companyService.checkForCompanyDuplicates(company.email, company.taxId, company.paymentId);
      if (duplicateCompany) {
        if (duplicateCompany.email === company.email) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "user.orgEmailExist",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        } else if (duplicateCompany.taxId === company.taxId) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "user.taxIdExistAlready",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        } else if (duplicateCompany.paymentId === company.paymentId) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "user.paymentIdExistAlready",
              []
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

    let generatedPassword = this.helperService.generateRandomPassword();
    u.password = this.passwordHashService.getPasswordHash(generatedPassword);

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

      if (company.email && !isRegistrationValue) {
        const templateData = {
          organisationName: company.name,
          countryName: this.configService.get("systemCountryName"),
          systemName: this.configService.get("systemName"),
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

      if(company.regions){
        company.geographicalLocationCordintes = await this.locationService
        .getCoordinatesForRegion(company.regions)
        .then((response: any) => {
          return  [...response];
        });
      }
    }

    if (isRegistrationValue) {
      company.state = CompanyState.PENDING;
      u.isPending = true;

      const hostAddress = this.configService.get("host");
      await this.emailHelperService.sendEmailToGovernmentAdmins(
        EmailTemplates.ORGANISATION_REGISTRATION,
        {
          home: hostAddress,
          organisationName: company.name,
          systemName: this.configService.get("systemName"),
          organisationRole: company.companyRole === CompanyRole.PROGRAMME_DEVELOPER
              ? "Programme Developer"
              : company.companyRole,
          organisationPageLink:
            hostAddress +
            `/companyManagement/viewAll`,
        }, undefined, undefined, undefined, undefined
      );

    } else {
      const templateData = {
        name: u.name,
        countryName: this.configService.get("systemCountryName"),
        systemName: this.configService.get("systemName"),
        tempPassword: generatedPassword,
        home: hostAddress,
        email: u.email,
        address: this.configService.get("email.adresss"),
        liveChat: this.configService.get("liveChat"),
        helpDoc: hostAddress +`/help`,
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

      if (company && companyRole !== CompanyRole.API && userFields.role !== Role.Root && company.companyRole !== CompanyRole.API) {
        const registryCompanyCreateAction: AsyncAction = {
          actionType: AsyncActionType.RegistryCompanyCreate,
          actionProps: createdUserDto,
        };
        await this.asyncOperationsInterface.AddAction(
          registryCompanyCreateAction
        );
      }
    }

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
        if (err instanceof QueryFailedError) {
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
              } else if (err.driverError.detail.includes("paymentId")) {
                throw new HttpException(
                  this.helperService.formatReqMessagesString(
                    "user.paymentIdExistAlready",
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
    
    if (query.filterAnd) {
      if (!query.filterAnd.some(filter => filter.key === "isPending")) {
        query.filterAnd.push({
          key: "isPending",
          operation: "=",
          value: false,
        });
      }
    } else {
      const filterAnd: FilterEntry[] = [];
      filterAnd.push({
        key: "isPending",
        operation: "=",
        value: false,
      });
      query.filterAnd = filterAnd;
    }
    
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

  async download(
    queryData: DataExportQueryDto,
    abilityCondition: string
  ) {

    const queryDto = new QueryDto();
    queryDto.filterAnd = queryData.filterAnd;
    queryDto.filterOr = queryData.filterOr;
    queryDto.sort = queryData.sort;

    if (queryDto.filterAnd) {
      queryDto.filterAnd.push({
          key: "companyRole",
          operation: "!=",
          value: 'API',
        });
      
    } else {
      const filterAnd: FilterEntry[] = [];
      filterAnd.push({
        key: "companyRole",
        operation: "!=",
        value: 'API',
      });
      queryDto.filterAnd = filterAnd;
    }

    const resp = await this.userRepo
      .createQueryBuilder("user")
      .where(
        this.helperService.generateWhereSQL(
          queryDto,
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
      "company.companyId = user.companyId")
      .orderBy(
        queryDto?.sort?.key ? `"user"."${queryDto?.sort?.key}"` : `"user"."id"`,
        queryDto?.sort?.order ? queryDto?.sort?.order : "DESC"
      )
      .getMany();
      
    if (resp.length > 0) {
      const prepData = this.prepareUserDataForExport(resp)

      let headers: string[] = [];
      const titleKeys = Object.keys(prepData[0]);
      for (const key of titleKeys) {
        headers.push(
          this.helperService.formatReqMessagesString(
            "userExport." + key,
            []
          )
        )
      }

      const path = await this.dataExportService.generateCsv(prepData, headers, this.helperService.formatReqMessagesString(
        "userExport.users",
        []
      ));
      return path;
    }
    throw new HttpException(
      this.helperService.formatReqMessagesString(
        "userExport.nothingToExport",
        []
      ),
      HttpStatus.BAD_REQUEST
    );
  }

  private prepareUserDataForExport(users: any) {
    const exportData: DataExportUserDto[] = [];

    for (const user of users) {
      const dto = new DataExportUserDto();
      dto.id = user.id;
      dto.email = user.email;
      dto.role = user.role;
      dto.name = user.name;
      dto.country = user.country;
      dto.phoneNo = user.phoneNo;
      dto.companyId = user.companyId;
      dto.companyName = user.company?.name;
      dto.companyRole = user.companyRole;
      dto.createdTime = this.helperService.formatTimestamp(user.createdTime);
      dto.isPending = user.isPending;
      exportData.push(dto);
    }

    return exportData;
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

  async getGovAdminUsers() {
    const result = await this.userRepo
      .createQueryBuilder("user")
      .where("user.role in (:admin)", {
        admin: Role.Admin,
      })
      .andWhere("user.companyRole= :companyRole", {
        companyRole: CompanyRole.GOVERNMENT,
      })
      .select(["user.name", "user.email"])
      .getRawMany();

    return result;
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

  async getPendingOrganisationAdminUsers(organisationId) {
    const result = await this.userRepo
      .createQueryBuilder("user")
      .where("user.role= :admin", {
        admin: Role.Admin
      })
      .andWhere("user.companyId= :companyId", { companyId: organisationId })
      .andWhere("user.isPending= true")
      .getRawMany();

    return result;
  }

  private async checkUserExistOnOtherSystem(userEmail: string) {
    const resp = await this.httpUtilService.sendHttp("/national/user/exists", {
      "email": userEmail
    });
    if (typeof resp === 'boolean') {
      return resp;
    } else {
      return resp.data;
    }
  }

  public async checkUserExists(email: string) {
    return await this.findOne(email);
  }

  private handleDuplicateCompanyError(newCompany: any, existingCompany: any) {
    let errorMessage = "user.createExistingCompany";

    if (newCompany.taxId === existingCompany.taxId) {
      errorMessage = "user.createExistingCompanyWithTaxIdIn";
    } else if (newCompany.paymentId === existingCompany.paymentId) {
      errorMessage = "user.createExistingCompanyWithPaymentIdIn";
    } else if (newCompany.email === existingCompany.email) {
      errorMessage = "user.createExistingCompanyWithEmailIn";
    }

    if (this.configService.get('systemType') == SYSTEM_TYPE.CARBON_TRANSPARENCY) {
      errorMessage = `${errorMessage}Registry`;
    } else if (this.configService.get('systemType') == SYSTEM_TYPE.CARBON_REGISTRY) {
      errorMessage = `${errorMessage}Transparency`;
    }
    throw new HttpException(
      this.helperService.formatReqMessagesString(
        errorMessage,
        []
      ),
      HttpStatus.BAD_REQUEST
    );
  }
}
