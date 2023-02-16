import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer = require('nodemailer');

@Injectable()
export class EmailService {

    private transporter;
    private CHAR_SET: 'UTF-8';

    private sourceEmail: string;

    constructor(private logger: Logger, private configService: ConfigService) {
        this.sourceEmail = this.configService.get<string>("email.source")
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

    private getTemplateMessage(template: string, data) :string{
        if (template == undefined) {
            return template;
        }
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                var find = `{{${key}}}`;
                var re = new RegExp(find, 'g');
                template = template.replace(re, data[key]);
            }
        }

        return template;
    }

    public async sendEmail(sendToEmail: string, template, templateData: any): Promise<any> {
        this.logger.log('Sending email', JSON.stringify(sendToEmail))
        // this.configService.get('stage') != 'local' && !sendToEmail.endsWith(this.configService.get<string>('email.skipSuffix'))
        if (sendToEmail && sendToEmail.endsWith('@undp.org')) {
            return new Promise((resolve, reject) => {
                this.transporter.sendMail({
                    from: this.sourceEmail,
                    to: sendToEmail,
                    subject: this.getTemplateMessage(template["subject"], templateData),
                    text: this.getTemplateMessage(template["text"], templateData), // plain text body
                    html: this.getTemplateMessage(template["html"], templateData), // html body
                }, function(error, info) {
                    if (error) {
                        console.log(error);
                        reject(error)
                    } else {
                        console.log('Email sent: ' + info);
                        resolve(info)
                    }
                });
            })
        } else {
            this.logger.log('Skipped email due to local email', sendToEmail);
        }
    }
}
