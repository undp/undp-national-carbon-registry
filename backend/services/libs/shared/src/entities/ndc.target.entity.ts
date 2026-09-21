import { Entity, Column, Unique, PrimaryGeneratedColumn } from "typeorm";
import { EntitySubject } from "./entity.subject";
import { NdcType } from "../enum/ndc.type.enum";

// The country's Nationally Determined Contribution target for one NDC
// implementation period.
//
// This holds the *inputs* only — one row per (period, country). The
// per-year targets are derived from it by the ndc_target_yearly view,
// which interpolates a straight line from (baseYear, baseYearEmission)
// to (targetYear, ndcTarget). Storing inputs once rather than repeating
// them on a row per year is what that view buys.
//
// Written by InitialReportService.submitReport — a submitted initial
// report is the authoritative source for this data. Rows may also still
// be migrated in from outside the registry, in which case
// sourceReportNumber is null.
@Entity()
@Unique(["ndcStartYear", "ndcEndYear", "country"])
export class NdcTarget implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ nullable: false })
  country: string;

  @Column({
    type: "enum",
    enum: NdcType,
    array: false,
  })
  ndcType: NdcType;

  // The span of years the view emits a target for.
  @Column({ type: "int", nullable: false })
  ndcStartYear: number;

  @Column({ type: "int", nullable: false })
  ndcEndYear: number;

  // Trajectory origin. baseYearEmission is copied from Emission at
  // submit rather than joined live, so correcting an emission later
  // cannot retroactively move targets that were already filed.
  @Column({ type: "int", nullable: true })
  baseYear?: number;

  @Column({ type: "decimal", precision: 15, scale: 5, nullable: true })
  baseYearEmission?: number;

  // Trajectory destination: the year ndcTarget applies to, normally
  // ndcEndYear. Meaningful when ndcType = SingleYear.
  @Column({ type: "int", nullable: true })
  targetYear?: number;

  @Column({ type: "decimal", precision: 15, scale: 5, nullable: true })
  ndcTarget?: number;

  // Meaningful when ndcType = MultiYear. Retained and unwritten: the
  // registry does not support MultiYear NDCs yet, but keeping the
  // columns means enabling them later is a formula branch in the view,
  // not a migration.
  @Column({ type: "int", nullable: true })
  budgetPeriodStartYear?: number;

  @Column({ type: "int", nullable: true })
  budgetPeriodEndYear?: number;

  @Column({ type: "decimal", precision: 15, scale: 5, nullable: true })
  cumulativeBudget?: number;

  // Provenance: the initial report that filed this row, or null if the
  // row was migrated in from outside the registry.
  @Column({ type: "text", nullable: true })
  sourceReportNumber?: string;

  @Column({ nullable: true })
  remarks?: string;

  @Column({ type: "timestamptz", nullable: true })
  createdAt: Date;

  @Column({ type: "timestamptz", nullable: true })
  updatedAt: Date;
}
