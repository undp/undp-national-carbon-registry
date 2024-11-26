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
      SELECT 
        programmeLogs.*, 
        "user".name, 
        "user"."companyRole", 
        "user".role,
        "userCompany".name AS "userCompanyName",
        "toCompany".name AS "toCompanyName"
      FROM 
        programme_audit_log_sl AS programmeLogs
      LEFT JOIN 
        "user" AS "user" ON programmeLogs."userId" = "user".id
      LEFT JOIN 
        company AS "toCompany" ON programmeLogs.data->>'toCompanyId' = CAST("toCompany"."companyId" AS TEXT)
      LEFT JOIN 
        company AS "userCompany" ON "user"."companyId" = "userCompany"."companyId"
      WHERE 
        "programmeId" = $1
      ORDER BY 
        programmeLogs.id DESC;
  `;

    const result = await this.programmeAuditSlRepo.query(query, [programmeId]);
    return result;
  }
}
