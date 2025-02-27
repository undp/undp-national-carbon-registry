import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "crypto";

@Injectable()
export class PasswordHashService {
    constructor(
        private configService: ConfigService
    ) { }

    getPasswordHash(password) {
        let encodedPassword = password;
        const encodePassword = this.configService.get("jwt.encodePassword");
        if (encodePassword === 'true') {
            encodedPassword = createHash('sha256').update(password).digest('hex');
        }

        return encodedPassword;
    }
}