import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { EntitySubject } from "./entity.subject";

@Entity()
export class MarketTradeExecutionEntity implements EntitySubject {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  creditTransactionId?: string;

  @Column({ nullable: true })
  creditBlockId?: string;

  @Column({ nullable: false })
  sellerCompanyId: number;

  @Column({ nullable: false })
  buyerCompanyId: number;

  @Column({ nullable: false })
  projectRefId: string;

  @Column({ nullable: true })
  serialNumber?: string;

  @Column({ type: "decimal", precision: 20, scale: 4 })
  amount: number;

  @Column({ type: "decimal", precision: 20, scale: 4 })
  unitPrice: number;

  @Column({ type: "decimal", precision: 20, scale: 4 })
  totalPrice: number;

  @Column({ default: "CNY" })
  currency: string;

  @Column({ type: "timestamptz" })
  tradeTime: Date;

  @Column({ default: "SETTLED_OFFLINE" })
  settlementStatus: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdTime: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedTime: Date;
}
