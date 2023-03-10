import { Injectable, Logger } from "@nestjs/common";
import { resolve } from "path";
import { LocationInterface } from "./location.interface";
const fs = require('fs')

@Injectable()
export class FileLocationService implements LocationInterface {

  private regionMap: { [key: string]: number[] } = {}
  constructor(
    private logger: Logger
  ) {
    const deliminator = ','
    const regionRawData = fs.readFileSync('regions.csv', 'utf8');
    const headers = regionRawData.slice(0, regionRawData.indexOf("\n")).split(deliminator).map(e => e.trim().replace('\r', ''))
    const rows = regionRawData.slice(regionRawData.indexOf("\n") + 1).split("\n")

    const nameIndex = headers.indexOf('Name')
    const latitudeIndex = headers.indexOf('Latitude')
    const longitudeIndex = headers.indexOf('Longitude')
    console.log(headers, nameIndex, latitudeIndex, longitudeIndex)
    if (nameIndex >=0 && latitudeIndex >=0 && longitudeIndex >=0) {
      for (let row of rows) {
        row = row.replace('\r', '')
        const columns = row.split(deliminator)
        if (columns.length != headers.length) {
          continue
        }
        this.regionMap[columns[nameIndex].trim()] = [ Number(columns[latitudeIndex].trim()), Number(columns[longitudeIndex].trim()) ]
      }
    }

    this.logger.log(`Regions loaded: ${Object.values(this.regionMap).length}`)
  }
  
  public init(): Promise<void> {
    return null;
  }

  public getCoordinatesForRegion(regions: string[]): Promise<number[][]> {
    return new Promise((resolve, reject) => {
      resolve(regions.map( (region) => {
        return this.regionMap[region]
      }));
    })
  }
  
}