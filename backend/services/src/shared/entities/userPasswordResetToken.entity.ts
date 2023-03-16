import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { CompanyRole } from "../enum/company.role.enum";
import { CompanyState } from "../enum/company.state.enum";
import { EntitySubject } from "./entity.subject";

export class PasswordReset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column()
  token: string;

  @Column({ type: "bigint", nullable: true })
  createdTime: number;
}
