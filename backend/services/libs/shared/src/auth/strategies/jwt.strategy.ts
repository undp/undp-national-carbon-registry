import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { plainToClass } from "class-transformer";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JWTPayload } from "../../dto/jwt.payload";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService, private logger: Logger) {
    const secret = configService.get<string>("jwt.userSecret");
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    const jwtPayload: JWTPayload = plainToClass(JWTPayload, payload);
    return {
      id: jwtPayload.sub,
      companyName: jwtPayload.cn,
      role: jwtPayload.r,
      companyId: jwtPayload.cid,
      companyRole: jwtPayload.cr,
      name: jwtPayload.n,
      companyState: jwtPayload.s,
    };
  }
}
