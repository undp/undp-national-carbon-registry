import { ViewColumn, ViewEntity } from "typeorm"
import { Company } from "./company.entity";
import { ProgrammeTransfer } from "./programme.transfer";

@ViewEntity({
    expression: `
    SELECT programme_transfer.*, JSON_AGG("requester".*) as "requester", "prog"."creditBalance" as creditBalance, "prog"."title" as "programmeTitle", "prog"."sector" as "programmeSector", JSON_AGG(distinct "certifier".*) as "certifier", JSON_AGG(distinct "sender".*) as "sender" 
    FROM "programme_transfer" "programme_transfer" 
    LEFT JOIN "programme" "prog" ON "prog"."programmeId" = "programme_transfer"."programmeId"
    LEFT JOIN "company" "requester" ON "requester"."companyId" = "programme_transfer"."requesterCompanyId"
    LEFT JOIN "company" "sender" ON "sender"."companyId" = ANY("programme_transfer"."companyId")
    LEFT JOIN "company" "certifier" ON "certifier"."companyId" = ANY("prog"."certifierId")
    group by "programme_transfer"."requestId", "requester"."companyId", "prog"."programmeId";	
    `,
})
export class ProgrammeTransferViewEntity extends ProgrammeTransfer {
    @ViewColumn()
    creditBalance: number;

    @ViewColumn()
    programmeTitle: string;

    @ViewColumn()
    programmeSector: string;

    @ViewColumn()
    certifier: Company[];

    @ViewColumn()
    sender: Company[];

    @ViewColumn()
    requester: Company[];
}