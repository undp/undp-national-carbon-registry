import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigurationSettingsType } from "src/shared/enum/configuration.settings.type.enum";
import { ConfigurationSettingsService } from "src/shared/util/configurationSettings.service";

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
