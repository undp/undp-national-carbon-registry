import { ViewColumn, ViewEntity } from "typeorm";
import { CompanyState } from "../enum/company.state.enum";
import { TxType } from "../enum/txtype.enum";
import { ActivityEntity } from "../entities/activity.entity";

@ViewEntity({
  expression: `
    SELECT 
      p."refId" as "projectId", 
      p."title", 
      p."projectProposalStage", 
      p."creditEst",
      p."creditBalance",
      p."creditRetired",
      p."creditIssued",
      p."creditChange",
      p."companyId",
      p."independentCertifiers" as "certifierId",
      p."createTime" as "createdTime",
      p."txTime",
      p."txType",
      p."txRef",
      p."noObjectionLetterUrl",
      p."letterOfAuthorizationUrl",
      p."activities",
      c."name", 
      c."logo",
      c."companyRole",
      c."state",
      d."programmeId",
      d."status" as "currentStage",
      d."type",
      d."content"
    FROM "project_entity" p
    JOIN "company" c ON p."companyId" = c."companyId"
    LEFT JOIN "document_entity" d ON d."programmeId" = p."refId"
  `,
})
export class ProjectDetailsViewEntity {
  @ViewColumn()
  projectId: string;

  @ViewColumn()
  title: string;

  @ViewColumn()
  projectProposalStage: string;

  @ViewColumn()
  creditEst: number;

  @ViewColumn()
  creditBalance: number;

  @ViewColumn()
  creditRetired: number;

  @ViewColumn()
  creditIssued: number;

  @ViewColumn()
  creditChange: number;

  @ViewColumn()
  companyId: number;

  @ViewColumn()
  state: CompanyState;

  @ViewColumn()
  certifierId: number[];

  @ViewColumn()
  createdTime: number;

  @ViewColumn()
  txTime: bigint;

  @ViewColumn()
  txType: TxType;

  @ViewColumn()
  txRef: TxType;

  @ViewColumn()
  name: string;

  @ViewColumn()
  logo: string;

  @ViewColumn()
  companyRole: string;

  @ViewColumn()
  programmeId: string;

  @ViewColumn()
  currentStage: string;

  @ViewColumn()
  type: string;

  @ViewColumn()
  content: string;

  @ViewColumn()
  noObjectionLetterUrl: string;

  @ViewColumn()
  letterOfAuthorizationUrl: string;

  @ViewColumn()
  activities: ActivityEntity[];
}
