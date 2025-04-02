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
      ) AS "company",
      COALESCE(
        jsonb_agg(a.*) FILTER (WHERE a."refId" IS NOT NULL), '[]'::jsonb
      ) AS "activities"
    FROM "project_entity" p
    JOIN "company" c ON p."companyId" = c."companyId"
    LEFT JOIN "activity_view_entity" a ON a."projectRefId" = p."refId"
    GROUP BY p."refId", c."companyId"
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
  };

  @ViewColumn()
  noObjectionLetterUrl: string;

  @ViewColumn()
  activities: ActivityEntity[];
}
