import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { HeaderAPIKeyStrategy } from "passport-headerapikey";
import { AuthService } from "../auth.service";

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy, "api-key") {
  constructor(private authService: AuthService) {
    const headerKeyApiKey = "api_key";

    super({ header: headerKeyApiKey, prefix: "" }, true, async (apiKey, done) => {
      const user = this.authService.validateApiKey(apiKey);
      if (user) {
        done(null, user);
      }
      done(new UnauthorizedException(), null);
    });
  }
}
