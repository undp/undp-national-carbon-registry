export const ASYNC_QUEUE_SERVICE = "ASYNC QUEUE SERVICE";

export interface AsyncAction {
    actionType: number,
    emailAddress: string
}

export interface IAsyncOperationsService {
    RegisterAction(action:AsyncAction): Promise<string>;
}