import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer = require("nodemailer");

@Injectable()
export class EmailService {
  private transporter;
  private CHAR_SET: "UTF-8";

  private sourceEmail: string;
  private emailDisabled: boolean;

  constructor(private logger: Logger, private configService: ConfigService) {
    this.sourceEmail = this.configService.get<string>("email.source");
    this.emailDisabled = this.configService.get<boolean>("email.disabled");

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>("email.endpoint"),
      port: 465,
      secure: true,
      auth: {
        user: this.configService.get<string>("email.username"),
        pass: this.configService.get<string>("email.password"),
      },
      // pool: true,
      // maxMessages : 14
    });
  }

  async sendEmail(emailDataObj: any): Promise<any> {
    if (emailDataObj?.sender && !this.emailDisabled) {
      return new Promise((resolve, reject) => {
        this.transporter.sendMail(
          {
            from: this.sourceEmail,
            to: emailDataObj?.sender,
            cc: emailDataObj?.cc,
            subject: emailDataObj?.subject,
            text: emailDataObj?.emailBody,
            html: emailDataObj?.emailBody,
            attachments: emailDataObj?.attachments
          },
          function (error, info) {
            console.log('SendEmail Response', error, info);
            if (error) {
              reject(error);
            } else {
              resolve(info);
            }
          }
        );
      });
    }
  }
}
