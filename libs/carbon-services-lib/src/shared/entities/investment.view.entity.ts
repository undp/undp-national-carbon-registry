import { ViewColumn, ViewEntity } from "typeorm"
import { Company } from "./company.entity";
import { Investment } from "./investment.entity";

@ViewEntity({
    expression: `
        SELECT investment.*, JSON_AGG(distinct "requester".*) as "requester", JSON_AGG(distinct "receiver".*) as "receiver", "receiver"."geographicalLocationCordintes" as "toGeo",
         "prog"."title" as "programmeTitle", "prog"."sector" as "programmeSector",
        JSON_AGG(distinct "sender".*) as "sender", "sender"."geographicalLocationCordintes" as "fromGeo", "prog"."proponentTaxVatId" as "proponentTaxVatId", 
        "prog"."proponentPercentage" as "proponentPercentage", "prog"."creditOwnerPercentage" as "creditOwnerPercentage",
        "prog"."companyId" as "companyId" FROM "investment" "investment"
        LEFT JOIN "programme" "prog" ON "prog"."programmeId" = "investment"."programmeId"
        LEFT JOIN "company" "requester" ON "requester"."companyId" = "investment"."initiatorCompanyId"
        LEFT JOIN "company" "receiver" ON "receiver"."companyId" = "investment"."toCompanyId"
        LEFT JOIN "company" "sender" ON "sender"."companyId" = "investment"."fromCompanyId"
        group by "investment"."requestId", "requester"."companyId", "prog"."programmeId", "toGeo", "fromGeo";
    `,
})
export class InvestmentView extends Investment {

    @ViewColumn()
    programmeTitle: string;

    @ViewColumn()
    programmeSector: string;

    @ViewColumn()
    sender: Company;

    @ViewColumn()
    requester: Company;

    @ViewColumn()
    receiver: Company;

    @ViewColumn()
    proponentTaxVatId: string[];

    @ViewColumn()
    proponentPercentage: number[];

    @ViewColumn()
    companyId: string[];

    @ViewColumn()
    creditOwnerPercentage: number[];

    @ViewColumn()
    toGeo: any;

    @ViewColumn()
    fromGeo: any;
}