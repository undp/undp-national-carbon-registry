import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigurationSettingsService } from "../../util/configurationSettings.service";
import { ConfigurationSettingsType } from "../../enum/configuration.settings.type.enum";


@Injectable()
export class TransferFreezeGuard implements CanActivate {
  constructor(
    private configurationSettingsService: ConfigurationSettingsService
  ) {}

  async canActivate(context: ExecutionContext) {
    const result = await this.configurationSettingsService.getSetting(
      ConfigurationSettingsType.isTransferFrozen,
      "false"
    );
    if (result == "true") return false;
    else return true;
  }
}
