import { Body, Controller, Get, Post, Query, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Action } from "../casl/action.enum";
import { PoliciesGuardEx } from "../casl/policy.guard";
import { SettingsDto } from "../dto/settings.dto";
import { ConfigurationSettings } from "../entities/configuration.settings";
import { ConfigurationSettingsService } from "../util/configurationSettings.service";
import { SLCFSignsDto } from "src/dto/slcfSigns.dto";
import { SLCFCertificateType } from "src/enum/certificate.type.enum";

@ApiTags("Settings")
@Controller("Settings")
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly configurationSettingsService: ConfigurationSettingsService) {}

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

  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Update, ConfigurationSettings))
  @Post("signs/update")
  async updateSLCFSigns(@Body() signs: SLCFSignsDto, @Request() req) {
    return await this.configurationSettingsService.updateSLCFSigns(signs);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Update, ConfigurationSettings))
  @Get("certificates")
  async generatePreviewCertificates(@Query("type") type: SLCFCertificateType, @Request() req) {
    return await this.configurationSettingsService.generatePreviewCertificates(type, req.user);
  }
}
