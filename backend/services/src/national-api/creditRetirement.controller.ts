import {
  Controller,
  UseGuards,
  Request,
  Post,
  Body,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreditRetirementRequestSlDto } from "../dto/creditRetirementRequestSl.dto";
import { CreditRetirementSlService } from "../creditRetirement-sl/creditRetirementSl.service";
import { PoliciesGuardEx } from "../casl/policy.guard";
import { Action } from "../casl/action.enum";
import { CreditRetirementSl } from "../entities/creditRetirementSl.entity";

@ApiTags("Credit Retire")
@ApiBearerAuth()
@Controller("retire")
export class CreditRetirementSlController {
  constructor(private readonly retirementService: CreditRetirementSlService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Create, CreditRetirementSl, true))
  @Post("create")
  async createCreditRetirementRequest(
    @Body() dto: CreditRetirementRequestSlDto,
    @Request() req
  ) {
    return await this.retirementService.createCreditRetirementRequest(dto, req.user);
  }
}
