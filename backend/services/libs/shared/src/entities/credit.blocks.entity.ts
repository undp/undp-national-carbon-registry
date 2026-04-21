import { BeforeInsert, Column, Entity, PrimaryColumn } from "typeorm";
import { TxType } from "../enum/txtype.enum";
import { AuthorizationPurpose } from "../enum/authorization.purpose.enum";
import { AccountType } from "../enum/account.type.enum";
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

  // Dec 6/CMA.4 Annex I para 5: each ITMO must have a unique
  // 5-component identifier (originating Party / ITMO type / vintage /
  // mitigation activity / unique sequence). Immutable per Draft -/CMA.5
  // para 132 — split-not-mutate preserves it. Nullable so legacy blocks
  // issued prior to this column landing don't block migration.
  @Column({ type: "text", nullable: true })
  itmoSerial?: string;

  @Column({ type: "text" })
  vintage: string;

  @Column()
  creditAmount: number;

  @Column({ type: "boolean", default: true })
  isNotTransferred: boolean;

  @Column({ default: 0 })
  reservedCreditAmount?: number;

  @Column({ type: "bigint" })
  createTime: number;

  @Column({ nullable: true })
  cooperativeApproachId: string;

  @Column({
    type: "enum",
    enum: AuthorizationPurpose,
    array: false,
    nullable: true,
  })
  authorizationPurpose: AuthorizationPurpose;

  @Column({
    type: "enum",
    enum: AccountType,
    array: false,
    default: AccountType.HOLDING,
  })
  accountType: AccountType;

  @Column({ type: "boolean", default: false })
  omgeDeductedAtIssuance: boolean;

  @Column({ type: "boolean", default: false })
  sopDeductedAtIssuance: boolean;

  @BeforeInsert()
  async timestampAtInsert() {
    const timestamp = new Date().getTime();
    this.createTime = timestamp;
  }
}
