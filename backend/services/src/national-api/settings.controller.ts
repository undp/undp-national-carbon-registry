import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Action } from "../shared/casl/action.enum";
import { JwtAuthGuard } from "src/shared/auth/guards/jwt-auth.guard";
import { PoliciesGuardEx } from "src/shared/casl/policy.guard";
import { SettingsDto } from "src/shared/dto/settings.dto";
import { ConfigurationSettings } from "src/shared/entities/configuration.settings";
import { ConfigurationSettingsService } from "src/shared/util/configurationSettings.service";

@ApiTags("Settings")
@Controller("Settings")
@ApiBearerAuth()
export class SettingsController {
  constructor(
    private readonly configurationSettingsService: ConfigurationSettingsService
  ) {}

  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Update, ConfigurationSettings))
  @Post("update")
  async updateSettings(@Body() settings: SettingsDto, @Request() req) {
    return await this.configurationSettingsService.updateSetting(
      settings.id,
      settings.settingValue
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get("query")
  async getSettings(@Query("id") settingsId: number, @Request() req) {
    return await this.configurationSettingsService.getSetting(settingsId);
  }
}
