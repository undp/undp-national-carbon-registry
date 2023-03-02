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
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";
import { LoginDto } from "../shared/dto/login.dto";
import { AuthService } from "../shared/auth/auth.service";
import { JwtAuthGuard } from "../shared/auth/guards/jwt-auth.guard";
import { LocalAuthGuard } from "../shared/auth/guards/local-auth.guard";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(@Body() login: LoginDto) {
    const user = await this.authService.validateUser(
      login.username,
      login.password
    );
    if (user != null) {
      return this.authService.login(user);
    }
    throw new UnauthorizedException();
  }
}
