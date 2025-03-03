import { Controller, Get, Query, UseGuards, Request } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ProgrammeAuditSlService } from "@app/shared/programme-audit-sl/programmeAuditSL.service";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";

@ApiTags("Logs")
@ApiBearerAuth()
@Controller("logs")
export class ProgrammeAuditSlController {
  constructor(private programmeAuditSlService: ProgrammeAuditSlService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  createMonitoringReport(
    @Query("programmeId") programmeId: string,
    @Request() req
  ) {
    return this.programmeAuditSlService.getLogsByProgrammeId(programmeId);
  }
}
