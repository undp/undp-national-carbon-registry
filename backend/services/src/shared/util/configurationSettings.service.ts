import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigurationSettings } from "../entities/configuration.settings";
import { ConfigurationSettingsType } from "../enum/configuration.settings.type.enum";

@Injectable()
export class ConfigurationSettingsService {
  constructor(
    @InjectRepository(ConfigurationSettings)
    private configSettingsRepo: Repository<ConfigurationSettings>
  ) {}

  async getSetting(type: number) {
    return await this.configSettingsRepo
      .findOneBy({
        id: type,
      })
      .then((value) => {
        if (value) return value.settingValue;
        else return null;
      });
  }

  async saveSetting(type: ConfigurationSettingsType, settingValue: any) {
    await this.configSettingsRepo.save({
      id: type,
      settingValue: settingValue,
    });
    return settingValue;
  }
}
