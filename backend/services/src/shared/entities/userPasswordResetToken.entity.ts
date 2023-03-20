import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { CompanyRole } from "../enum/company.role.enum";
import { CompanyState } from "../enum/company.state.enum";
import { EntitySubject } from "./entity.subject";

@Entity()
export class PasswordReset implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  token: string;

  @Column({ type: "bigint", nullable: true })
  expireTime: number;
}
