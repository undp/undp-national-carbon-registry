import { ViewColumn, ViewEntity } from "typeorm"
import { Company } from "./company.entity";
import { CreditAuditLog } from "./credit.audit.log.entity";

@ViewEntity({
	expression: `
        SELECT CAL.*,
					PROG.TITLE AS "programmeTitle",
					PROG.SECTOR AS "programmeSector",
					EXTRACT(EPOCH FROM CAL."createdTime") AS created_epoch,
					PROG."companyId" AS "programmeCompanyId",
					JSON_AGG(DISTINCT COM.*) AS "company"
				FROM PUBLIC.CREDIT_AUDIT_LOG CAL
				LEFT JOIN PROGRAMME PROG ON PROG."programmeId" = CAL."programmeId"
				LEFT JOIN "company" COM ON COM."companyId" = ANY(PROG."companyId")
				GROUP BY CAL.ID,
					PROG."programmeId"
				ORDER BY ID ASC;
    `,
})
export class CreditAuditLogViewEntity extends CreditAuditLog {

	@ViewColumn()
	programmeTitle: string;

	@ViewColumn()
	programmeSector: string;

	@ViewColumn()
	programmeCompanyId: number[]

	@ViewColumn()
	company: Company[];

	@ViewColumn()
	created_epoch: string;

}