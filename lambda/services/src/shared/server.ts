import { createLogger } from 'winston';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import { createServer, proxy } from 'aws-serverless-express';
import { eventContext } from 'aws-serverless-express/middleware';

import { AbstractHttpAdapter, NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Server } from 'http';
import * as winston from 'winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BadRequestException, INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { TrimPipe } from './validation/trim-pipe.transform';
import { ValidationException } from './validation/validation.exception';
import { ValidationExceptionFilter } from './validation/validation-exception.filter';
import { useContainer } from 'class-validator';
import { UtilModule } from './util/util.module';
import * as bodyParser from 'body-parser';

const express = require('express');


// NOTE: If you get ERR_CONTENT_DECODING_FAILED in your browser, this is likely
// due to a compressed response (e.g. gzip) which has not been handled correctly
// by aws-serverless-express and/or API Gateway. Add the necessary MIME types to
// binaryMimeTypes below
const binaryMimeTypes: string[] = [];

function setupSwagger(nestApp: INestApplication, name: string, httpBase: String): void {
    const config = new DocumentBuilder()
      .setTitle(`${name}`)
      .setDescription(`API Documentation`)
      .setVersion('0.0.1')
      .addBearerAuth()
      .addApiKey()
      .addServer(`${process.env.NODE_ENV === 'local' ? '/local': '/'}`)
      .build();
  // ${process.env.NODE_ENV}
    const document = SwaggerModule.createDocument(nestApp, config);
  
    SwaggerModule.setup(`${httpBase}`, nestApp, document, {
      customSiteTitle: 'API Documentation',
      swaggerOptions: {
        docExpansion: 'none',
        operationSorter: 'alpha',
        tagSorter: 'alpha',
      },
    });
}

export function getLogger(module) {
  const instance = createLogger({
      transports: [
          new winston.transports.Console({
              format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.ms(),
              nestWinstonModuleUtilities.format.nestLike(module.name, {
                  // options
              }),
              ),
              level: process.env.LOG_LEVEL
          })
      ]
  });

  return WinstonModule.createLogger({
    instance,
  });
}

export async function buildNestApp(module: any, httpBase: string, expressApp?: AbstractHttpAdapter): Promise<INestApplication> {
  const nestApp = await NestFactory.create(module, new ExpressAdapter(expressApp), {
    logger: getLogger(module),
  })
  useContainer(nestApp.select(UtilModule), { fallbackOnErrors: true });
  nestApp.setGlobalPrefix(httpBase)
  nestApp.use(bodyParser.json({limit: '50mb'}));
  nestApp.enableCors();
  nestApp.useGlobalPipes(new TrimPipe());
  nestApp.useGlobalPipes(new ValidationPipe({
      exceptionFactory: (errors) => new ValidationException(errors)
  }));
  nestApp.useGlobalFilters(new ValidationExceptionFilter())
  nestApp.use(eventContext());
  setupSwagger(nestApp, module.name, httpBase)
  return nestApp;
}

export async function bootstrapServer(cachedServer: Server, module: any, httpBase: string): Promise<Server> {
    if (!cachedServer) {
        const expressApp = express();
        const nestApp = await buildNestApp(module, httpBase, expressApp);
        await nestApp.init();
        cachedServer = createServer(expressApp, undefined, binaryMimeTypes);
    }
    return cachedServer;
}