import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from '../configuration';
import { Counter } from '../entities/counter.entity';
import { Country } from '../entities/country.entity';
import { TypeOrmConfigService } from '../typeorm.config.service';
import { CounterService } from './counter.service';
import { CountryService } from './country.service';
import { HelperService } from './helpers.service';
import { IsValidCountryConstraint } from './validcountry.decorator';

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
    TypeOrmModule.forFeature([Counter]),
    TypeOrmModule.forFeature([Country]),
  ],
  providers: [CounterService, CountryService, IsValidCountryConstraint, HelperService],
  exports: [CounterService, CountryService, HelperService]
})
export class UtilModule {}
