import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { CompanyService } from "../company/company.service";
import { instanceToPlain } from "class-transformer";
import { CaslAbilityFactory } from "../casl/casl-ability.factory";
import { API_KEY_SEPARATOR } from "../constants";
import { JWTPayload } from "../dto/jwt.payload";
import { UserService } from "../user/user.service";
import { HelperService } from "../util/helpers.service";
import { EmailTemplates } from "../email-helper/email.template";
import { ConfigService } from "@nestjs/config";
import { DataResponseDto } from "../dto/data.response.dto";
import { AsyncAction, AsyncOperationsInterface } from "../async-operations/async-operations.interface";
import { asyncActionType } from "../enum/async.action.type.enum";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly companyService: CompanyService,
    private readonly jwtService: JwtService,
    private configService: ConfigService,
    private helperService: HelperService,
    public caslAbilityFactory: CaslAbilityFactory,
    private asyncOperationsInterface: AsyncOperationsInterface,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.userService.getUserCredentials(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async validateApiKey(apiKey: string): Promise<any> {
    const parts = Buffer.from(apiKey, "base64")
      .toString("utf-8")
      .split(API_KEY_SEPARATOR);
    if (parts.length != 2) {
      return null;
    }
    const user = await this.userService.getUserCredentials(parts[0]);
    if (user && user.apiKey === apiKey) {
      const { password, apiKey, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const organisationDetails = await this.companyService.findByCompanyId(
      user.companyId
    );
    const payload = new JWTPayload(
      organisationDetails.name,
      user.name,
      user.id,
      user.role,
      user.companyId,
      user.companyRole,
      parseInt(organisationDetails.state)
    );
    const ability = this.caslAbilityFactory.createForUser(user);
    return {
      access_token: this.jwtService.sign(instanceToPlain(payload)),
      role: user.role,
      id: user.id,
      name: user.name,
      companyId: user.companyId,
      companyRole: user.companyRole,
      companyName: organisationDetails.name,
      companyLogo: organisationDetails.logo,
      ability: JSON.stringify(ability),
      companyState: parseInt(organisationDetails.state),
    };
  }

  async forgotPassword(email: any) {
    const userDetails = await this.userService.findOne(email);
    if (userDetails) {
      console.table(userDetails);

      const templateData = {
        name: userDetails.name,
        countryName: this.configService.get("systemCountryName"),
      };

      const action: AsyncAction = {
        actionType: asyncActionType.Email,
        actionProps: {
          emailType: EmailTemplates.FORGOT_PASSOWRD.id,
          sender: email,
          subject: this.helperService.getEmailTemplateMessage(
            EmailTemplates.FORGOT_PASSOWRD["subject"],
            templateData,
            false
          ),
          emailBody: this.helperService.getEmailTemplateMessage(
            EmailTemplates.FORGOT_PASSOWRD["html"],
            templateData,
            false
          ),
        },
      };

      this.asyncOperationsInterface.AddAction(action);

      return new DataResponseDto(
        HttpStatus.OK,
        "User found, forgot password request success"
      );
    } else {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "user.forgotPwdUserNotFound",
          []
        ),
        HttpStatus.NOT_FOUND
      );
    }
  }
}
