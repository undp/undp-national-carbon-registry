import { ViewColumn, ViewEntity } from "typeorm";
import { CompanyState } from "../enum/company.state.enum";
import { TxType } from "../enum/txtype.enum";
import { ActivityEntity } from "../entities/activity.entity";

@ViewEntity({
  expression: `
    SELECT 
      p."refId", 
      p."title", 
      p."serialNumber" as "serialNo",
      p."authorizationId",
      p."projectProposalStage", 
      p."creditEst",
      p."creditBalance",
      p."creditRetired",
      p."creditTransferred",
      p."independentCertifiers" as "certifierId",
      p."noObjectionLetterUrl",
      jsonb_build_object(
        'name', c."name",
        'logo', c."logo",
        'companyRole', c."companyRole",
        'state', c."state",
        'email', c."email",
        'companyId',p."companyId"
      ) AS "company"
    FROM "project_entity" p
    JOIN "company" c ON p."companyId" = c."companyId"
  `,
})
export class ProjectDetailsViewEntity {
  @ViewColumn()
  refId: string;

  @ViewColumn()
  title: string;

  @ViewColumn()
  serialNo: string;

  @ViewColumn()
  authorizationId: string;

  @ViewColumn()
  projectProposalStage: string;

  @ViewColumn()
  creditEst: number;

  @ViewColumn()
  creditBalance: number;

  @ViewColumn()
  creditRetired: number;

  @ViewColumn()
  creditTransferred: number;

  @ViewColumn()
  certifierId: number[];

  @ViewColumn()
  company: {
    name: string;
    logo: string;
    companyRole: string;
    state: CompanyState;
    email: string;
    companyId: number;
  };

  @ViewColumn()
  noObjectionLetterUrl: string;

  activities: ActivityEntity[];
}
