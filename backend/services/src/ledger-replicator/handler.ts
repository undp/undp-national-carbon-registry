// lambda.ts
import { Handler, Context } from "aws-lambda";
import { NestFactory } from "@nestjs/core";
import { getLogger } from "src/server";
import { LedgerReplicatorModule } from "./ledger-replicator.module";
import { LedgerReplicatorInterface } from "./replicator-interface.service";

export const handler: Handler = async (event: any, context: Context) => {
  const app = await NestFactory.createApplicationContext(LedgerReplicatorModule, {
    logger: getLogger(LedgerReplicatorModule),
  });
  await app.get(LedgerReplicatorInterface).replicate(event);
};
