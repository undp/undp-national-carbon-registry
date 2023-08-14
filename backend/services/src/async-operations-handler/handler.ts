import { NestFactory } from "@nestjs/core";
import { Handler, Context } from "aws-lambda";
import { getLogger } from "carbon-services-lib";
import { AsyncOperationsHandlerInterface } from "carbon-services-lib";
import { AsyncOperationsModule } from "carbon-services-lib";

export const handler: Handler = async (event: any, context: Context) => {
  const app = await NestFactory.createApplicationContext(
    AsyncOperationsModule,
    {
      logger: getLogger(AsyncOperationsModule),
    }
  );

  await app.get(AsyncOperationsHandlerInterface).asyncHandler(event);
};
