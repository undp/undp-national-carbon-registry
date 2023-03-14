import { Injectable } from "@nestjs/common";

export interface AsyncAction {
    actionType: number,
    emailType?: string,
    emailAddress?: string,
    subject?: string,
    emailBody?: string
}

@Injectable()
export abstract class AsyncOperationsInterface {
    public abstract AddAction(action:AsyncAction): Promise<boolean>;
}