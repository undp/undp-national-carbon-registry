import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Logger,
  Body,
  ValidationPipe,
  UnauthorizedException,
  Req,
  Put,
  Query,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { LoginDto } from "../shared/dto/login.dto";
import { AuthService } from "../shared/auth/auth.service";
import { JwtAuthGuard } from "../shared/auth/guards/jwt-auth.guard";
import { LocalAuthGuard } from "../shared/auth/guards/local-auth.guard";
import { ForgotPasswordDto } from "../shared/dto/forgotPassword.dto";
import { PasswordResetDto } from "../shared/dto/passwordReset.dto";
import { PasswordResetService } from "../shared/util/passwordReset.service";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService
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
    throw new UnauthorizedException();
  }

  @Post("forgotPassword")
  async forgotPassword(
    @Body() forgotPassword: ForgotPasswordDto,
    @Request() req
  ) {
    const email = forgotPassword.email;
    console.log("req ----------- ", req);
    if (email !== null) {
      return this.authService.forgotPassword(email);
    }
  }

  // @CheckPolicies((ability, body) => ability.can(Action.Update, Object.assign(new User(), body)))
  @Put("resetPassword")
  async resetPassword(
    @Query("requestId") reqId: string,
    @Body() reset: PasswordResetDto,
    @Request() req
  ) {
    console.log("req ---- > ", reqId);
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
