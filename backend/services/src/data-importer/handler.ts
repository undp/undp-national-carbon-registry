// lambda.ts
import { Handler, Context } from 'aws-lambda';
import { Server } from 'http';
import { NestFactory } from '@nestjs/core';
import { getLogger } from '../shared/server';
import { DataImporterModule } from './data-importer.module';
import { DataImporterService } from './data-importer.service';

export const handler: Handler = async (event: any, context: Context) => {
   const app = await NestFactory.createApplicationContext(DataImporterModule, {
      logger: getLogger(DataImporterModule),
    });
    await app.get(DataImporterService).importData(event);
}