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
import { JwtAuthGuard } from "src/shared/auth/guards/jwt-auth.guard";
import { SettingsDto } from "src/shared/dto/settings.dto";
import { ConfigurationSettingsService } from "src/shared/util/configurationSettings.service";

@ApiTags("Settings")
@Controller("Settings")
@ApiBearerAuth()
export class settingsController {
  constructor(
    private readonly configurationSettingsService: ConfigurationSettingsService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post("update")
  async updateSettings(@Body() settings: SettingsDto, @Request() req) {
    return await this.configurationSettingsService.saveSetting(
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
