import { Injectable, Logger } from "@nestjs/common";
import { resolve } from "path";
import { LocationInterface } from "./location.interface";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Region } from "../entities/region.entity";
const fs = require('fs')

@Injectable()
export class FileLocationService implements LocationInterface {

  private regionMap: { [key: string]: number[] } = {}
  constructor(
    private logger: Logger,
    @InjectRepository(Region) private regionRepo: Repository<Region>
  ) {
   
  }
  
  public async init(data: any): Promise<void> {
    this.logger.log('file location init')
    return await this.retrieveData(data);
  }

  public async retrieveData(data: any) {

    let regionRawData;
    if (!data) {
      regionRawData = fs.readFileSync('regions.csv', 'utf8');
    } else {
      regionRawData = data;
    }
    const deliminator = ','
    
    const headers = regionRawData.slice(0, regionRawData.indexOf("\n")).split(deliminator).map(e => e.trim().replace('\r', ''))
    const rows = regionRawData.slice(regionRawData.indexOf("\n") + 1).split("\n")

    const nameIndex = headers.indexOf('Name')
    const latitudeIndex = headers.indexOf('Latitude')
    const countryIndex = headers.indexOf('Country')
    const longitudeIndex = headers.indexOf('Longitude')
    const languageIndex = headers.indexOf('Language')
    // console.log(headers, nameIndex, latitudeIndex, longitudeIndex)
    if (nameIndex >=0 && latitudeIndex >=0 && longitudeIndex >=0 && countryIndex >= 0 && languageIndex >= 0) {
      const data: Region[] = [];
      for (let row of rows) {
        row = row.replace('\r', '')
        const columns = row.split(deliminator)
        if (columns.length != headers.length) {
          continue
        }

        const region = new Region();
        region.countryAlpha2 = columns[countryIndex].trim();
        region.regionName = columns[nameIndex].trim();
        region.geoCoordinates = [ Number(columns[longitudeIndex].trim()), Number(columns[latitudeIndex].trim()) ];
        region.lang = columns[languageIndex].trim();
        region.key = region.regionName + "_" + region.lang;
        const exist = data.some(
          (item: any) =>
            item?.regionName === region.regionName && item?.lang === region.lang
        );
        if (!exist) {
        data.push(region);
        }
      }

      await this.regionRepo.save(data);
    }

    this.logger.log(`Regions loaded: ${Object.values(this.regionMap).length}`)
  }

  public async getCoordinatesForRegion(regions: string[]): Promise<number[][]> {

    if (!regions) {
      return []
    }
    
    const list = [];
    for (const region of regions) {
      list.push(
        (await this.regionRepo.findOneBy({
          regionName: region,
        }))?.geoCoordinates
      );
    }
    return list;
    // return new Promise((resolve, reject) => {
    //   resolve(regions.map( (region) => {
    //     return this.regionMap[region]
    //   }));
    // })
  }
  
}