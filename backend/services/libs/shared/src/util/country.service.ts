import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DataListResponseDto } from "../dto/data.list.response";
import { QueryDto } from "../dto/query.dto";
import { Country } from "../entities/country.entity";
import { HelperService } from "./helpers.service";
import { Region } from "../entities/region.entity";

@Injectable()
export class CountryService {
  constructor(
    @InjectRepository(Country) private countryRepo: Repository<Country>,
    private helperService: HelperService,
    @InjectRepository(Region) private regionRepo: Repository<Region>
  ) {}

  async insertCountry(country: Country) {
    return this.countryRepo.save(country);
  }

  async isValidCountry(alpha2: string) {
    return (
      (await this.countryRepo.findOneBy({
        alpha2: alpha2,
      })) != null
    );
  }

  async getCountryName(alpha2: string) {
    return (
      await this.countryRepo.findOneBy({
        alpha2: alpha2,
      })
    )?.name;
  }

  // AEF party/country fields are ISO 3166-1 alpha-3 (PARTY_CODE_PATTERN in
  // @app/aef-v2); everything in this registry (systemCountry, Country codes,
  // CooperativeApproach.hostParty/participatingParties, retirement use-data)
  // is alpha-2. This is the one conversion point between the two.
  async getAlpha3(alpha2: string): Promise<string | undefined> {
    return (
      await this.countryRepo.findOneBy({
        alpha2: alpha2,
      })
    )?.alpha3;
  }

  // The reverse of getAlpha3, for display. AEF stores the Party as alpha-3;
  // the full-report export renders Table 1's Party cell as the country name.
  async getCountryNameByAlpha3(alpha3: string): Promise<string | undefined> {
    return (
      await this.countryRepo.findOneBy({
        alpha3: alpha3,
      })
    )?.name;
  }

  async getCountryList(query: QueryDto) {
    const resp = await this.countryRepo
      .createQueryBuilder()
      .select(['"alpha2"', '"name"'])
      .where(this.helperService.generateWhereSQL(query, undefined))
      .orderBy(query?.sort?.key && `"${query?.sort?.key}"`, query?.sort?.order)
      .offset(query.size * query.page - query.size)
      .limit(query.size)
      .getRawMany();

    return new DataListResponseDto(resp, undefined);
  }

  async getAvailableCountries() {
    const resp = await this.countryRepo.find({
      select: {
        name: true,
        alpha2: true,
      },
    });

    return resp;
  }

  async getRegionList(query: QueryDto) {
    const resp = await this.regionRepo
      .createQueryBuilder()
      .select(['"regionName"', '"lang"'])
      .where(this.helperService.generateWhereSQL(query, undefined))
      .orderBy(query?.sort?.key && `"${query?.sort?.key}"`, query?.sort?.order)
      .offset(query.size * query.page - query.size)
      .limit(query.size)
      .getRawMany();

    return new DataListResponseDto(resp, undefined);
  }
}
