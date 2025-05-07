import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Province } from "../entities/province.entity";

@Injectable()
export class ProvinceService {
  constructor(
    @InjectRepository(Province) private provinceRepo: Repository<Province>
  ) {}

  async getProvinceList(): Promise<string[]> {
    const rawProvinces = await this.provinceRepo
      .createQueryBuilder("province")
      .select("province.provinceName", "provinceName")
      .getRawMany();

    return rawProvinces.map((p) => p.provinceName);
  }

  async isValidProvince(provinces: string[]): Promise<boolean> {
    if (!Array.isArray(provinces)) return false;

    const validProvinces: string[] = await this.getProvinceList();

    return provinces.every((province) => validProvinces.includes(province));
  }
}
