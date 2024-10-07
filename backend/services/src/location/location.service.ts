import { Injectable } from "@nestjs/common";
import { LocationDataType } from "../enum/locationDataType.enum";
import { Repository } from "typeorm";
import { Country } from "../entities/country.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { HelperService } from "../util/helpers.service";
import { QueryDto } from "../dto/query.dto";
import { DataListResponseDto } from "src/dto/data.list.response";
import { Region } from "src/entities/region.entity";
import { Province } from "src/entities/province.entity";
import { District } from "src/entities/district.entity";
import { DSDivision } from "src/entities/dsDivision.entity";
import { City } from "src/entities/city.entity";

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Region) private regionRepo: Repository<Region>,
    @InjectRepository(Province) private provinceRepo: Repository<Province>,
    @InjectRepository(District) private districtRepo: Repository<District>,
    @InjectRepository(DSDivision) private divisionRepo: Repository<DSDivision>,
    @InjectRepository(City) private cityRepo: Repository<City>,
    private helperService: HelperService
  ) {}

  async getLocationDataByLocationType(
    locationType: LocationDataType,
    query: QueryDto,
    abilityCondition: string
  ) {
    let dataQueryBuilder = this.getLocationTypeRepo(locationType)
      .createQueryBuilder()
      .where(
        this.helperService.generateWhereSQL(
          query,
          this.helperService.parseMongoQueryToSQL(abilityCondition)
        )
      )
      .orderBy(
        query?.sort?.key && `"${query?.sort?.key}"`,
        query?.sort?.order,
        query?.sort?.nullFirst !== undefined
          ? query?.sort?.nullFirst === true
            ? "NULLS FIRST"
            : "NULLS LAST"
          : undefined
      );

    // Apply pagination if required
    if (query.size && query.page) {
      dataQueryBuilder = dataQueryBuilder
        .offset(query.size * query.page - query.size)
        .limit(query.size);
    }

    const resp = await dataQueryBuilder.getManyAndCount();

    return new DataListResponseDto(
      resp.length > 0 ? resp[0] : undefined,
      resp.length > 1 ? resp[1] : undefined
    );
  }

  private getLocationTypeRepo(locationDataType: LocationDataType) {
    switch (locationDataType) {
      case LocationDataType.REGION:
        return this.regionRepo;
        break;

      case LocationDataType.PROVINCE:
        return this.provinceRepo;
        break;

      case LocationDataType.DISTRICT:
        return this.districtRepo;
        break;

      case LocationDataType.DIVISION:
        return this.divisionRepo;
        break;

      case LocationDataType.CITY:
        return this.cityRepo;
        break;

      default:
        break;
    }
  }
}
