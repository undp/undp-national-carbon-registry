import { Injectable } from "@nestjs/common";
import { AsyncOperationsInterface, AsyncAction } from "./async-operations.interface";

@Injectable()
export class SqsAsyncOperationsService implements AsyncOperationsInterface {
    public async RegisterAction(action: AsyncAction): Promise<string> {
        console.log('d1 RegisterAction', action);
        return 'Action completed';
    }
}