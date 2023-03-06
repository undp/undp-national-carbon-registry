// lambda.ts
import { Handler, Context } from 'aws-lambda';
import { Server } from 'http';
import { NestFactory } from '@nestjs/core';
import { LedgerReplicatorModule } from './ledger-replicator.module';
import { getLogger } from '../shared/server';
import { LedgerReplicatorInterface } from './replicator-interface.service';

export const handler: Handler = async (event: any, context: Context) => {
   const app = await NestFactory.createApplicationContext(LedgerReplicatorModule, {
      logger: getLogger(LedgerReplicatorModule),
    });
    await app.get(LedgerReplicatorInterface).replicate(event);
}