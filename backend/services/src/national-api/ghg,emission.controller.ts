import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Res,
  HttpStatus,
  Get,
} from "@nestjs/common";
import { Response } from 'express';
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  Action,
  AppAbility,
  CheckPolicies,
  PoliciesGuard,
  JwtAuthGuard,
  EmissionDto,
  GhgEmissionsService,
  Emission,
} from "@undp/carbon-services-lib";

@ApiTags("Emission")
@ApiBearerAuth()
@Controller("emissions")
export class GHGEmissionController {
  constructor(private emissionService: GhgEmissionsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Emission))
  @Post()
  async addEmission(@Body() emissions: EmissionDto, @Request() req, @Res() res: Response) {
      const response = await this.emissionService.create(emissions, req.user);
      // Set the response status and send the response data
      res.status(response.status).json(response.data);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getEmissions(@Request() req) {
    return await this.emissionService.getAllEmissions(req.user);
  }
  
}
