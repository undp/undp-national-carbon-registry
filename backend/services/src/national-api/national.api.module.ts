import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NationalAPIController } from './national.api.controller';
import { NationalAPIService } from './national.api.service';
import configuration from '../shared/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from '../shared/typeorm.config.service';
// import { Programme } from './entities/programme.entity';
import { AuthModule ,CompanyModule,UserModule,UtilModule,CaslModule} from "carbon-services-lib";
import { ProgrammeModule } from '../shared/programme/programme.module';
import { CompanyController } from './company.controller';
import { UserController } from './user.controller';
import { AuthController } from './auth.controller';
import { ProgrammeController } from './programme.controller';
import { SettingsController } from './settings.controller';

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
    UtilModule
  ],
  controllers: [ NationalAPIController, UserController, AuthController, CompanyController, ProgrammeController, SettingsController ],
  providers: [
    NationalAPIService, 
    Logger
  ],
})
export class NationalAPIModule {}
