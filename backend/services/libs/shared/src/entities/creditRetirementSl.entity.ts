import { BeforeInsert, Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { EntitySubject } from "./entity.subject";
import { RetirementStatusSl } from "../enum/retirementStatusSl.enum";
import { CreditType } from "../enum/creditType.enum";

@Entity()
export class CreditRetirementSl implements EntitySubject {
  @PrimaryColumn()
  requestId: string;

  @Column()
  programmeId: string;

  @Column({
      type: "enum",
      enum: CreditType,
      array: false,
      nullable: false
  })
  creditType: CreditType;

  @Column()
  fromCompanyId: number;

  @Column({nullable: true})
  toCompanyId: number;

  @Column("real")
  creditAmount: number;

  @Column({nullable: true})
  comment: string;

  @Column({nullable: true})
  txRef: string;

  @Column({type: "bigint"})
  txTime: number;

  @Column({type: "bigint", nullable: true})
  createdTime: number;

  @Column({type: "bigint", nullable: true})
  approvedTime: number;

  @Column({
      type: "enum",
      enum: RetirementStatusSl,
      array: false
  })
  status: RetirementStatusSl;

  @Column({nullable: true})
  voluntaryCancelationCertificateUrl: string;

  @BeforeInsert()
  async createTime() {
    this.createdTime = new Date().getTime();
    this.txTime = new Date().getTime();
  }

  // @BeforeUpdate()
  // async updateTime() {
  //   this.updatedTime = new Date().getTime();
  // }
}
