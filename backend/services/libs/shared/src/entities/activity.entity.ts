import {
  BeforeInsert,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ActivityStateEnum } from "../enum/activity.state.enum";
import { ActivityVintageCreditsDto } from "../dto/activty.vintage.credits.dto";

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

  @Column("jsonb", { array: false, default: [] })
  creditAmounts: ActivityVintageCreditsDto[];

  @Column("jsonb", { array: false, default: [] })
  creditIssued: ActivityVintageCreditsDto[];

  @BeforeInsert()
  generateRefId() {
    this.refId = `A-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
}
