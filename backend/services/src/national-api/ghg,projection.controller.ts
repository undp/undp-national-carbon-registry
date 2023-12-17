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
  ProjectionDto,
  GhgProjectionsService,
  Projection,
} from "@undp/carbon-services-lib";

@ApiTags("Projections")
@ApiBearerAuth()
@Controller("projections")
export class GHGProjectionController {
  constructor(private projectionService: GhgProjectionsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Create, Projection))
  @Post()
  async addProjection(@Body() projection: ProjectionDto, @Request() req, @Res() res: Response) {
      const response = await this.projectionService.create(projection, req.user);
      // Set the response status and send the response data
      res.status(response.status).json(response.data);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getProjections(@Request() req) {
    return await this.projectionService.getAllProjections(req.user);
  }

  
}
