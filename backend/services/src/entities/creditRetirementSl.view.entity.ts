import { ViewColumn, ViewEntity } from "typeorm";
import { Company } from "./company.entity";
import { CreditRetirementSl } from "./creditRetirementSl.entity";

@ViewEntity({
  expression: `
        SELECT "requestId",
            PSL."programmeId",
            PSL."title" AS "programmeTitle",
            PSL."serialNo" AS "programmeSerialNo",
            "creditType",
            CRSL."fromCompanyId",
            CRSL."toCompanyId",
            JSON_AGG(DISTINCT FCOM.*) AS "fromCompany",
            JSON_AGG(DISTINCT TCOM.*) AS "toCompany",
            "creditAmount",
            CRSL."comment",
            CRSL."txRef",
            CRSL."txTime",
            CRSL."createdTime",
            "approvedTime",
            STATUS,
            "voluntaryCancelationCertificateUrl"
        FROM PUBLIC.CREDIT_RETIREMENT_SL CRSL
        JOIN PROGRAMME_SL PSL ON PSL."programmeId" = CRSL."programmeId"
        LEFT JOIN COMPANY FCOM ON CRSL."fromCompanyId" = FCOM."companyId"
        LEFT JOIN COMPANY TCOM ON CRSL."toCompanyId" = TCOM."companyId"
        GROUP BY CRSL."requestId",
            PSL."programmeId",
            PSL."title",
            PSL."serialNo",
            CRSL."creditType",
            CRSL."creditAmount",
            CRSL."comment",
            CRSL."fromCompanyId",
            CRSL."toCompanyId",
            CRSL."txRef",
            CRSL."txTime",
            CRSL."createdTime",
            CRSL."approvedTime",
            CRSL."status",
            CRSL."voluntaryCancelationCertificateUrl"
        ORDER BY "requestId" ASC;
    `,
})
export class CreditRetirementSlView extends CreditRetirementSl {
  @ViewColumn()
  programmeTitle: string;

  @ViewColumn()
  programmeSerialNo: string;

  @ViewColumn()
  fromCompany: Company[];

  @ViewColumn()
  toCompany: Company[];
}
