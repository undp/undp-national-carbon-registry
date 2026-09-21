import { Column, Entity, PrimaryColumn, Unique } from "typeorm";
import { EntitySubject } from "./entity.subject";
import { NdcType } from "../enum/ndc.type.enum";
import { CaMethod } from "../enum/ca.method.enum";
import { CaStatus } from "../enum/ca.status.enum";

// Exactly one corresponding adjustment per reporting year. No country
// column: this registry is single-country (configService "systemCountry"
// scopes every query in the service), so the year alone is the natural
// key. If the registry ever became multi-tenant this would need to
// become UNIQUE (year, country).
//
// The uniqueness is what makes the reconciliation summary meaningful —
// it sums emissionsBalance across every row, so before this constraint a
// repeated Calculate silently double-counted the gap.
@Entity()
@Unique("UQ_corresponding_adjustment_year", ["year"])
export class CorrespondingAdjustment extends EntitySubject {
  @PrimaryColumn()
  caId: string;

  @Column({ type: "int" })
  year: number;

  // Legacy: adjustments are registry-wide per year and this is no longer
  // written on new rows. Retained so existing values survive.
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

  // Cumulative first-transferred ITMOs (net of acquired) from the
  // period's start year through this record's year, inclusive. Written
  // for a MultiYear budget period, and for a SingleYear NDC period
  // under the Averaging method — the same quantity either way.
  @Column({ type: "decimal", precision: 15, scale: 5, nullable: true })
  cumulativeFirstTransferred?: number;

  // MultiYear only: cumulativeFirstTransferred / elapsed years —
  // Decision 2/CMA.3's indicative annual corresponding adjustment.
  // SingleYear leaves this null and uses appliedAdjustment instead.
  @Column({ type: "decimal", precision: 15, scale: 5, nullable: true })
  indicativeAnnualAdjustment?: number;

  // The adjustment actually applied for this year — the "Corresponding
  // adjustment" row of the period table, for BOTH methods:
  //   Trajectory: this year's raw emissionsBalance.
  //   Averaging:  cumulativeFirstTransferred / elapsed years, i.e. the
  //               running average across the NDC period so far.
  // One canonical column so the period query and the list page need no
  // CASE on caMethod.
  @Column({ type: "decimal", precision: 15, scale: 5, nullable: true })
  appliedAdjustment?: number;

  // The reporting year's actual emissions, entered on the calculate
  // form. Collected directly rather than read from the Emission table
  // so a calculation never depends on a separate inventory record
  // existing — same rationale as baseYearEmission on the initial report.
  @Column({ type: "decimal", precision: 15, scale: 5, nullable: true })
  reportingYearEmission?: number;

  @Column({ type: "decimal", precision: 15, scale: 5, nullable: true })
  ndcTarget: number;

  // reportingYearEmission + appliedAdjustment.
  @Column({ type: "decimal", precision: 15, scale: 5, nullable: true })
  adjustedEmissions: number;

  @Column({ type: "boolean", default: false })
  safeguardCheckPassed: boolean;

  @Column({ type: "text", nullable: true })
  safeguardNotes: string;

  // Free-text admin annotation, editable while Draft — distinct from
  // the system-computed safeguardNotes.
  @Column({ type: "text", nullable: true })
  remarks?: string;

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
