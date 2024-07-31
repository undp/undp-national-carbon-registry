import { Injectable } from "@nestjs/common";

@Injectable()
export abstract class AsyncOperationsHandlerInterface {
  abstract asyncHandler(event): Promise<any>;
}
