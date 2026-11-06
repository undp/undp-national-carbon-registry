import { Handler, Context } from "aws-lambda";
import { Server } from "http";
import { proxy } from "aws-serverless-express";
import { NationalAPIModule } from "../national-api/national.api.module";
import { bootstrapServer } from "src/server";

// The `default` function in serverless.yml is the API Gateway catch-all route
// ({any+}). It proxies to the same national API as the `national-api` function
// so requests that miss the specific routes still land on the API.
let cachedServer: Server;

export const handler: Handler = async (event: any, context: Context) => {
  const httpBase = "/national";
  cachedServer = await bootstrapServer(cachedServer, NationalAPIModule, httpBase);
  return proxy(cachedServer, event, context, "PROMISE").promise;
};
