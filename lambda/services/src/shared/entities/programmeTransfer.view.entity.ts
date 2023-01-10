import { ViewColumn, ViewEntity } from "typeorm"
import { ProgrammeTransfer } from "./programme.transfer";

@ViewEntity({
    expression: `
    SELECT programme_transfer.*, "requester"."logo" as "requester", "certifier"."logo" as "certifier", "prog"."creditBalance" as "creditBalance", "sender"."logo" as "senderLogo", "sender"."name" as "senderName", "requester"."name" as "requesterName", "certifier"."name" as "certifierName", "prog"."title" as "programmeTitle", "prog"."sector" as "programmeSector" FROM "programme_transfer" "programme_transfer" 
    LEFT JOIN "programme" "prog" ON "prog"."programmeId" = "programme_transfer"."programmeId"
    LEFT JOIN "company" "requester" ON "requester"."companyId" = "programme_transfer"."requesterCompanyId"
    LEFT JOIN "company" "sender" ON "sender"."companyId" = ANY("programme_transfer"."companyId")
    LEFT JOIN "company" "certifier" ON "certifier"."companyId" = ANY("prog"."certifierId")
	group by "programme_transfer"."requestId", "requester"."logo", "certifier"."logo", "prog"."creditBalance", "prog"."title", "prog"."sector", "sender"."logo";	
    `,
})
export class ProgrammeTransferViewEntity extends ProgrammeTransfer {

    @ViewColumn()
    requester: string;

    @ViewColumn()
    certifier: string;

    @ViewColumn()
    creditBalance: number;

    @ViewColumn()
    programmeTitle: string;

    @ViewColumn()
    programmeSector: string;

    @ViewColumn()
    senderLogo: string;

    @ViewColumn()
    senderName: string;

    @ViewColumn()
    requesterName: string;

    @ViewColumn()
    certifierName: string;
}