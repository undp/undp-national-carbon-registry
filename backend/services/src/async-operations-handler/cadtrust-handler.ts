import { NestFactory } from "@nestjs/core";
import { Handler, Context } from "aws-lambda";
import { CadTrustAsyncOperationsModule } from "./cadtrust-async-operations.module";
import { AsyncOperationsHandlerInterface } from "./async-operations-handler-interface.service";
import { getLogger } from "../server";

export const handler: Handler = async (event: any, context: Context) => {
  const app = await NestFactory.createApplicationContext(CadTrustAsyncOperationsModule, {
    logger: getLogger(CadTrustAsyncOperationsModule),
  });

  await app.get(AsyncOperationsHandlerInterface).asyncHandler(event);
};
