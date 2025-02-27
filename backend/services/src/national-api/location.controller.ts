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
import { LocationDataType } from "../shared/src/enum/locationDataType.enum";
import { LocationService } from "../shared/src/location/location.service";
import { QueryDto } from "src/shared/src/dto/query.dto";
import { DataListResponseDto } from "src/shared/src/dto/data.list.response";

@ApiTags("Location")
@ApiBearerAuth()
@Controller("location")
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  // @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard)
  @Post(":locationType")
  @HttpCode(200)
  async getLocationData(
    @Param("locationType", new ParseEnumPipe(LocationDataType))
    locationType: LocationDataType,
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
