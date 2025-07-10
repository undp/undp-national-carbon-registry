import { ProjectAuditLogType } from '../enum/project.audit.log.type.enum';

export class AuditDTO {
    logLevel: ProjectAuditLogType;

    data: any;

    createdTime: number;
}
