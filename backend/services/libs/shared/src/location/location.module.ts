import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import configuration from "../configuration";
import { Region } from "../entities/region.entity";
import { LocationType } from "../enum/location.type";
import { TypeOrmConfigService } from "../typeorm.config.service";
import { FileLocationService } from "./file.location.service";
import { LocationInterface } from "./location.interface";
import { MapboxLocationService } from "./mapbox.location.service";
import { OpenStreetLocationService } from "./openstreet.location.service";
import { Province } from "../entities/province.entity";
import { District } from "../entities/district.entity";
import { DSDivision } from "../entities/dsDivision.entity";
import { City } from "../entities/city.entity";
import { LocationService } from "./location.service";
import { UtilModule } from "../util/util.module";

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
    }),
    TypeOrmModule.forFeature([Region, Province, District, DSDivision, City]),
    UtilModule,
  ],
  providers: [
    Logger,
    {
      provide: LocationInterface,
      useClass:
        process.env.LOCATION_SERVICE === LocationType.MAPBOX
          ? MapboxLocationService
          : process.env.LOCATION_SERVICE === LocationType.OPENSTREET
          ? OpenStreetLocationService
          : FileLocationService,
    },
    LocationService,
  ],
  exports: [LocationInterface, LocationService],
})
export class LocationModule {}
