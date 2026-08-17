import { Controller, Get, UseGuards, Request } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { Action } from "@app/shared/casl/action.enum";
import { ProgrammeLedgerService } from "@app/shared/programme-ledger/programme-ledger.service";
import { ConfigurationSettings } from "@app/shared/entities/configuration.settings";
import { Role } from "@app/shared/casl/role.enum";
import { CompanyRole } from "@app/shared/enum/company.role.enum";
import { ForbiddenException } from "@nestjs/common";

/**
 * Admin introspection endpoints.
 *
 * /deductionConfig: exposes the current OMGE / SOP / auto-deduct
 * configuration that ProgrammeLedgerService applies at issuance. Prior
 * to this endpoint an admin could not see the live values without
 * shelling into the container; documenting the values is a
 * transparency requirement under Article 6.2 even though the OMGE /
 * SOP deduction itself is voluntary (Dec 3/CMA.3 contrasts with
 * mandatory Art 6.4 rates; Draft -/CMA.5 encourages voluntary
 * application under 6.2 and requires the Party to make its chosen
 * rates discoverable).
 */
@ApiTags("Admin")
@ApiBearerAuth()
@Controller("admin")
export class AdminController {
  constructor(
    private readonly programmeLedgerService: ProgrammeLedgerService
  ) {}

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Read, ConfigurationSettings)
  )
  @Get("deductionConfig")
  deductionConfig(@Request() req) {
    // Tighter scoping than ConfigurationSettings' default: this is
    // registry-wide config, only DNA admins see it.
    if (
      req.user?.companyRole !== CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
      (req.user?.role !== Role.Admin && req.user?.role !== Role.Root)
    ) {
      throw new ForbiddenException(
        "Only DNA Admin/Root can read the registry-wide deduction config."
      );
    }
    return this.programmeLedgerService.getDeductionConfig();
  }
}
