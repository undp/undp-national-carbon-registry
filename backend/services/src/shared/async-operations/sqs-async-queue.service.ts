import { Injectable } from "@nestjs/common";
import { IAsyncOperationsService, AsyncAction } from "./async-operations.interface";

@Injectable()
export class SqsAsyncOperationsService implements IAsyncOperationsService {
    public async RegisterAction(action: AsyncAction): Promise<string> {
        console.log('d1 RegisterAction', action);
        return 'Action completed';
    }
}