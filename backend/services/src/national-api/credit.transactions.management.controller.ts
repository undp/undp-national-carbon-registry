import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { AppAbility } from "@app/shared/casl/casl-ability.factory";
import { CheckPolicies } from "@app/shared/casl/policy.decorator";
import { PoliciesGuard } from "@app/shared/casl/policy.guard";
import { CreditTransactionsManagementService } from "@app/shared/credit-transactions-management/credit-transactions-management.service";
import { CreditRetireActionDto } from "@app/shared/dto/credit.retire.action.dto";
import { CreditRetireRequestDto } from "@app/shared/dto/credit.retire.request.dto";
import { CreditItmoAuthActionDto } from "@app/shared/dto/credit.itmo.auth.action.dto";
import { CreditItmoAuthRequestDto } from "@app/shared/dto/credit.itmo.auth.request.dto";
import { CreditTransferDto } from "@app/shared/dto/credit.transfer.dto";
import { CreditBlockHistoryRequestDto } from "@app/shared/dto/credit.block.history.request.dto";
import { OrgCreditBlocksRequestDto } from "@app/shared/dto/org.credit.blocks.request.dto";
import { QueryDto } from "@app/shared/dto/query.dto";
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
    ability.can(Action.Update, ProjectEntity)
  )
  @Post("itmoAuthRequest")
  async itmoAuthRequest(
    @Body() itmoAuthRequestDto: CreditItmoAuthRequestDto,
    @Request() req
  ) {
    return await this.creditTransactionsManagementService.createItmoAuthRequest(
      itmoAuthRequestDto,
      req.user
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Update, ProjectEntity)
  )
  @Post("performItmoAuthAction")
  async performItmoAuthAction(
    @Body() itmoAuthAction: CreditItmoAuthActionDto,
    @Request() req
  ) {
    return await this.creditTransactionsManagementService.itmoAuthorizationAction(
      itmoAuthAction,
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
  @Post("queryBalanceByOrganization")
  async queryBalanceByOrganization(
    @Body() queryDto: QueryDto,
    @Request() req
  ): Promise<any> {
    return this.creditTransactionsManagementService.queryBalanceByOrganization(
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
  @Post("queryBalanceByProject")
  async queryBalanceByProject(
    @Body() queryDto: QueryDto,
    @Request() req
  ): Promise<any> {
    return this.creditTransactionsManagementService.queryBalanceByProject(
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
  @Post("queryBalanceProjectNames")
  async queryBalanceProjectNames(
    @Body() queryDto: QueryDto,
    @Request() req
  ): Promise<any> {
    return this.creditTransactionsManagementService.queryBalanceProjectNames(
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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Read, ProjectEntity)
  )
  @Post("queryIssuances")
  async queryIssuances(
    @Body() queryDto: QueryDto,
    @Request() req
  ): Promise<any> {
    return this.creditTransactionsManagementService.queryIssuances(
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
  @Post("queryItmoAuthorizations")
  async queryItmoAuthorizations(
    @Body() queryDto: QueryDto,
    @Request() req
  ): Promise<any> {
    return this.creditTransactionsManagementService.queryItmoAuthorizations(
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
  @Post("queryExplorer")
  async queryExplorer(
    @Body() queryDto: QueryDto,
    @Request() req
  ): Promise<any> {
    return this.creditTransactionsManagementService.queryExplorer(
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
  @Post("creditBlockHistory")
  async creditBlockHistory(
    @Body() creditBlockHistoryRequestDto: CreditBlockHistoryRequestDto
  ): Promise<any> {
    return this.creditTransactionsManagementService.getCreditBlockHistoryTree(
      creditBlockHistoryRequestDto
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Read, ProjectEntity)
  )
  @Post("orgCreditBlocks")
  async orgCreditBlocks(
    @Body() orgCreditBlocksRequestDto: OrgCreditBlocksRequestDto,
    @Request() req
  ): Promise<any> {
    return this.creditTransactionsManagementService.queryOrgCreditBlocks(
      orgCreditBlocksRequestDto,
      req.abilityCondition,
      req.user
    );
  }
}
