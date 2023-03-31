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
import { BasicResponseDto } from "../dto/basic.response.dto";
import { Repository } from "typeorm";
import { PasswordReset } from "../entities/userPasswordResetToken.entity";
import { PasswordResetService } from "../util/passwordReset.service";
import { AsyncAction, AsyncOperationsInterface } from "../async-operations/async-operations.interface";
import { AsyncActionType } from "../enum/async.action.type.enum";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly companyService: CompanyService,
    private readonly jwtService: JwtService,
    private configService: ConfigService,
    private helperService: HelperService,
    private passwordReset: PasswordResetService,
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
      const requestId = this.helperService.generateRandomPassword();
      const date = Date.now();
      const expireDate = date + 3600 * 1000; // 1 hout expire time
      const passwordResetD = {
        email: email,
        token: requestId,
        expireTime: expireDate,
      };
      await this.passwordReset.deletePasswordResetD(email);
      await this.passwordReset.insertPasswordResetD(passwordResetD);

      const templateData = {
        name: userDetails.name,
        requestId: requestId,
        countryName: this.configService.get("systemCountryName"),
      };

      const action: AsyncAction = {
        actionType: AsyncActionType.Email,
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

      await this.asyncOperationsInterface.AddAction(action);

      return new BasicResponseDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString("user.resetEmailSent", [])
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