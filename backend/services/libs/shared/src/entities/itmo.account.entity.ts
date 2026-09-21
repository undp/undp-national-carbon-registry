import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { EntitySubject } from "./entity.subject";
import { AccountType } from "../enum/account.type.enum";

@Entity()
export class ItmoAccount extends EntitySubject {
  @PrimaryGeneratedColumn("uuid")
  accountId: string;

  @Column({ type: "bigint" })
  companyId: number;

  @Column({
    type: "enum",
    enum: AccountType,
    array: false,
  })
  accountType: AccountType;

  @Column({ type: "decimal", precision: 15, scale: 5, default: 0 })
  balance: number;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "bigint" })
  createdTime: number;

  @Column({ type: "bigint" })
  updatedTime: number;

  @BeforeInsert()
  async timestampAtInsert() {
    const timestamp = new Date().getTime();
    this.createdTime = timestamp;
    this.updatedTime = timestamp;
  }
}
