import { Logger } from "typeorm";
import { AsyncOperationsInterface } from "./async-operations-interface.service";

export class AsyncOperationsDatabaseService implements AsyncOperationsInterface {
    constructor(private logger: Logger){
    }

    sendEmail(event): Promise<any> {
        console.log('d1 AsyncOperationsDatabaseService');
        return ;
    }
}