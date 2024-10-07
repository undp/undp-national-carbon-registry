import {
  Controller,
  UseGuards,
  Request,
  Post,
  Body,
  Param,
  ParseEnumPipe,
  HttpCode,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { QueryDto } from "../dto/query.dto";
import { LocationDataType } from "../enum/locationDataType.enum";
import { LocationService } from "../location/location.service";
import { DataListResponseDto } from "../dto/data.list.response";

@ApiTags("Location")
@ApiBearerAuth()
@Controller("location")
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(":locationType")
  @HttpCode(200)
  async getLocationData(
    @Param("locationType", new ParseEnumPipe(LocationDataType)) locationType: LocationDataType,
    @Body() query: QueryDto,
    @Request() req
  ): Promise<DataListResponseDto> {
    return await this.locationService.getLocationDataByLocationType(
      locationType,
      query,
      req.abilityCondition
    );
  }
}
