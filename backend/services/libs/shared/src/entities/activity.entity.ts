import {
  BeforeInsert,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ActivityStateEnum } from "../enum/activity.state.enum";

@Entity()
export class ActivityEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ nullable: true })
  refId?: string;

  @Column()
  projectRefId: string;

  @Column()
  version: number;

  @Column({ type: "enum", enum: ActivityStateEnum, nullable: false })
  state: ActivityStateEnum;

  @BeforeInsert()
  generateRefId() {
    this.refId = `A-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
}
