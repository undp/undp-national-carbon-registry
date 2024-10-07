import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { EntitySubject } from "./entity.subject";
import { VerificationRequestStatusEnum } from "src/enum/verification.request.status.enum";

@Entity()
export class VerificationRequestEntity implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  programmeId: string;

  @Column()
  userId: number;

  @Column({
    type: "enum",
    enum: VerificationRequestStatusEnum,
  })
  status: VerificationRequestStatusEnum;

  @Column({ type: "bigint" })
  createdTime: number;

  @Column({ type: "bigint" })
  updatedTime: number;
}
