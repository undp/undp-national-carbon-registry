import { Injectable } from "@nestjs/common";

export interface AsyncAction {
    actionType: number,
    emailAddress: string
}

@Injectable()
export abstract class AsyncOperationsInterface {
    public abstract RegisterAction(action:AsyncAction): Promise<string>;
}