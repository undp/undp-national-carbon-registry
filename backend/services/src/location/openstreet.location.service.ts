import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Region } from "../entities/region.entity";
import { LocationInterface } from "./location.interface";
import axios from "axios";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class OpenStreetLocationService implements LocationInterface {
  constructor(
    private logger: Logger,
    private configService: ConfigService,
    @InjectRepository(Region) private regionRepo: Repository<Region>
  ) {}

  public async init(data: any): Promise<void> {
    this.logger.log('open street init')
    return await this.retrieveData();
  }

  public async retrieveData() {
    if (
      this.configService.get("openstreet.retrieve") ||
      (await this.regionRepo.count()) <= 0
    ) {
      const data: Region[] = [];
      const countryCode = this.configService.get("systemCountryCode");
      const query = `data=%5Bout%3Ajson%5D%3B%0Aarea%5B%22ISO3166-1%22%3D%22${countryCode}%22%5D-%3E.a%3B%0A%28%0A%20%20node%28area.a%29%5B%22admin_level%22%3D%224%22%5D%3B%0A%29%3B%0Aout%20body%3B`;
      this.logger.log('Region query', query);
      const response = await axios
        .post("https://overpass-api.de/api/interpreter", query)
        .catch((err) => {
          this.logger.error("Geocoding failed - ", err);
          return err;
        });

      if (response && response.data?.elements) {

        for (const element of response.data?.elements) {
          const location = [element.lon,  element.lat];

          if (element.tags) {
            for (const tag in element.tags) {
              if (tag.startsWith("name:") || tag === "name") {
                const region = new Region();
                region.countryAlpha2 = countryCode;
                region.regionName = element.tags[tag];
                region.geoCoordinates = location;
                const t = tag.split(':');
                region.lang = t.length > 1 ? t[1] : 'en';
                region.key = tag + '_' + element.id;
                data.push(region);
              }
            }
          }
        }
      }
      await this.regionRepo.save(data);
      this.logger.log(`Regions loaded: ${data.length}`);
    } else {
      this.logger.log(`Skipped adding regions ${this.configService.get("openstreet.retrieve")}`)
    }
  }

  public async getCoordinatesForRegion(regions: string[]): Promise<number[][]> {
    const list = [];
    for (const region of regions) {
      list.push(
        (await this.regionRepo.findOneBy({
          regionName: region,
        }))?.geoCoordinates
      );
    }
    return list;
  }
}
