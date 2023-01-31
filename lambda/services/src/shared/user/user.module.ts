import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../shared/entities/user.entity';
import { UserService } from './user.service';
import { CaslModule } from '../../shared/casl/casl.module';
import { EmailModule } from '../../shared/email/email.module';
import { TypeOrmConfigService } from '../../shared/typeorm.config.service';
import configuration from '../../shared/configuration';
import { ConfigModule } from '@nestjs/config';
import { CompanyModule } from '../company/company.module';
import { UtilModule } from '../util/util.module';

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
    TypeOrmModule.forFeature([User]),
    CaslModule,
    EmailModule,
    CompanyModule,
    UtilModule
  ],
  providers: [UserService, Logger],
  exports: [UserService]
})
export class UserModule {}
