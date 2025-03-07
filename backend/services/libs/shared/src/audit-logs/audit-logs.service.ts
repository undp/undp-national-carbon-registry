import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AuditEntity } from "../entities/audit.entity";
import { Repository } from "typeorm";

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditEntity)
    private readonly auditRepository: Repository<AuditEntity>
  ) {}

  async save(entity: AuditEntity) {
    await this.auditRepository.save(entity);
  }

  async getLogs(id: string) {
    const query = `
      SELECT 
        projectLogs.*, 
        "user".name, 
        "organization".name AS "userCompanyName",
        "toOrganization".name AS "toCompanyName"
      FROM 
        audit_entity AS projectLogs
      LEFT JOIN 
        "user" AS "user" ON projectLogs."userId" = "user".id
      LEFT JOIN 
        "company" AS "organization" ON "user"."companyId" = "organization"."companyId"
      LEFT JOIN 
        "company" AS "toOrganization" ON projectLogs.data->>'toCompanyId' = CAST("toOrganization"."companyId" AS TEXT)
      WHERE 
        projectLogs."refId" = $1
      ORDER BY 
        projectLogs.id DESC;
    `;

    const result = await this.auditRepository.query(query, [id]);
    return result;
  }
}
