// lambda.ts
import { Handler, Context } from "aws-lambda";
import { Server } from "http";
import { proxy } from "aws-serverless-express";
import { bootstrapServer } from "../shared/server";
import { AnalyticsAPIModule } from "./analytics.api.module";

let cachedServer: Server;

export const handler: Handler = async (event: any, context: Context) => {
  const httpBase = "/stats";
  cachedServer = await bootstrapServer(
    cachedServer,
    AnalyticsAPIModule,
    httpBase
  );
  return proxy(cachedServer, event, context, "PROMISE").promise;
};
