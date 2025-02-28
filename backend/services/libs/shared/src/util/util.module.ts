import { forwardRef, Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Counter } from "../entities/counter.entity";
import { Country } from "../entities/country.entity";
import { CounterService } from "./counter.service";
import { CountryService } from "./country.service";
import { HelperService } from "./helpers.service";
import { IsValidCountryConstraint } from "../decorators/validcountry.decorator";
import { PasswordReset } from "../entities/userPasswordResetToken.entity";
import { PasswordResetService } from "./passwordReset.service";
import { User } from "../entities/user.entity";
import { AsyncOperationsModule } from "../async-operations/async-operations.module";
import { ConfigurationSettingsService } from "./configurationSettings.service";
import { ConfigurationSettings } from "../entities/configuration.settings";
import { ObjectionLetterGen } from "./document-generators/objection.letter.gen";
import { FileHandlerModule } from "../file-handler/filehandler.module";
import { Region } from "../entities/region.entity";
import { AuthorizationLetterGen } from "./document-generators/authorisation.letter.gen";
import { Programme } from "../entities/programme.entity";
import { ProgrammeTransfer } from "../entities/programme.transfer";
import { Company } from "../entities/company.entity";
import { LetterOfIntentRequestGen } from "./document-generators/letter.of.intent.request.gen";
import { LetterOfIntentResponseGen } from "./document-generators/letter.of.intent.response.gen";
import { LetterOfAuthorisationRequestGen } from "./document-generators/letter.of.authorisation.request.gen";
import { PasswordHashService } from "./passwordHash.service";
import { LetterSustainableDevSupportLetterGen } from "./document-generators/letter.sustainable.dev.support";
import { DataExportService } from "./data.export.service";
import { HttpUtilService } from "./http.util.service";
import { TxRefGeneratorService } from "./txRef-generator.service";
import { SLCFSerialNumberGeneratorService } from "./slcfSerialNumberGenerator.service";
import { VoluntarilyCancellationCertificateGenerator } from "./document-generators/voluntarilyCancellationCertificate.gen";
import { ProjectRegistrationCertificateGenerator } from "./document-generators/projectRegistrationCertificate.gen";
import { DateUtilService } from "./dateUtil.service";
import { CreditIssueCertificateGenerator } from "./document-generators/creditIssueCertificate.gen";
import { CarbonNeutralCertificateGenerator } from "./document-generators/carbonNeutralCertificate.gen";
import { CoreModule } from "@app/core";

@Module({
  imports: [
    CoreModule,
    // need to import core module since some dependant modules from UtilModule, are used in setup script in main.
    // Those modules need to solve dependencies on its own
    // Since UtilModule is imported from all those modules, its more flexible to import core module here
    // Otherwise, core module need to be imported in each above mentioned modules
    // Global dependency injections doesnt work since those modules are called before the construction of app
    FileHandlerModule,
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
    HttpUtilService,
    TxRefGeneratorService,
    SLCFSerialNumberGeneratorService,
    VoluntarilyCancellationCertificateGenerator,
    ProjectRegistrationCertificateGenerator,
    CreditIssueCertificateGenerator,
    CarbonNeutralCertificateGenerator,
    DateUtilService,
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
    HttpUtilService,
    TxRefGeneratorService,
    SLCFSerialNumberGeneratorService,
    VoluntarilyCancellationCertificateGenerator,
    ProjectRegistrationCertificateGenerator,
    CreditIssueCertificateGenerator,
    CarbonNeutralCertificateGenerator,
    DateUtilService,
  ],
})
export class UtilModule {}
