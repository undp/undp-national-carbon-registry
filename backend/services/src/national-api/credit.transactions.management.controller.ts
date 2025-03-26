import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { PoliciesGuard } from "@app/shared/casl/policy.guard";
import { CreditTransactionsManagementService } from "@app/shared/credit-transactions-management/credit-transactions-management.service";
import { CreditRetireActionDto } from "@app/shared/dto/credit.retire.action.dto";
import { CreditRetireRequestDto } from "@app/shared/dto/credit.retire.request.dto";
import { CreditTransferDto } from "@app/shared/dto/credit.transfer.dto";
import { Body, Controller, Request, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller("creditTransactionsManagement")
export class CreditTransactionsManagementController {
  constructor(
    private readonly creditTransactionsManagementService: CreditTransactionsManagementService
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Update, ProgrammeSl)
  // )
  @Post("transfer")
  async transfer(@Body() creditTransferDto: CreditTransferDto, @Request() req) {
    return await this.creditTransactionsManagementService.transferCredits(
      creditTransferDto,
      req.user
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Update, ProgrammeSl)
  // )
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
  // @CheckPolicies((ability: AppAbility) =>
  //   ability.can(Action.Update, ProgrammeSl)
  // )
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
}
