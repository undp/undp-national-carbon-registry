import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { EntitySubject } from "./entity.subject";
import { DocumentStatus } from "../enum/document.status";
import { DocumentTypeEnum } from "../enum/document.type.enum";

@Entity()
export class DocumentEntity implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  programmeId: string;

  @Column({ nullable: true })
  verificationRequestId: number;

  @Column()
  userId: number;

  @Column()
  companyId: number;

  @Column()
  version: number;

  @Column({
    type: "enum",
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @Column({
    type: "enum",
    enum: DocumentTypeEnum,
  })
  type: DocumentTypeEnum;

  @Column({
    type: "jsonb",
    array: false,
    nullable: true,
  })
  content: string;

  @Column({ type: "bigint" })
  createdTime: number;

  @Column({ type: "bigint" })
  updatedTime: number;
}
