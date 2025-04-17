import { ViewColumn, ViewEntity } from "typeorm";

@ViewEntity({
  expression: `
    SELECT 
      p."refId" as "projectId", 
      p."refId",
      p."title", 
      p."projectProposalStage", 
      p."createTime" as "createdTime",
      p."creditBalance",
      p."creditRetired",
      p."sector",
      p."sectoralScope",
      c."companyId", 
      c."name", 
      c."logo",
      c."companyRole"
    FROM "project_entity" p
    JOIN "company" c ON p."companyId" = c."companyId"
  `,
})
export class ProjectViewEntity {
  @ViewColumn()
  projectId: string;

  @ViewColumn()
  refId: string;

  @ViewColumn()
  title: string;

  @ViewColumn()
  projectProposalStage: string;

  @ViewColumn()
  createdTime: number;

  @ViewColumn()
  creditBalance: number;

  @ViewColumn()
  creditRetired: number;

  @ViewColumn()
  sector: string;

  @ViewColumn()
  sectoralScope: string;

  @ViewColumn()
  companyId: number;

  @ViewColumn()
  name: string;

  @ViewColumn()
  logo: string;

  @ViewColumn()
  companyRole: string;
}
