import { ViewColumn, ViewEntity } from "typeorm"
import { Company } from "./company.entity";
import { ProgrammeDocument } from "./programme.document";

@ViewEntity({
    expression: `
    SELECT programme_document.*, programme."companyId" as "companyId", json_agg(DISTINCT "company".*) as "company" FROM "programme_document" "programme_document" 
    LEFT JOIN "programme" "programme" ON "programme"."programmeId" =  "programme_document"."programmeId"
    LEFT JOIN "company" "company" ON "company"."companyId" = ANY("programme"."companyId") 
    group by "programme_document"."id", programme."companyId" ;
    `,
})
export class ProgrammeDocumentViewEntity extends ProgrammeDocument
 {
    @ViewColumn()
    company: Company[];

    @ViewColumn()
    companyId: number[];
}