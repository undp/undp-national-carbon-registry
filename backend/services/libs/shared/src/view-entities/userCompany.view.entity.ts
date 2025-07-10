import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
  expression: `
    SELECT 
      u.id, 
      u.name, 
      u."companyRole",  
      c."name" AS "companyName"
    FROM "user" u
    LEFT JOIN "company" c ON u."companyId" = c."companyId"
  `,
})
export class UserCompanyViewEntity {
  @ViewColumn()
  id: number;

  @ViewColumn()
  name: string;

  @ViewColumn()
  companyRole: string;

  @ViewColumn()
  companyName: string;
}
