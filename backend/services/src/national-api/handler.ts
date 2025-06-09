// lambda.ts
import { Handler, Context } from "aws-lambda";
import { Server } from "http";
import { proxy } from "aws-serverless-express";
import { NationalAPIModule } from "./national.api.module";
import { bootstrapServer } from "src/server";

let cachedServer: Server;

export const handler: Handler = async (event: any, context: Context) => {
  const httpBase = "/national";
  // event.path = event.path.includes('swagger-ui') ? `${event.path}` : event.path
  cachedServer = await bootstrapServer(cachedServer, NationalAPIModule, httpBase);
  return proxy(cachedServer, event, context, "PROMISE").promise;
};
