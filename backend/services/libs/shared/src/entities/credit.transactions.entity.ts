import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { CreditTransactionTypesEnum } from "../enum/credit.transaction.types.enum";
import { CreditTransactionStatusEnum } from "../enum/credit.transaction.status.enum";
import { CreditRetirementTypeEnum } from "../enum/credit.retirement.type.enum";

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

  @Column({ type: "enum", enum: CreditRetirementTypeEnum, nullable: true })
  retirementType?: CreditRetirementTypeEnum;

  @Column({ type: "text", nullable: true })
  remarks?: string;

  @Column({ type: "text", nullable: true })
  country?: string;
}
