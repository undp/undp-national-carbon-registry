import { ViewColumn, ViewEntity } from "typeorm"
import { Company } from "./company.entity";
import { ProgrammeTransfer } from "./programme.transfer";

@ViewEntity({
    expression: `
        SELECT programme_transfer.*, JSON_AGG(distinct "requester".*) as "requester", JSON_AGG(distinct "receiver".*) as "receiver", 
        "prog"."creditBalance" as "creditBalance", "prog"."title" as "programmeTitle", "prog"."certifierId" as "programmeCertifierId", 
        "prog"."sector" as "programmeSector", "prog"."sectoralScope" as "programmeSectoralScope", JSON_AGG(distinct "certifier".*) as "certifier", 
        JSON_AGG(distinct "sender".*) as "sender", "prog"."proponentTaxVatId" as "proponentTaxVatId", 
        "prog"."proponentPercentage" as "proponentPercentage", "prog"."creditOwnerPercentage" as "creditOwnerPercentage",
        "prog"."companyId" as "companyId", "prog"."serialNo" as "serialNo"
        FROM "programme_transfer" "programme_transfer"
        LEFT JOIN "programme" "prog" ON "prog"."programmeId" = "programme_transfer"."programmeId"
        LEFT JOIN "company" "requester" ON "requester"."companyId" = "programme_transfer"."initiatorCompanyId"
        LEFT JOIN "company" "receiver" ON "receiver"."companyId" = "programme_transfer"."toCompanyId"
        LEFT JOIN "company" "sender" ON "sender"."companyId" = "programme_transfer"."fromCompanyId"
        LEFT JOIN "company" "certifier" ON "certifier"."companyId" = ANY("prog"."certifierId")
        group by "programme_transfer"."requestId", "requester"."companyId", "prog"."programmeId";
    `,
})
export class ProgrammeTransferViewEntityQuery extends ProgrammeTransfer {
    @ViewColumn()
    creditBalance: number;

    @ViewColumn()
    programmeTitle: string;

    @ViewColumn()
    programmeCertifierId: number[]

    @ViewColumn()
    serialNo: string;

    @ViewColumn()
    programmeSector: string;

    @ViewColumn()
    programmeSectoralScope: string;

    @ViewColumn()
    certifier: Company[];

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

}