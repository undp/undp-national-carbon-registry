import { Column, Entity, PrimaryColumn } from "typeorm";
import { TxType } from "../enum/txtype.enum";
import { CreditTransactionLedgerRecordDto } from "../dto/credit.transaction.ledger.record.dto";

@Entity()
export class CreditBlocksEntity {
  @PrimaryColumn()
  creditBlockId: string;

  @Column()
  txRef: string;

  @Column("jsonb", { array: false, nullable: true })
  txData?: any;

  @Column({
    type: "enum",
    enum: TxType,
    array: false,
  })
  txType: TxType;

  @Column({ type: "bigint" })
  txTime: number;

  @Column("jsonb", { array: false, default: [] })
  transactionRecords?: CreditTransactionLedgerRecordDto[];

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

  @Column({ type: "boolean", default: true })
  isNotTransferred: boolean;

  @Column({ default: 0 })
  reservedCreditAmount?: number;
}
