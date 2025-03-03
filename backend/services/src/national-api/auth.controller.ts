import {
  Controller,
  Post,
  Request,
  Body,
  Put,
  Query,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "@app/shared/auth/auth.service";
import { ForgotPasswordDto } from "@app/shared/dto/forgotPassword.dto";
import { LoginDto } from "@app/shared/dto/login.dto";
import { PasswordResetDto } from "@app/shared/dto/passwordReset.dto";
import { HelperService } from "@app/shared/util/helpers.service";
import { PasswordResetService } from "@app/shared/util/passwordReset.service";
import { RefreshLoginDto } from "@app/shared/dto/refreshLogin.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
    private helperService: HelperService
  ) {}

  @Post("login")
  async login(@Body() login: LoginDto, @Request() req) {
    const user = await this.authService.validateUser(
      login.username,
      login.password
    );
    if (user != null) {
      global.baseUrl = `${req.protocol}://${req.get("Host")}`;
      return this.authService.login(user);
    }
    throw new HttpException(
      this.helperService.formatReqMessagesString("common.invalidLogin", []),
      HttpStatus.UNAUTHORIZED
    );
  }

  @Post("login/refresh")
  async refreshLogin(@Body() refreshLogin: RefreshLoginDto, @Request() req) {
    global.baseUrl = `${req.protocol}://${req.get("Host")}`;
    return this.authService.refreshToken(refreshLogin.refreshToken);
  }

  @Post("forgotPassword")
  async forgotPassword(
    @Body() forgotPassword: ForgotPasswordDto,
    @Request() req
  ) {
    const email = forgotPassword.email;
    if (email !== null) {
      return this.authService.forgotPassword(email);
    }
  }

  @Put("resetPassword")
  async resetPassword(
    @Query("requestId") reqId: string,
    @Body() reset: PasswordResetDto,
    @Request() req
  ) {
    return this.passwordResetService.resetPassword(
      reqId,
      reset,
      req.abilityCondition
    );
  }

  @Put("checkResetRequestId")
  async checkResetRequestId(@Query("requestId") reqId: string, @Request() req) {
    return this.passwordResetService.checkPasswordResetRequestId(
      reqId,
      req.abilityCondition
    );
  }
}
