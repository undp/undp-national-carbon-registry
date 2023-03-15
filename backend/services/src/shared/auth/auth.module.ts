import { Logger, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { LocalStrategy } from "./strategies/local.strategy";
import { CaslModule } from "../casl/casl.module";
import { ApiKeyStrategy } from "./strategies/apikey.strategy";
import { CompanyModule } from "../company/company.module";
import { UserModule } from "../user/user.module";

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secretOrPrivateKey: configService.get<string>("jwt.userSecret"),
        signOptions: {
          // expiresIn: 3600*2,
          expiresIn: 60 * 15,
        },
      }),
      inject: [ConfigService],
      imports: undefined,
    }),
    CaslModule,
    CompanyModule,
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, ApiKeyStrategy, Logger],
  exports: [AuthService],
})
export class AuthModule {}
