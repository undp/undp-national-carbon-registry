import { Column, Entity, PrimaryColumn } from "typeorm";
import { TxType } from "../enum/txtype.enum";

@Entity()
export class CreditBlocksEntity {
  @PrimaryColumn()
  creditBlockId: string;

  @Column()
  txRef: string;

  @Column({
    type: "enum",
    enum: TxType,
    array: false,
  })
  txType: TxType;

  @Column({ type: "bigint" })
  txTime: number;

  @Column({ type: "bigint", nullable: true })
  previousOwnerCompanyId?: number;

  @Column({ type: "bigint" })
  ownerCompanyId: number;

  @Column({ type: "text" })
  projectRefId: string;

  @Column({ type: "text" })
  serialNumber: string;

  @Column({ type: "text" })
  vintage: string;

  @Column()
  creditAmount: number;

  @Column({ default: 0 })
  reservedCreditAmount?: number;
}
