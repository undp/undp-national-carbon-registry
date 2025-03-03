import { Injectable, Logger } from "@nestjs/common";
import { resolve } from "path";
import { LocationInterface } from "./location.interface";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Region } from "../entities/region.entity";
import { Province } from "../entities/province.entity";
import { District } from "../entities/district.entity";
import { DSDivision } from "../entities/dsDivision.entity";
import { City } from "../entities/city.entity";
import { LocationDataType } from "../enum/locationDataType.enum";
const fs = require("fs");

@Injectable()
export class FileLocationService implements LocationInterface {
  private regionMap: { [key: string]: number[] } = {};
  private provinceMap: { [key: string]: number[] } = {};
  private config = {
    [LocationDataType.REGION]: {
      fileName: "regions.csv",
      entity: Region,
      nameField: "regionName",
      repository: () => this.regionRepo,
    },
    [LocationDataType.PROVINCE]: {
      fileName: "provinces.csv",
      entity: Province,
      nameField: "provinceName",
      repository: () => this.provinceRepo,
    },
    [LocationDataType.DISTRICT]: {
      fileName: "districts.csv",
      entity: District,
      nameField: "districtName",
      repository: () => this.districtRepo,
    },
    [LocationDataType.DIVISION]: {
      fileName: "dsDivisions.csv",
      entity: DSDivision,
      nameField: "divisionName",
      repository: () => this.divisionRepo,
    },
    [LocationDataType.CITY]: {
      fileName: "cities.csv",
      entity: City,
      nameField: "cityName",
      repository: () => this.cityRepo,
    },
    // Additional types can be configured here easily
  };
  constructor(
    private logger: Logger,
    @InjectRepository(Region) private regionRepo: Repository<Region>,
    @InjectRepository(Province) private provinceRepo: Repository<Province>,
    @InjectRepository(District) private districtRepo: Repository<District>,
    @InjectRepository(DSDivision) private divisionRepo: Repository<DSDivision>,
    @InjectRepository(City) private cityRepo: Repository<City>
  ) {}

  public async init(
    data: string | null,
    locationDataType: LocationDataType
  ): Promise<void> {
    this.logger.log(
      `Initializing file location service for ${locationDataType}...`
    );
    const { fileName, repository } = this.config[locationDataType];
    const rawData = data || (await fs.readFileSync(fileName, "utf8"));
    await this.processData(rawData, locationDataType, repository());
  }

  private async processData(
    rawData: string,
    type: LocationDataType,
    repository: Repository<any>
  ): Promise<void> {
    const rows = rawData.slice(rawData.indexOf("\n") + 1).split("\n");
    const headers = rawData
      .slice(0, rawData.indexOf("\n"))
      .split(",")
      .map((header) => header.trim().replace("\r", ""));
    const dataIndexes = {
      nameIndex: headers.indexOf("Name"),
      latitudeIndex: headers.indexOf("Latitude"),
      longitudeIndex: headers.indexOf("Longitude"),
      countryIndex: headers.indexOf("Country"),
      languageIndex: headers.indexOf("Language"),
      // districtIndex: headers.indexOf("District"),
      // divisionIndex: headers.indexOf("DS Division"),
    };

    switch (type) {
      case LocationDataType.CITY:
        dataIndexes["districtIndex"] = headers.indexOf("District");
        dataIndexes["divisionIndex"] = headers.indexOf("DS Division");
        break;
      case LocationDataType.DIVISION:
        dataIndexes["districtIndex"] = headers.indexOf("District");
        break;

      case LocationDataType.DISTRICT:
        dataIndexes["provinceIndex"] = headers.indexOf("Province");
        break;
      // More cases can be added as needed for other LocationDataType values.
    }

    if (LocationDataType.CITY === type) {
    }

    const entities = rows
      .map((row) => this.parseRow(row, dataIndexes, type))
      .filter((entity) => entity !== null);
    await repository.save(entities);
    this.logger.log(`${type} data loaded: ${entities.length}`);
  }

  private parseRow(
    row: string,
    indexes: any,
    type: LocationDataType
  ): Region | Province | District | DSDivision | null {
    const columns = row.replace("\r", "").split(",");
    if (columns.length !== Object.keys(indexes).length) return null;

    const EntityClass = this.config[type].entity;
    const entity = new EntityClass();
    const nameField = this.config[type].nameField;
    entity[nameField] = columns[indexes.nameIndex].trim();
    entity.countryAlpha2 = columns[indexes.countryIndex].trim();
    entity.geoCoordinates = [
      Number(columns[indexes.longitudeIndex].trim()),
      Number(columns[indexes.latitudeIndex].trim()),
    ];
    entity.lang = columns[indexes.languageIndex].trim();
    entity.key =
      entity[nameField].trim().replace(/\s+/g, "") + "_" + entity.lang;
    if (this.isDistrict(entity, type)) {
      entity.provinceName = columns[indexes.provinceIndex].trim();
    }
    if (this.isDSDivision(entity, type)) {
      entity.districtName = columns[indexes.districtIndex].trim();
    }
    if (this.isCity(entity, type)) {
      entity.districtName = columns[indexes.districtIndex].trim();
      entity.divisionName = columns[indexes.divisionIndex].trim();
    }
    return entity;
  }

  isDSDivision(
    entity: any,
    locationDataType: LocationDataType
  ): entity is DSDivision {
    return LocationDataType.DIVISION === locationDataType;
  }

  isCity(entity: any, locationDataType: LocationDataType): entity is City {
    return LocationDataType.CITY === locationDataType;
  }

  isDistrict(
    entity: any,
    locationDataType: LocationDataType
  ): entity is District {
    return LocationDataType.DISTRICT === locationDataType;
  }

  public async getCoordinatesForRegion(regions: string[]): Promise<number[][]> {
    if (!regions) {
      return [];
    }

    const list = [];
    for (const region of regions) {
      list.push(
        (
          await this.regionRepo.findOneBy({
            regionName: region,
          })
        )?.geoCoordinates
      );
    }
    return list;
  }
}
