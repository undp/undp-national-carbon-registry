import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BasicResponseDto } from "../dto/basic.response.dto";
import { ConfigurationSettings } from "../entities/configuration.settings";
import { ConfigurationSettingsType } from "../enum/configuration.settings.type.enum";
import { HelperService } from "./helpers.service";

@Injectable()
export class ConfigurationSettingsService {
  constructor(
    @InjectRepository(ConfigurationSettings)
    private configSettingsRepo: Repository<ConfigurationSettings>,
    private logger: Logger,
    private helperService: HelperService
  ) {}

  async getSetting(type: number, defaultValue?: string) {
    return await this.configSettingsRepo
      .findOneBy({
        id: type,
      })
      .then(async (value) => {
        if (value) return value.settingValue;
        else {
          return defaultValue;
        }
      });
  }

  async updateSetting(type: ConfigurationSettingsType, settingValue: any) {
    const result = await this.configSettingsRepo
      .upsert([{ id: type, settingValue: settingValue }], ["id"])
      .catch((err: any) => {
        this.logger.error(err);
        return err;
      });

    if (result.identifiers) {
      return new BasicResponseDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString(
          "common.settingsSavedMsg",
          []
        )
      );
    } else {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "common.settingsSaveFailedMsg",
          []
        ),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
