import { Injectable, Logger } from "@nestjs/common";
import { AsyncOperationsInterface } from "./async-operations-interface.service";

@Injectable()
export class AsyncOperationsDatabaseService implements AsyncOperationsInterface {
    constructor(private logger: Logger){
    }

    sendEmail(event): Promise<any> {
        return ;
    }
}