import { NestFactory } from "@nestjs/core";
import { Handler, Context } from "aws-lambda";
import { AsyncOperationsModuleMain } from "./async-operations.module";
import { AsyncOperationsHandlerInterface } from "./async-operations-handler-interface.service";
import { getLogger } from "../server";

export const handler: Handler = async (event: any, context: Context) => {
  const app = await NestFactory.createApplicationContext(AsyncOperationsModuleMain, {
    logger: getLogger(AsyncOperationsModuleMain),
  });

  await app.get(AsyncOperationsHandlerInterface).asyncHandler(event);
};
