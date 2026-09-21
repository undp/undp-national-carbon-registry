import { Column, Entity, PrimaryColumn } from "typeorm";
import { EntitySubject } from "./entity.subject";
import { InitialReportStatus } from "../enum/initial.report.status.enum";
import { NdcType } from "../enum/ndc.type.enum";
import { CaMethod } from "../enum/ca.method.enum";

// A Party's initial report under Dec 2/CMA.3 para 18, scoped to an NDC
// implementation period rather than to a single cooperative approach.
// One report covers every approach the Party participates in during that
// period; the approaches hang off initial_report_cooperative_approach.
//
// This row is MUTABLE — it is the live working document. Each submission
// freezes a full copy into initial_report_version, so history lives
// there rather than in extra rows here. That keeps reportNumber a stable
// permalink and removes the copy-forward that append-only versioning
// would need on every field.
@Entity()
// No two reports may cover overlapping NDC periods, enforced from the
// moment both years are set — Draft included, not just at submit. This
// is a GIST exclusion constraint (over the inclusive integer range, not
// an exact-tuple match — see EXCL_initial_report_ndc_period_overlap in
// the migration), which TypeORM's @Index decorator can't express, so it
// is applied only there rather than kept in sync by `synchronize`. See
// InitialReportService.assertPeriodAvailable for the application-level
// check that turns a violation into a message naming the report already
// holding the overlapping period.
export class InitialReport extends EntitySubject {
  // Stable for the life of the report — the router key and the join key
  // for both child tables.
  @PrimaryColumn()
  reportNumber: string;

  // The NDC implementation period this report covers. Held as plain
  // years while drafting; on submit the report claims (or creates) the
  // matching ndc_details_period row and records its id here. The unique
  // constraint on that id is what enforces one report per period.
  @Column({ type: "int", nullable: true })
  ndcStartYear: number;

  @Column({ type: "int", nullable: true })
  ndcEndYear: number;

  @Column({ type: "int", nullable: true, unique: true })
  ndcPeriodId: number;

  @Column({
    type: "enum",
    enum: NdcType,
    array: false,
    nullable: true,
  })
  ndcType: NdcType;

  // Base year the NDC target is measured against.
  @Column({ type: "int", nullable: true })
  baseYear: number;

  // The emission value AT baseYear — collected on the report itself
  // (rather than looked up from the separate Emission domain) so filing
  // a report never depends on someone having entered an Emission record
  // for that year first. Frozen onto ndc_target.baseYearEmission at
  // submit, which is what the yearly trajectory interpolates from.
  @Column({ type: "decimal", precision: 15, scale: 5, nullable: true })
  baseYearEmission: number;

  @Column({ type: "decimal", precision: 15, scale: 5, nullable: true })
  ndcTarget: number;

  @Column({
    type: "enum",
    enum: CaMethod,
    array: false,
    nullable: true,
  })
  caMethod: CaMethod;

  @Column({ type: "text", nullable: true })
  caMethodDescription: string;

  // Free-form rather than an enum array: values predating this column
  // came from a free-text tag input and are not all valid Sector
  // members. Validated in the service instead.
  @Column("varchar", { array: true, nullable: true })
  sectors: string[];

  @Column("jsonb", { array: false, nullable: true })
  participationDemonstration: any;

  @Column("jsonb", { array: false, nullable: true })
  itmoMetrics: any;

  @Column("jsonb", { array: false, nullable: true })
  environmentalIntegrity: any;

  @Column({
    type: "enum",
    enum: InitialReportStatus,
    array: false,
    default: InitialReportStatus.DRAFT,
  })
  status: InitialReportStatus;

  // The last version actually filed. 0.0 until the first submit; a new
  // cooperative approach bumps major, an amendment to an existing one
  // bumps minor.
  @Column({ type: "int", default: 0 })
  majorVersion: number;

  @Column({ type: "int", default: 0 })
  minorVersion: number;

  @Column({ nullable: true })
  generatedDocumentUrl: string;

  @Column({ type: "bigint" })
  createdTime: number;

  @Column({ type: "bigint" })
  updatedTime: number;
}
