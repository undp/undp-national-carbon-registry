import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { LocationInterface } from "./location.interface";

@Injectable()
export class MapboxLocationService implements LocationInterface {

  constructor(
    private logger: Logger,
    private configService: ConfigService
  ) {}
  
  public init(data: any): Promise<void> {
    return null;
  }

  public async getCoordinatesForRegion(regions: string[]): Promise<number[][]> {
    
    console.log("addresses passed to forwardGeocoding function -> ", regions);
    let geoCodinates: any[] = [];
    const ACCESS_TOKEN = this.configService.get('mapbox.key');

    for (let index = 0; index < regions.length; index++) {
      const url =
        "https://api.mapbox.com/geocoding/v5/mapbox.places/" +
        encodeURIComponent(regions[index]) +
        ".json?access_token=" +
        ACCESS_TOKEN +
        "&limit=1" +
        `&country=${this.configService.get(
          "systemCountry"
        )}&autocomplete=false&types=region%2Cdistrict`;
      console.log("geocoding request urls -> ", index, url);
      await axios
        .get(url)
        .then(function (response) {
          // handle success
          console.log(
            "cordinates data in replicator -> ",
            response?.data?.features[0],
            response?.data?.features[0]?.center
          );
          if (response?.data?.features.length > 0) {
            geoCodinates.push([...response?.data?.features[0]?.center]);
          } else {
            geoCodinates.push(null);
          }
        })
        .catch((err) => {
          this.logger.error("Geocoding failed - ", err);
          return err;
        });
    }

    return geoCodinates;

  }
}
