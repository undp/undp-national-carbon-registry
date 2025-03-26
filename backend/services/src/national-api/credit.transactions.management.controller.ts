import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { PoliciesGuard } from "@app/shared/casl/policy.guard";
import { CreditTransactionsManagementService } from "@app/shared/credit-transactions-management/credit-transactions-management.service";
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
}
