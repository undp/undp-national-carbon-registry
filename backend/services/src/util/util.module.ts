import { forwardRef, Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AcceptLanguageResolver, I18nModule, QueryResolver } from "nestjs-i18n";
import * as path from "path";
import { TypeOrmModule } from "@nestjs/typeorm";
import configuration from "../configuration";
import { Counter } from "../entities/counter.entity";
import { Country } from "../entities/country.entity";
import { TypeOrmConfigService } from "../typeorm.config.service";
import { CounterService } from "./counter.service";
import { CountryService } from "./country.service";
import { HelperService } from "./helpers.service";
import { IsValidCountryConstraint } from "./validcountry.decorator";
import { PasswordReset } from "../entities/userPasswordResetToken.entity";
import { PasswordResetService } from "./passwordReset.service";
import { User } from "../entities/user.entity";
import { UserModule } from "../user/user.module";
import { AsyncOperationsModule } from "../async-operations/async-operations.module";
import { ConfigurationSettingsService } from "./configurationSettings.service";
import { ConfigurationSettings } from "../entities/configuration.settings";
import { ObjectionLetterGen } from "./objection.letter.gen";
import { FileHandlerModule } from "../file-handler/filehandler.module";
import { Region } from "../entities/region.entity";
import { AuthorizationLetterGen } from "./authorisation.letter.gen";
import { Programme } from "../entities/programme.entity";
import { ProgrammeTransfer } from "../entities/programme.transfer";
import { Company } from "../entities/company.entity";
import { LetterOfIntentRequestGen } from "./letter.of.intent.request.gen";
import { LetterOfIntentResponseGen } from "./letter.of.intent.response.gen";
import { LetterOfAuthorisationRequestGen } from "./letter.of.authorisation.request.gen";
import { PasswordHashService } from "./passwordHash.service";
import { LetterSustainableDevSupportLetterGen } from "./letter.sustainable.dev.support";
import { DataExportService } from "./data.export.service";
import { HttpUtilService } from "./http.util.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`.env.${process.env.NODE_ENV}`, `.env`],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      imports: undefined,
    }),FileHandlerModule,
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '../i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
    TypeOrmModule.forFeature([
      Counter,
      Country,
      Company,
      PasswordReset,
      User,
      Programme,
      ProgrammeTransfer,
      ConfigurationSettings,
      Region,
    ]),
    forwardRef(() => AsyncOperationsModule),
    FileHandlerModule,
  ],
  providers: [
    CounterService,
    CountryService,
    IsValidCountryConstraint,
    HelperService,
    PasswordResetService,
    Logger,
    ConfigurationSettingsService,
    ObjectionLetterGen,
    AuthorizationLetterGen,
    LetterOfIntentRequestGen,
    LetterOfIntentResponseGen,
    LetterOfAuthorisationRequestGen,
    PasswordHashService,
    LetterSustainableDevSupportLetterGen,
    DataExportService,
    HttpUtilService
  ],
  exports: [
    CounterService,
    CountryService,
    HelperService,
    PasswordResetService,
    ConfigurationSettingsService,
    ObjectionLetterGen,
    AuthorizationLetterGen,
    LetterOfIntentRequestGen,
    LetterOfIntentResponseGen,
    LetterOfAuthorisationRequestGen,
    PasswordHashService,
    LetterSustainableDevSupportLetterGen,
    DataExportService,
    HttpUtilService
  ],
})
export class UtilModule {}
