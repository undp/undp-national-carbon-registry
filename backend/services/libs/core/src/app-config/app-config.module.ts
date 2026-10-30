import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AcceptLanguageResolver, I18nModule, QueryResolver } from "nestjs-i18n";
import * as fs from "fs";
import * as path from "path";
import configuration from "./configuration";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TypeOrmConfigService } from "./typeorm.config.service";

// The i18n JSON assets sit at libs/shared/src/i18n, but where they end up
// relative to this module depends on how the service was built:
//  - webpack bundle (nest build, Docker): dist/<...>/shared/src/i18n
//  - serverless-plugin-typescript (.build, local sls flow): .build/libs/shared/src/i18n
//    — only if the assets got copied there
//  - running from source (sls offline / tests): libs/shared/src/i18n
// Resolve dynamically instead of hardcoding one layout, so local setup
// doesn't die with ENOENT (undp/undp-national-carbon-registry#345).
const i18nPath =
  [
    path.join(__dirname, "/shared/src/i18n/"),
    path.resolve(process.cwd(), ".build/libs/shared/src/i18n/"),
    path.resolve(process.cwd(), "libs/shared/src/i18n/"),
  ].find((p) => fs.existsSync(p)) ?? path.join(__dirname, "/shared/src/i18n/");

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`.env.${process.env.NODE_ENV}`, `.env`],
    }),
    I18nModule.forRoot({
      fallbackLanguage: "en",
      loaderOptions: {
        path: i18nPath,
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ["lang"] },
        AcceptLanguageResolver,
      ],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      imports: undefined,
    }),
  ],
})
export class AppConfigModule {}
