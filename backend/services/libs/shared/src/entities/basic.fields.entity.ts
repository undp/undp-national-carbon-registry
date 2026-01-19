import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { NumberTransformer } from "../functions/number.transformer.decorator";

export class BasicFieldsEntity {
  @Column({ type: "bigint", transformer: NumberTransformer })
  createTime: number;

  @Column({ type: "bigint", transformer: NumberTransformer })
  updateTime: number;

  @BeforeUpdate()
  async timestampAtUpdate() {
    this.updateTime = new Date().getTime();
  }

  @BeforeInsert()
  async timestampAtInsert() {
    const timestamp = new Date().getTime();
    this.createTime = timestamp;
    this.updateTime = timestamp;
  }
}
