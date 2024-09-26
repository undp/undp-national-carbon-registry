import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NationalAPIController } from './national.api.controller';
import { NationalAPIService } from './national.api.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyController } from './company.controller';
import { UserController } from './user.controller';
import { AuthController } from './auth.controller';
import { ProgrammeController } from './programme.controller';
import { SettingsController } from './settings.controller';
import { AuthModule } from 'src/auth/auth.module';
import { CaslModule } from 'src/casl/casl.module';
import { CompanyModule } from 'src/company/company.module';
import { ProgrammeModule } from 'src/programme/programme.module';
import { TypeOrmConfigService } from 'src/typeorm.config.service';
import { UserModule } from 'src/user/user.module';
import { UtilModule } from 'src/util/util.module';
import configuration from 'src/configuration';

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
  ],
  controllers: [ 
		NationalAPIController, 
		UserController, 
		AuthController, 
		CompanyController, 
		ProgrammeController, 
		SettingsController, 
	 ],
  providers: [
    NationalAPIService, 
    Logger
  ],
})
export class NationalAPIModule {}
