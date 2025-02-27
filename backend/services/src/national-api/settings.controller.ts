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
import { JwtAuthGuard } from "../shared/src/auth/guards/jwt-auth.guard";
import { Action } from "../shared/src/casl/action.enum";
import { PoliciesGuardEx } from "../shared/src/casl/policy.guard";
import { SettingsDto } from "../shared/src/dto/settings.dto";
import { ConfigurationSettings } from "../shared/src/entities/configuration.settings";
import { ConfigurationSettingsService } from "../shared/src/util/configurationSettings.service";
import { SLCFSignsDto } from "src/shared/src/dto/slcfSigns.dto";
import { SLCFCertificateType } from "src/shared/src/enum/certificate.type.enum";

@ApiTags("Settings")
@Controller("Settings")
@ApiBearerAuth()
export class SettingsController {
  constructor(
    private readonly configurationSettingsService: ConfigurationSettingsService
  ) {}

  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Update, ConfigurationSettings)
  )
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

  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Update, ConfigurationSettings)
  )
  @Post("signs/update")
  async updateSLCFSigns(@Body() signs: SLCFSignsDto, @Request() req) {
    return await this.configurationSettingsService.updateSLCFSigns(signs);
  }

  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Update, ConfigurationSettings)
  )
  @Get("certificates")
  async generatePreviewCertificates(
    @Query("type") type: SLCFCertificateType,
    @Request() req
  ) {
    return await this.configurationSettingsService.generatePreviewCertificates(
      type,
      req.user
    );
  }
}
