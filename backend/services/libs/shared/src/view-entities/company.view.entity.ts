import { ViewColumn, ViewEntity } from "typeorm";

@ViewEntity({
  expression: `
    SELECT 
      c."companyId" as "refId", 
      c."taxId", 
      c."paymentId", 
      c."name", 
      c."email", 
      c."phoneNo", 
      c."faxNo", 
      c."website", 
      c."address", 
      c."logo", 
      c."country", 
      c."companyRole", 
      c."state", 
      c."creditBalance", 
      c."secondaryAccountBalance", 
      c."slcfAccountBalance", 
      c."programmeCount", 
      c."lastUpdateVersion", 
      c."creditTxTime", 
      c."remarks", 
      c."createdTime", 
      c."geographicalLocationCordintes", 
      c."provinces", 
      c."regions", 
      c."nameOfMinister", 
      c."sectoralScope", 
      c."omgePercentage", 
      c."nationalSopValue", 
      c."ministry", 
      c."govDep"
    FROM "company" c
  `,
})
export class CompanyViewEntity {
  @ViewColumn()
  refId: number;

  @ViewColumn()
  taxId: string;

  @ViewColumn()
  paymentId: string;

  @ViewColumn()
  name: string;

  @ViewColumn()
  email: string;

  @ViewColumn()
  phoneNo: string;

  @ViewColumn()
  faxNo: string;

  @ViewColumn()
  website: string;

  @ViewColumn()
  address: string;

  @ViewColumn()
  logo: string;

  @ViewColumn()
  country: string;

  @ViewColumn()
  companyRole: string;

  @ViewColumn()
  state: string;

  @ViewColumn()
  creditBalance: number;

  @ViewColumn()
  secondaryAccountBalance: object;

  @ViewColumn()
  slcfAccountBalance: object;

  @ViewColumn()
  programmeCount: number;

  @ViewColumn()
  lastUpdateVersion: number;

  @ViewColumn()
  creditTxTime: number;

  @ViewColumn()
  remarks: string;

  @ViewColumn()
  createdTime: number;

  @ViewColumn()
  geographicalLocationCordintes: object;

  @ViewColumn()
  provinces: string[];

  @ViewColumn()
  regions: string[];

  @ViewColumn()
  nameOfMinister: string;

  @ViewColumn()
  sectoralScope: string[];

  @ViewColumn()
  omgePercentage: number;

  @ViewColumn()
  nationalSopValue: number;

  @ViewColumn()
  ministry: string;

  @ViewColumn()
  govDep: string;
}
