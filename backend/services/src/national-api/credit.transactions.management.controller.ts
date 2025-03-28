import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { AppAbility } from "@app/shared/casl/casl-ability.factory";
import { CheckPolicies } from "@app/shared/casl/policy.decorator";
import { PoliciesGuard } from "@app/shared/casl/policy.guard";
import { CreditTransactionsManagementService } from "@app/shared/credit-transactions-management/credit-transactions-management.service";
import { CreditRetireActionDto } from "@app/shared/dto/credit.retire.action.dto";
import { CreditRetireRequestDto } from "@app/shared/dto/credit.retire.request.dto";
import { CreditTransferDto } from "@app/shared/dto/credit.transfer.dto";
import { QueryDto } from "@app/shared/dto/query.dto";
import { ProgrammeSl } from "@app/shared/entities/programmeSl.entity";
import { ProjectEntity } from "@app/shared/entities/projects.entity";
import { Body, Controller, Request, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller("creditTransactionsManagement")
export class CreditTransactionsManagementController {
  constructor(
    private readonly creditTransactionsManagementService: CreditTransactionsManagementService
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Update, ProjectEntity)
  )
  @Post("transfer")
  async transfer(@Body() creditTransferDto: CreditTransferDto, @Request() req) {
    return await this.creditTransactionsManagementService.transferCredits(
      creditTransferDto,
      req.user
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Update, ProjectEntity)
  )
  @Post("retireRequest")
  async retireRequest(
    @Body() creditRetireRequestDto: CreditRetireRequestDto,
    @Request() req
  ) {
    return await this.creditTransactionsManagementService.createRetireRequest(
      creditRetireRequestDto,
      req.user
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Update, ProjectEntity)
  )
  @Post("performRetireAction")
  async performRetireAction(
    @Body() retirementAction: CreditRetireActionDto,
    @Request() req
  ) {
    return await this.creditTransactionsManagementService.creditRetirementAction(
      retirementAction,
      req.user
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Read, ProjectEntity)
  )
  @Post("queryBalance")
  async queryBalance(@Body() queryDto: QueryDto, @Request() req): Promise<any> {
    return this.creditTransactionsManagementService.queryCreditBalances(
      queryDto,
      req.abilityCondition,
      req.user
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Read, ProjectEntity)
  )
  @Post("queryTransfers")
  async queryTransfers(
    @Body() queryDto: QueryDto,
    @Request() req
  ): Promise<any> {
    return this.creditTransactionsManagementService.queryTransfers(
      queryDto,
      req.abilityCondition,
      req.user
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Read, ProjectEntity)
  )
  @Post("queryRetirements")
  async queryRetirements(
    @Body() queryDto: QueryDto,
    @Request() req
  ): Promise<any> {
    return this.creditTransactionsManagementService.queryRetirements(
      queryDto,
      req.abilityCondition,
      req.user
    );
  }
}
