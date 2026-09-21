import {
  BeforeInsert,
  Column,
  Entity,
  PrimaryColumn,
} from "typeorm";
import { CreditTransactionTypesEnum } from "../enum/credit.transaction.types.enum";
import { CreditTransactionSubTypesEnum } from "../enum/credit.transaction.sub.types.enum";
import { CreditTransactionStatusEnum } from "../enum/credit.transaction.status.enum";
import { AccountType } from "../enum/account.type.enum";
import { CreditTransactionData } from "../dto/credit.transaction.data.types";

@Entity()
export class CreditTransactionsEntity {
  @PrimaryColumn()
  id: string;

  @Column({ type: "bigint", nullable: true })
  senderId?: number;

  @Column({ type: "bigint" })
  recieverId: number;

  @Column({ type: "enum", enum: CreditTransactionTypesEnum })
  type: CreditTransactionTypesEnum;

  @Column({
    type: "enum",
    enum: CreditTransactionSubTypesEnum,
    nullable: true,
  })
  subType?: CreditTransactionSubTypesEnum;

  @Column({ type: "enum", enum: CreditTransactionStatusEnum })
  status: CreditTransactionStatusEnum;

  @Column({ type: "text" })
  creditBlockId: string;

  @Column({ type: "text" })
  serialNumber: string;

  @Column()
  amount: number;

  @Column({ type: "text" })
  projectRefId: string;

  // Type+subType-specific payload; see credit.transaction.data.types.ts
  // for the shape each type/subType combination carries.
  @Column("jsonb", { array: false, nullable: true })
  data?: CreditTransactionData;

  @Column({
    type: "enum",
    enum: AccountType,
    array: false,
    nullable: true,
  })
  fromAccountType?: AccountType;

  @Column({
    type: "enum",
    enum: AccountType,
    array: false,
    nullable: true,
  })
  toAccountType?: AccountType;

  @Column({ type: "boolean", default: false })
  isFirstTransfer: boolean;

  @Column({ type: "bigint" })
  createTime: number;

  @BeforeInsert()
  async timestampAtInsert() {
    const timestamp = new Date().getTime();
    this.createTime = timestamp;
  }
}
