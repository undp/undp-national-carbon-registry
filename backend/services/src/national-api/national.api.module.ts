import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NationalAPIController } from './national.api.controller';
import { NationalAPIService } from './national.api.service';
// import { GhgInventoryModule, configuration } from "@undp/carbon-services-lib";
import { TypeOrmModule } from '@nestjs/typeorm';
// import { TypeOrmConfigService } from '@undp/carbon-services-lib';
// import { Programme } from './entities/programme.entity';
// import { AuthModule ,CompanyModule,UserModule,UtilModule,CaslModule} from "@undp/carbon-services-lib";
// import { ProgrammeModule } from '@undp/carbon-services-lib';
import { CompanyController } from './company.controller';
import { UserController } from './user.controller';
import { AuthController } from './auth.controller';
import { ProgrammeController } from './programme.controller';
import { SettingsController } from './settings.controller';
import { AuthModule } from 'src/auth/auth.module';
import { CaslModule } from 'src/casl/casl.module';
import { CompanyModule } from 'src/company/company.module';
// import configuration from 'src/configuration';
import { ProgrammeModule } from 'src/programme/programme.module';
import { TypeOrmConfigService } from 'src/typeorm.config.service';
import { UserModule } from 'src/user/user.module';
import { UtilModule } from 'src/util/util.module';
import configuration from 'src/configuration';
import { NationalAccountingModule } from 'src/national-accounting/national.accounting.module';
import { NationalAccountingController } from './national-accounting.controller';
// import { GHGEmissionController } from './ghg,emission.controller';
// import { GHGProjectionController } from './ghg,projection.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`.env.${process.env.NODE_ENV}`, `.env`]
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      imports: undefined
    }),
    AuthModule,
    UserModule,
    CaslModule,
    ProgrammeModule,
    CompanyModule,
    UtilModule,
		NationalAccountingModule
    // GhgInventoryModule
  ],
  controllers: [ 
		NationalAPIController, 
		UserController, 
		AuthController, 
		CompanyController, 
		ProgrammeController, 
		SettingsController, 
		NationalAccountingController
		// GHGEmissionController, 
		// GHGProjectionController
	 ],
  providers: [
    NationalAPIService, 
    Logger
  ],
})
export class NationalAPIModule {}
