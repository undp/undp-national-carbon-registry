import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";

@Injectable()
export class PasswordHashService {
  constructor(private configService: ConfigService) {}

  getPasswordHash(password) {
    let encodedPassword = password;
    const encodePassword = this.configService.get("jwt.encodePassword");
    if (encodePassword === "true") {
      const saltRounds = this.configService.get<number>("jwt.saltRounds");
      encodedPassword = bcrypt.hashSync(password, saltRounds);
    }

    return encodedPassword;
  }
}
