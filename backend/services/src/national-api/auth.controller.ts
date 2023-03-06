import { Controller, Get, Post, UseGuards, Request, Logger, Body, ValidationPipe, UnauthorizedException, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoginDto } from '../shared/dto/login.dto';
import { AuthService } from '../shared/auth/auth.service';
import { JwtAuthGuard } from '../shared/auth/guards/jwt-auth.guard';
import { LocalAuthGuard } from '../shared/auth/guards/local-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) {}

    @Post('login')
    async login(@Body() login: LoginDto, @Request() req) {
      const user = await this.authService.validateUser(login.username, login.password);
      if (user != null) {
        global.baseUrl = `${req.protocol}://${req.get('Host')}`;
        return this.authService.login(user);
      }
      throw new UnauthorizedException();
    }

}
