import { ViewColumn, ViewEntity } from "typeorm"
import { Company } from "./company.entity";
import { Programme } from "./programme.entity"

@ViewEntity({
    expression: `
    SELECT programme.*, json_agg(DISTINCT "company".*) as "company", json_agg(DISTINCT "cert".*) as "certifier" FROM "programme" "programme" 
    LEFT JOIN "company" "cert" ON "cert"."companyId" = ANY("programme"."certifierId") 
    LEFT JOIN "company" "company" ON "company"."companyId" = ANY("programme"."companyId") 
    group by "programme"."programmeId";
    `,
})
export class ProgrammeQueryEntity extends Programme {

    @ViewColumn()
    company: Company[];

    @ViewColumn()
    certifier: Company[]
}