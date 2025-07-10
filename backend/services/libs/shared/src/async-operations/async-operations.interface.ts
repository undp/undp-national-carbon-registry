import { Injectable } from "@nestjs/common";

export interface AsyncAction {
  actionType: number;
  actionProps: any;
}

@Injectable()
export abstract class AsyncOperationsInterface {
  public abstract tx:AsyncAction[]
  public abstract flushTx(): Promise<boolean>;
  public abstract AddAction(action: AsyncAction): Promise<boolean>;
}
