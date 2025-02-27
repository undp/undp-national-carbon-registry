import { ViewColumn, ViewEntity } from "typeorm"
import { Company } from "./company.entity";
import { Programme } from "./programme.entity"
import { NDCAction } from "./ndc.action.entity";

@ViewEntity({
    expression: `
    SELECT ndc_action.*, programme."companyId" as "companyId",programme."title" as "programmeName", programme."emissionReductionExpected" as "emissionReductionExpected", programme."emissionReductionAchieved" as "emissionReductionAchieved", json_agg(DISTINCT "company".*) as "company" FROM "ndc_action" "ndc_action" 
    LEFT JOIN "programme" "programme" ON "programme"."programmeId" =  "ndc_action"."programmeId"
    LEFT JOIN "company" "company" ON "company"."companyId" = ANY("programme"."companyId") 
    group by "ndc_action"."id", programme."companyId", programme."title", programme."emissionReductionExpected", programme."emissionReductionAchieved";
    `,
})
export class NDCActionViewEntity extends NDCAction {

    @ViewColumn()
    company: Company[];

    @ViewColumn()
    companyId: number[];

    @ViewColumn()
    programmeName: string;

    @ViewColumn()
    emissionReductionExpected: string;

    @ViewColumn()
    emissionReductionAchieved: string;
}