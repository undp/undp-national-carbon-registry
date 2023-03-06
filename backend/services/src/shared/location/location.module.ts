import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from '../configuration';
import { LocationType } from '../enum/location.type';
import { FileLocationService } from './file.location.service';
import { LocationInterface } from './location.interface';
import { MapboxLocationService } from './mapbox.location.service';

@Module({
    providers: [
        Logger,
        {
            provide: LocationInterface,
            useClass:
              process.env.LOCATION_SERVICE === LocationType.MAPBOX
                ? MapboxLocationService
                : FileLocationService,
          }
    ],
    exports: [LocationInterface],
    imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
          envFilePath: [`.env.${process.env.NODE_ENV}`, `.env`],
        })
      ],
})
export class LocationModule {}
