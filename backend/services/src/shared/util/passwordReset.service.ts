import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DataListResponseDto } from "../dto/data.list.response";
import { QueryDto } from "../dto/query.dto";
import { Country } from "../entities/country.entity";
import { HelperService } from "./helpers.service";
import { PasswordReset } from "../entities/userPasswordResetToken.entity";
import { PasswordResetDto } from "../dto/passwordReset.dto";
import { User } from "../entities/user.entity";
import { BasicResponseDto } from "../dto/basic.response.dto";
import { EmailService } from "../email/email.service";
import { EmailTemplates } from "../email/email.template";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(PasswordReset)
    private passwordResetRepo: Repository<PasswordReset>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private helperService: HelperService,
    private emailService: EmailService,
    private configService: ConfigService,
    private logger: Logger
  ) {}

  async insertPasswordResetD(passwordResetD) {
    await this.passwordResetRepo.save(passwordResetD);
  }

  async deletePasswordResetD(email) {
    await this.passwordResetRepo.delete({ email: email });
  }

  async resetPassword(
    reqId: string,
    passwordResetDto: PasswordResetDto,
    abilityCondition: string
  ) {
    const passwordResetD = await this.passwordResetRepo.findBy({
      token: reqId,
    });
    console.log("passwordResetD --- > ", passwordResetD);
    if (!(passwordResetD.length > 0)) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "user.resetPasswordReqNotFound",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    const currentDate = Date.now();
    const tokenExpiryTime = passwordResetD[0].expireTime;
    const id = passwordResetD[0].id;
    const email = passwordResetD[0].email;
    const userD = await this.userRepo.findBy({
      email: email,
    });
    if (!(userD.length > 0)) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("user.noUserFound", []),
        HttpStatus.EXPECTATION_FAILED
      );
    }
    const userId = userD[0].id;
    const userName = userD[0].name;
    if (currentDate > tokenExpiryTime) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "user.resetPasswordReqExpired",
          []
        ),
        HttpStatus.EXPECTATION_FAILED
      );
    }
    const result = await this.userRepo
      .update(
        {
          id: userId,
        },
        {
          password: passwordResetDto.newPassword,
        }
      )
      .catch((err: any) => {
        this.logger.error(err);
        return err;
      });
    if (result.affected > 0) {
      await this.emailService.sendEmail(email, EmailTemplates.CHANGE_PASSOWRD, {
        name: userName,
        countryName: this.configService.get("systemCountryName"),
      });
      this.passwordResetRepo.delete({ email: email });
      return new BasicResponseDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString("user.resetSuccess", [])
      );
    }
  }

  async checkPasswordResetRequestId(reqId: string, abilityCondition: string) {
    const passwordResetD = await this.passwordResetRepo.findBy({
      token: reqId,
    });
    if (!(passwordResetD.length > 0)) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "user.resetPasswordReqNotFound",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    return new BasicResponseDto(
      HttpStatus.OK,
      this.helperService.formatReqMessagesString("user.reqIdFound", [])
    );
  }
}
