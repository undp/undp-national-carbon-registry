import { NestFactory } from "@nestjs/core";
import { Handler, Context } from "aws-lambda";
import { getLogger } from "src/shared/server";
import { AsyncOperationsHandlerInterface } from "./async-operations-handler-interface.service";
import { AsyncOperationsModule } from "./async-operations.module";

export const handler: Handler = async (event: any, context: Context) => {
  const app = await NestFactory.createApplicationContext(
    AsyncOperationsModule,
    {
      logger: getLogger(AsyncOperationsModule),
    }
  );

  await app.get(AsyncOperationsHandlerInterface).asyncHandler(event);
};
