import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AsyncOperationsInterface } from "./async-operations-interface.service";
import nodemailer = require('nodemailer');

@Injectable()
export class AsyncOperationsQueueService implements AsyncOperationsInterface {
    private transporter;
    private CHAR_SET: 'UTF-8';
    private sourceEmail: string;
    
    constructor(private logger: Logger, private configService: ConfigService){
        console.log('d1 AsyncOperationsQueueService constructor');
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

    sendEmail(event): Promise<any> {
        console.log('d1 AsyncOperationsQueueService', event);
        return ;
    }
}