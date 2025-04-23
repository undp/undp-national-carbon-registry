import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { AppAbility } from "@app/shared/casl/casl-ability.factory";
import { CheckPolicies } from "@app/shared/casl/policy.decorator";
import { PoliciesGuard } from "@app/shared/casl/policy.guard";
import { ProjectCreateDto } from "@app/shared/dto/project.create.dto";
import { QueryDto } from "@app/shared/dto/query.dto";
import { ProjectEntity } from "@app/shared/entities/projects.entity";
import { ProjectManagementService } from "@app/shared/project-management/project-management.service";
import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  Get,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

@ApiTags("ProjectManagement")
@ApiBearerAuth()
@Controller("projectManagement")
export class ProjectManagementController {
  constructor(private projectManagementService: ProjectManagementService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Read, ProjectEntity)
  )
  @Post("query")
  async getAll(@Body() query: QueryDto, @Request() req) {
    return this.projectManagementService.query(
      query,
      req.abilityCondition,
      req.user
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Read, ProjectEntity)
  )
  @Post("getProjectById")
  async getProjectById(
    @Body("programmeId") programmeId: string,
    @Request() req
  ) {
    return this.projectManagementService.getProjectById(programmeId, req.user);
  }

  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Read, ProjectEntity)
  )
  @Get("logs")
  getLogs(@Query("refId") refId: string, @Request() req) {
    return this.projectManagementService.getLogs(refId);
  }
}
