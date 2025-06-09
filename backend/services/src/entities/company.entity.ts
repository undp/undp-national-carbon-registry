import { BeforeInsert, Column, Entity, PrimaryColumn } from "typeorm";
import { CompanyRole } from "../enum/company.role.enum";
import { CompanyState } from "../enum/company.state.enum";
import { EntitySubject } from "./entity.subject";
import { SectoralScope } from "@undp/serial-number-gen";
import { Ministry } from "../enum/ministry.enum";
import { GovDepartment } from "../enum/govDep.enum";

@Entity()
export class Company implements EntitySubject {
  @PrimaryColumn()
  companyId: number;

  @Column({ unique: true, nullable: true })
  taxId: string;

  @Column({ unique: true, nullable: true })
  paymentId: string;

  @Column()
  name: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  phoneNo: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  country: string;

  @Column({
    type: "enum",
    enum: CompanyRole,
    array: false
  })
  companyRole: CompanyRole;


  @Column({
    type: "enum",
    enum: CompanyState,
    array: false,
    default: CompanyState.ACTIVE,
  })
  state: CompanyState;

  @Column("real", { nullable: true })
  creditBalance: number;

  @Column({
    type: "jsonb",
    array: false,
    nullable: true,
  })
  secondaryAccountBalance: any;

  @Column("bigint", { nullable: true })
  programmeCount: number;

  @Column("bigint", { nullable: true })
  lastUpdateVersion: number;

  @Column("bigint", { nullable: true })
  creditTxTime: number;

  @Column({ nullable: true })
  remarks: string;

  @Column({ type: "bigint", nullable: true })
  createdTime: number;

  @Column({
    type: "jsonb",
    array: false,
    nullable: true,
  })
  geographicalLocationCordintes: any;

  @Column("varchar", { array: true, nullable: true })
  regions: string[];

  @Column({ nullable: true })
  nameOfMinister: string;

  @Column("varchar", { array: true, nullable: true })
  sectoralScope: SectoralScope[];

  @Column({ type: "bigint", nullable: true})
  omgePercentage: number;

  @Column({ type: "bigint", nullable: true })
  nationalSopValue: number;
  
  @Column({
    nullable: true,
    type: "enum",
    enum: Ministry,
    array: false, 
  })
  ministry: Ministry;

  @Column({
    nullable: true,
    type: "enum",
    enum: GovDepartment,
    array: false,
  })
  govDep: GovDepartment;

  @BeforeInsert()
  setDefaultState() {
    if (
      this.companyRole === CompanyRole.GOVERNMENT ||
      this.companyRole === CompanyRole.CERTIFIER
    ) {
      this.programmeCount = null;
    } else if (this.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
      this.programmeCount = 0;
    }
    if (
      this.companyRole === CompanyRole.GOVERNMENT ||
      this.companyRole === CompanyRole.PROGRAMME_DEVELOPER
    ) {
      this.creditBalance = 0;
    } else if (this.companyRole === CompanyRole.CERTIFIER) {
      this.creditBalance = null;
    }
    if (this.companyRole === CompanyRole.GOVERNMENT){
      this.omgePercentage=1;
    }
    if (this.companyRole === CompanyRole.GOVERNMENT){
      this.nationalSopValue=0;
    }
  }
}
