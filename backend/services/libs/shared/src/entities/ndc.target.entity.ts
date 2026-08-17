import { Entity, Column, Unique, PrimaryGeneratedColumn } from "typeorm";
import { EntitySubject } from "./entity.subject";
import { NdcType } from "../enum/ndc.type.enum";

// The country's Nationally Determined Contribution target(s), one row
// per year (mirrors Emission's shape exactly, including for multi-year
// budget periods — every year within the period gets its own row
// carrying the same budgetPeriodStartYear/EndYear/cumulativeBudget, so
// a lookup is always a single (year, country) query with no BETWEEN
// logic needed).
//
// Like Emission, this has no in-app write path — NDC targets are
// defined outside the registry and are expected to be migrated in
// periodically, not entered through a UI.
@Entity()
@Unique(["year", "country"])
export class NdcTarget implements EntitySubject {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ nullable: false })
  country: string;

  @Column({ nullable: false })
  year: string;

  @Column({
    type: "enum",
    enum: NdcType,
    array: false,
  })
  ndcType: NdcType;

  // Meaningful when ndcType = SingleYear: this year's emissions ceiling.
  @Column({ type: "decimal", precision: 15, scale: 5, nullable: true })
  singleYearTarget?: number;

  // Meaningful when ndcType = MultiYear.
  @Column({ type: "int", nullable: true })
  budgetPeriodStartYear?: number;

  @Column({ type: "int", nullable: true })
  budgetPeriodEndYear?: number;

  // Total ceiling across [budgetPeriodStartYear, budgetPeriodEndYear] —
  // the same value repeated on every year-row within the period.
  @Column({ type: "decimal", precision: 15, scale: 5, nullable: true })
  cumulativeBudget?: number;

  @Column({ nullable: true })
  remarks?: string;

  @Column({ type: "timestamptz", nullable: true })
  createdAt: Date;

  @Column({ type: "timestamptz", nullable: true })
  updatedAt: Date;
}
