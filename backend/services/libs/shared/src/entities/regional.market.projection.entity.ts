import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { EntitySubject } from "./entity.subject";

@Entity()
export class RegionalMarketProjectionEntity implements EntitySubject {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: false })
  projectionKey: string;

  @Column({ type: "jsonb", nullable: false })
  data: Record<string, any>;

  @CreateDateColumn({ type: "timestamptz" })
  createdTime: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedTime: Date;
}
