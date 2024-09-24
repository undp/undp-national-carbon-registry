import { createLogger } from "winston";
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from "nest-winston";
import { createServer, proxy } from "aws-serverless-express";
import { eventContext } from "aws-serverless-express/middleware";

import { AbstractHttpAdapter, NestFactory } from "@nestjs/core";
import {
  ExpressAdapter,
  NestExpressApplication,
} from "@nestjs/platform-express";
import { Server } from "http";
import * as winston from "winston";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { BadRequestException, INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import { TrimPipe } from "./validation/trim-pipe.transform";
import { ValidationException } from "./validation/validation.exception";
import { ValidationExceptionFilter } from "./validation/validation-exception.filter";
import { useContainer } from "class-validator";
import { UtilModule } from "./util/util.module";
import * as bodyParser from "body-parser";

const express = require("express");
const fs_promises = require('fs/promises');

// NOTE: If you get ERR_CONTENT_DECODING_FAILED in your browser, this is likely
// due to a compressed response (e.g. gzip) which has not been handled correctly
// by aws-serverless-express and/or API Gateway. Add the necessary MIME types to
// binaryMimeTypes below
const binaryMimeTypes: string[] = [];

function setupSwagger(
  nestApp: INestApplication,
  name: string,
  httpBase: String
): void {
  const config = new DocumentBuilder()
    .setTitle(`${name.replace("APIModule", " API")}`)
    .setDescription(
      `RESTful Web API Documentation.`
    )
    .setVersion("0.5")
    .addBearerAuth()
    .addApiKey()
    .addServer(`${process.env.DOMAIN_MAP == 'true' ? "/" : ("/" + process.env.NODE_ENV)}`)
    .build();
  // ${process.env.NODE_ENV}
  const document = SwaggerModule.createDocument(nestApp, config);

  SwaggerModule.setup(`${httpBase}`, nestApp, document, {
    customSiteTitle: "API Documentation",
    customCss: `
    .topbar-wrapper img {content:url(\'https://carbon-common-dev.s3.amazonaws.com/logo-h.png\'); height:50px; width:auto;}
    .swagger-ui .topbar { background-color: #f4f5fa; }
    .swagger-ui { background-color: white; }
    #links-header { position: absolute; top: 25px; right: calc((100% - 1440px)/2); }
    #links-header a { margin-right: 15px;}
    `,
    swaggerOptions: {
      docExpansion: "alpha",
      operationSorter: "alpha",
      tagSorter: "alpha",
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
          })
        ),
        level: process.env.LOG_LEVEL,
      }),
    ],
  });

  return WinstonModule.createLogger({
    instance,
  });
}

export async function buildNestApp(
  module: any,
  httpBase: string,
  expressApp?: AbstractHttpAdapter
): Promise<NestExpressApplication> {
  let options: any = {
    logger: getLogger(module),
  }
  if (process.env.SSL_KEY_PATH) {
    options['httpsOptions'] = {
      key: (await fs_promises.readFile(process.env.SSL_KEY_PATH)),
      cert: (await fs_promises.readFile(process.env.SSL_CERT_PATH)),
    }
  }
  const nestApp = await NestFactory.create<NestExpressApplication>(
    module,
    new ExpressAdapter(expressApp),
    options
  );
  useContainer(nestApp.select(UtilModule), { fallbackOnErrors: true });
  nestApp.setGlobalPrefix(httpBase);
  nestApp.use(bodyParser.json({ limit: "50mb" }));
  nestApp.enableCors();
  nestApp.useGlobalPipes(new TrimPipe());
  nestApp.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) => new ValidationException(errors),
    })
  );
  nestApp.useGlobalFilters(new ValidationExceptionFilter());
  nestApp.use(eventContext());
  setupSwagger(nestApp, module.name, httpBase);
  return nestApp;
}

export async function bootstrapServer(
  cachedServer: Server,
  module: any,
  httpBase: string
): Promise<Server> {
  if (!cachedServer) {
    const expressApp = express();
    const nestApp = await buildNestApp(module, httpBase, expressApp);
    await nestApp.init();
    cachedServer = createServer(expressApp, undefined, binaryMimeTypes);
  }
  return cachedServer;
}
