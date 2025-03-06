import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ProjectProposalStage } from "../enum/projectProposalStage.enum";
import { TxType } from "../enum/txtype.enum";
import { BasicFieldsEntity } from "./basic.fields.entity";

@Entity()
export class ProjectEntity extends BasicFieldsEntity {
  @Column({ unique: true })
  refId: string;

  @Column()
  title: string;

  @Column({ type: "bigint" })
  companyId: number;

  @Column("bigint", { array: true, nullable: false })
  assigneeIds: number[];

  @Column({
    type: "enum",
    enum: ProjectProposalStage,
    array: false,
    nullable: true,
  })
  projectProposalStage: ProjectProposalStage;

  @Column({
    type: "enum",
    enum: TxType,
    array: false,
  })
  txType: TxType;

  @Column({ nullable: true })
  txRef: string;

  @Column({ type: "bigint" })
  txTime: number;
}
