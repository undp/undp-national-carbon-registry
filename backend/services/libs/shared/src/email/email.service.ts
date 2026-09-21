import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FileHandlerInterface } from "../file-handler/filehandler.interface";
import { resolveStoredFile } from "../file-handler/storage-key";
import nodemailer = require("nodemailer");

@Injectable()
export class EmailService {
  private transporter;
  private CHAR_SET: "UTF-8";

  private sourceEmail: string;
  private emailDisabled: boolean;

  constructor(
    private logger: Logger,
    private configService: ConfigService,
    private fileHandler: FileHandlerInterface
  ) {
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

  /**
   * Attachments are given as `{ filename, path }`, where `path` is whatever the
   * file handler returned or the database held - a storage key for anything
   * written since files became backend-neutral. nodemailer treats `path` as a
   * filesystem path unless it is a URL, so an unresolved key would silently fail
   * to attach. This is the one place every attachment passes through, which is
   * why it resolves here rather than at each of the callers.
   */
  private async resolveAttachments(attachments: any): Promise<any> {
    if (!attachments) {
      return attachments;
    }

    const list = Array.isArray(attachments) ? attachments : [attachments];
    const resolved = await Promise.all(
      list.map(async (attachment) => {
        if (typeof attachment?.path !== "string") {
          return attachment;
        }
        return {
          ...attachment,
          path: await resolveStoredFile(this.fileHandler, attachment.path),
        };
      })
    );

    return Array.isArray(attachments) ? resolved : resolved[0];
  }

  async sendEmail(emailDataObj: any): Promise<any> {
    if (emailDataObj?.sender && !this.emailDisabled) {
      const attachments = await this.resolveAttachments(
        emailDataObj?.attachments
      );
      return new Promise((resolve, reject) => {
        const headers = {};
        const configSet = this.configService.get<string>("email.configSet");
        if (configSet) {
          headers["X-SES-CONFIGURATION-SET"] = configSet;
        }
        this.transporter.sendMail(
          {
            from: this.sourceEmail,
            to: emailDataObj?.sender,
            cc: emailDataObj?.cc,
            subject: emailDataObj?.subject,
            text: emailDataObj?.emailBody,
            html: emailDataObj?.emailBody,
            attachments,
            headers,
          },
          function (error, info) {
            console.log("SendEmail Response", error, info);
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
