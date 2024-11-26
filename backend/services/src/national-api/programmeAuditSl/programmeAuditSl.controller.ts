import { Controller, Get, Query, UseGuards, Request } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { ProgrammeAuditSlService } from "../../programme-audit-sl/programmeAuditSL.service";

@ApiTags("Logs")
@ApiBearerAuth()
@Controller("logs")
export class ProgrammeAuditSlController {
  constructor(private programmeAuditSlService: ProgrammeAuditSlService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  createMonitoringReport(@Query("programmeId") programmeId: string, @Request() req) {
    return this.programmeAuditSlService.getLogsByProgrammeId(programmeId);
  }
}