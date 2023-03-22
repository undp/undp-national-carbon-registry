import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer = require("nodemailer");

@Injectable()
export class AsyncOperationsService {
  private transporter;
  private CHAR_SET: "UTF-8";
  private sourceEmail: string;

  constructor(private logger: Logger, private configService: ConfigService) {
    this.sourceEmail = this.configService.get<string>("email.source");
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>("email.endpoint"),
      port: 465,
      secure: true,
      auth: {
        user: this.configService.get<string>("email.username"),
        pass: this.configService.get<string>("email.password"),
      },
    });
  }

  async sendEmail(emailDataObj: any): Promise<any> {
    if (emailDataObj?.sender) {
      return new Promise((resolve, reject) => {
        this.transporter.sendMail(
          {
            from: this.sourceEmail,
            to: emailDataObj?.sender,
            subject: emailDataObj?.subject,
            text: emailDataObj?.emailBody,
            html: emailDataObj?.emailBody,
          },
          function (error, info) {
            if (error) {
              console.log("error", error);
              reject(error);
            } else {
              console.log("Email sent: " + info);
              resolve(info);
            }
          }
        );
      });
    }

    return;
  }
}
