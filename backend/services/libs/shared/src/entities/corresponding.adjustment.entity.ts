import { Column, Entity, PrimaryColumn } from "typeorm";
import { EntitySubject } from "./entity.subject";
import { NdcType } from "../enum/ndc.type.enum";
import { CaMethod } from "../enum/ca.method.enum";
import { CaStatus } from "../enum/ca.status.enum";

@Entity()
export class CorrespondingAdjustment extends EntitySubject {
  @PrimaryColumn()
  caId: string;

  @Column({ type: "int" })
  year: number;

  @Column({ nullable: true })
  cooperativeApproachId: string;

  @Column({ default: "tCO2e" })
  metric: string;

  @Column({
    type: "enum",
    enum: NdcType,
    array: false,
  })
  ndcType: NdcType;

  @Column({
    type: "enum",
    enum: CaMethod,
    array: false,
  })
  caMethod: CaMethod;

  @Column({ type: "decimal", precision: 15, scale: 5, default: 0 })
  authorizedItmos: number;

  @Column({ type: "decimal", precision: 15, scale: 5, default: 0 })
  firstTransferredItmos: number;

  @Column({ type: "decimal", precision: 15, scale: 5, default: 0 })
  acquiredItmos: number;

  @Column({ type: "decimal", precision: 15, scale: 5, default: 0 })
  usedTowardsNdcItmos: number;

  @Column({ type: "decimal", precision: 15, scale: 5, default: 0 })
  cancelledItmos: number;

  @Column({ type: "decimal", precision: 15, scale: 5, default: 0 })
  emissionsBalance: number;

  @Column({ type: "decimal", precision: 15, scale: 5, nullable: true })
  ndcTarget: number;

  @Column({ type: "decimal", precision: 15, scale: 5, nullable: true })
  adjustedEmissions: number;

  @Column({ type: "boolean", default: false })
  safeguardCheckPassed: boolean;

  @Column({ type: "text", nullable: true })
  safeguardNotes: string;

  @Column({
    type: "enum",
    enum: CaStatus,
    array: false,
    default: CaStatus.DRAFT,
  })
  status: CaStatus;

  @Column({ type: "bigint" })
  createdTime: number;

  @Column({ type: "bigint" })
  updatedTime: number;
}
