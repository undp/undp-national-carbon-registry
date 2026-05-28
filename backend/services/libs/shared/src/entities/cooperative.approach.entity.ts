import { Entity, Column, PrimaryColumn } from "typeorm";
import { EntitySubject } from "./entity.subject";
import { CooperativeApproachStatus } from "../enum/cooperative.approach.status.enum";

@Entity()
export class CooperativeApproach extends EntitySubject {
  @PrimaryColumn()
  cooperativeApproachId: string;

  @Column()
  title: string;

  @Column("varchar", { array: true })
  participatingParties: string[];

  @Column()
  hostParty: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "bigint", nullable: true })
  startDate: number;

  @Column({ type: "bigint", nullable: true })
  endDate: number;

  @Column({ type: "text", nullable: true })
  expectedMitigationOutcomes: string;

  @Column({ type: "text", nullable: true })
  environmentalIntegrityAssessment: string;

  @Column({ type: "text", nullable: true })
  ndcLink: string;

  @Column({
    type: "enum",
    enum: CooperativeApproachStatus,
    array: false,
    default: CooperativeApproachStatus.DRAFT,
  })
  status: CooperativeApproachStatus;

  @Column({ nullable: true })
  authorizationDocumentUrl: string;

  @Column({ type: "bigint" })
  createdTime: number;

  @Column({ type: "bigint" })
  updatedTime: number;
}
