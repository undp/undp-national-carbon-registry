import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { AppAbility } from "@app/shared/casl/casl-ability.factory";
import { CheckPolicies } from "@app/shared/casl/policy.decorator";
import { PoliciesGuard } from "@app/shared/casl/policy.guard";
import { CadTrustSyncQueryService } from "@app/shared/cadtrust-sync/cadtrust-sync-query.service";
import {
  CadTrustCreditStatusRequestDto,
  CadTrustProjectStatusRequestDto,
} from "@app/shared/dto/cadtrust.sync.dto";
import { ProjectEntity } from "@app/shared/entities/projects.entity";
import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller("cadtrustSync")
export class CadTrustSyncController {
  constructor(private readonly cadTrustSyncQueryService: CadTrustSyncQueryService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, ProjectEntity))
  @Get("project/overview")
  async projectOverview(@Query("refId") refId: string) {
    return this.cadTrustSyncQueryService.getProjectOverview(refId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, ProjectEntity))
  @Get("credit/overview")
  async creditOverview(@Query("creditBlockId") creditBlockId: string) {
    return this.cadTrustSyncQueryService.getCreditOverview(creditBlockId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, ProjectEntity))
  @Post("project/statuses")
  async projectStatuses(@Body() body: CadTrustProjectStatusRequestDto) {
    return this.cadTrustSyncQueryService.getProjectStatuses(body.refIds);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, ProjectEntity))
  @Post("credit/statuses")
  async creditStatuses(@Body() body: CadTrustCreditStatusRequestDto) {
    return this.cadTrustSyncQueryService.getCreditStatuses(body.creditBlockIds);
  }
}
