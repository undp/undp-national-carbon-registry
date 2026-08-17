import { Column, Entity, PrimaryColumn } from "typeorm";
import { EntitySubject } from "./entity.subject";
import { InitialReportStatus } from "../enum/initial.report.status.enum";

@Entity()
export class InitialReport extends EntitySubject {
  @PrimaryColumn()
  reportId: string;

  @Column()
  cooperativeApproachId: string;

  // Append-only audit versioning: every edit of a draft report saves a
  // NEW row with version + 1 instead of mutating the previous one. The
  // row with MAX(version) per cooperativeApproachId is the live report;
  // older rows are read-only history.
  @Column({ type: "int", default: 1 })
  version: number;

  @Column({
    type: "enum",
    enum: InitialReportStatus,
    array: false,
    default: InitialReportStatus.DRAFT,
  })
  status: InitialReportStatus;

  @Column("jsonb", { array: false, nullable: true })
  participationDemonstration: any;

  @Column("jsonb", { array: false, nullable: true })
  itmoMetrics: any;

  @Column({ type: "text", nullable: true })
  caMethodDescription: string;

  @Column("jsonb", { array: false, nullable: true })
  ndcQuantification: any;

  @Column("jsonb", { array: false, nullable: true })
  cooperativeApproachDetails: any;

  @Column("jsonb", { array: false, nullable: true })
  environmentalIntegrity: any;

  @Column({ nullable: true })
  generatedDocumentUrl: string;

  @Column({ type: "bigint" })
  createdTime: number;

  @Column({ type: "bigint" })
  updatedTime: number;
}
