import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { EntitySubject } from "./entity.subject";
import { ProgrammeAuditLogType } from "../enum/programmeAuditLogType.enum";

@Entity()
export class ProgrammeAuditLogSl implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  programmeId: string;

  @Column({
      type: "enum",
      enum: ProgrammeAuditLogType,
      array: false,
      nullable: false
  })
  logType: ProgrammeAuditLogType;

  @Column({
    type: "jsonb",
    array: false,
    nullable: true,
  })
  data: any

  @Column({ nullable: false })
  userId: number;

  @Column({type: "bigint", nullable: false})
  createdTime: number;

  @BeforeInsert()
  async createTime() {
    this.createdTime = new Date().getTime();
  }
}
