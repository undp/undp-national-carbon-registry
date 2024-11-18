import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ProgrammeAuditLogSl } from "src/entities/programmeAuditLogSl.entity";
import { Repository } from "typeorm";

@Injectable()
export class ProgrammeAuditSlService {
  constructor(
    @InjectRepository(ProgrammeAuditLogSl)
    private programmeAuditSlRepo: Repository<ProgrammeAuditLogSl>
  ) {}

  async getLogsByProgrammeId(programmeId: string) {
    const query = `
    SELECT programmeLogs.*, "user".name, "user"."companyRole", "user".role
    FROM programme_audit_log_sl AS programmeLogs
    LEFT JOIN "user" AS "user" ON programmeLogs."userId" = "user".id
    WHERE "programmeId" = $1
    ORDER BY id DESC
  `;

    const result = await this.programmeAuditSlRepo.query(query, [programmeId]);
    return result;
  }
}
