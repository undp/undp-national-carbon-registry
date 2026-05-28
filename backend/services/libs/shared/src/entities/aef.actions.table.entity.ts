import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { TxType } from "../enum/txtype.enum";
import { AefActionTypeEnum } from "../enum/aef.action.type.enum";
import { AuthorizationPurpose } from "../enum/authorization.purpose.enum";

@Entity()
export class AefActionsTableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  creditBlockStartId: string;

  @Column()
  creditBlockEndId: string;

  @Column()
  creditAmount: number;

  @Column()
  vintage: string;

  @Column()
  sector: string;

  @Column()
  sectoralScope: string;

  @Column({ type: "bigint" })
  projectAuthorizationTime: number;

  @Column()
  authorizationId: string;

  @Column({ type: "bigint" })
  actionTime: number;

  @Column({ type: "enum", enum: AefActionTypeEnum })
  actionType: AefActionTypeEnum;

  @Column()
  aquiringParty: string;

  @Column({ nullable: true })
  cooperativeApproachId: string;

  @Column({ nullable: true })
  acquiringPartyCountryCode: string;

  @Column({
    type: "enum",
    enum: AuthorizationPurpose,
    array: false,
    nullable: true,
  })
  authorizationPurpose: AuthorizationPurpose;

  @Column({ type: "boolean", default: false })
  isFirstTransfer: boolean;

  @Column({ type: "decimal", nullable: true })
  cumulativeAmount: number;

  @Column({ type: "int", nullable: true })
  reportingYear: number;

  @Column({ type: "bigint" })
  createdTime: number;

  @BeforeInsert()
  handleInsertMetadata() {
    const timestamp = new Date().getTime();
    this.createdTime = timestamp;
  }
}
