import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { CreditTransactionTypesEnum } from "../enum/credit.transaction.types.enum";
import { CreditTransactionStatusEnum } from "../enum/credit.transaction.status.enum";

@Entity()
export class CreditTransactionsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "bigint" })
  senderId: number;

  @Column({ type: "bigint" })
  recieverId: number;

  @Column({ type: "enum", enum: CreditTransactionTypesEnum })
  type: CreditTransactionTypesEnum;

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
}
