import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { EntitySubject } from "./entity.subject";
import { AuthorizedEntityStatus } from "../enum/authorized.entity.status.enum";

// An entity (company / organisation) authorized to act under a
// cooperative approach — field set modeled on the AEF v2 "Authorized
// entities" table. Removal is a soft state change to Inactive so the
// authorization history stays in the system.
@Entity()
export class CaAuthorizedEntity extends EntitySubject {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  cooperativeApproachId: string;

  @Column()
  entityName: string;

  @Column({ type: "text", nullable: true })
  entityIdentifier?: string;

  @Column({ type: "text", nullable: true })
  authorizingParty?: string;

  // Country the entity is incorporated in. Required at the DTO layer
  // for new rows; nullable here so pre-existing rows survive.
  @Column({ type: "text", nullable: true })
  countryOfIncorporation?: string;

  @Column({ type: "bigint", nullable: true })
  authorizationDate?: number;

  @Column({ type: "text", nullable: true })
  authorizationReference?: string;

  @Column({
    type: "enum",
    enum: AuthorizedEntityStatus,
    array: false,
    default: AuthorizedEntityStatus.ACTIVE,
  })
  status: AuthorizedEntityStatus;

  @Column({ type: "bigint" })
  createdTime: number;

  @Column({ type: "bigint" })
  updatedTime: number;

  @BeforeInsert()
  async timestampAtInsert() {
    const timestamp = new Date().getTime();
    this.createdTime = timestamp;
    this.updatedTime = timestamp;
  }
}
