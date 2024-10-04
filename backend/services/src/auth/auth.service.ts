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
import { PasswordResetService } from "../util/passwordReset.service";
import {
  AsyncAction,
  AsyncOperationsInterface,
} from "../async-operations/async-operations.interface";
import { AsyncActionType } from "../enum/async.action.type.enum";
import { PasswordHashService } from "../util/passwordHash.service";

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
    private passwordHashService: PasswordHashService
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.userService.getUserCredentials(username?.toLowerCase());
    pass = this.passwordHashService.getPasswordHash(pass);
    if (user && user.password === pass && !user.isPending) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async validateApiKey(apiKey: string): Promise<any> {
    const parts = Buffer.from(apiKey, "base64").toString("utf-8").split(API_KEY_SEPARATOR);
    if (parts.length != 2) {
      return null;
    }
    const user = await this.userService.getUserCredentials(parts[0]?.toLowerCase());
    if (user && user.apiKey === apiKey) {
      const { password, apiKey, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const organisationDetails = await this.companyService.findByCompanyId(user.companyId);
    const payload = new JWTPayload(
      organisationDetails.name,
      user.name,
      user.id,
      user.role,
      user.companyId,
      user.companyRole,
      parseInt(organisationDetails.state)
    );

    const refreshPayload = {
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      companyRole: user.companyRole,
    };

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>("jwt.refreshTokenSecret"),
      expiresIn: this.configService.get<string>("jwt.refreshTokenExpiresIn"),
    });

    const ability = this.caslAbilityFactory.createForUser(user);
    return {
      access_token: this.jwtService.sign(instanceToPlain(payload)),
      refresh_token: refreshToken,
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

  async generateAccessToken(userId: number, companyId: number): Promise<string> {
    const organisationDetails = await this.companyService.findByCompanyId(companyId);

    if (!organisationDetails) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("jwt expired", []),
        HttpStatus.UNAUTHORIZED
      );
    }

    const user = await this.userService.findById(userId);

    if (!user) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("jwt expired", []),
        HttpStatus.UNAUTHORIZED
      );
    }

    const payload = new JWTPayload(
      organisationDetails.name,
      user.name,
      user.id,
      user.role,
      user.companyId,
      user.companyRole,
      parseInt(organisationDetails.state)
    );
    return this.jwtService.sign(instanceToPlain(payload));
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("jwt expired", []),
        HttpStatus.UNAUTHORIZED
      );
    }

    let userId;
    let companyId;

    try {
      // Verify the refresh token
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>("jwt.refreshTokenSecret"),
      });
      userId = decoded.userId;
      companyId = decoded.companyId;
    } catch (err) {
      console.log(
        "Unable to verify the refresh token for userId {}, companyId {} due to {}",
        userId,
        companyId,
        err
      );
      throw new HttpException(
        this.helperService.formatReqMessagesString("jwt expired", []),
        HttpStatus.UNAUTHORIZED
      );
    }

    try {
      // Issue a new access token
      const generatedAccessToken = await this.generateAccessToken(userId, companyId);
      return { access_token: generatedAccessToken };
    } catch (err) {
      console.log("Unable to generate the access token for user {} due to {}", userId, err);
      throw new HttpException(
        this.helperService.formatReqMessagesString("jwt expired", []),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async forgotPassword(email: any) {
    const hostAddress = this.configService.get("host");
    const userDetails = await this.userService.findOne(email);
    if (userDetails && !userDetails.isPending) {
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
        home: hostAddress,
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
            true
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
        this.helperService.formatReqMessagesString("user.forgotPwdUserNotFound", []),
        HttpStatus.NOT_FOUND
      );
    }
  }
}
