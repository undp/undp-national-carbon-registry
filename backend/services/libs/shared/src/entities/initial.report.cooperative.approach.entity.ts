import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";
import { EntitySubject } from "./entity.subject";

// Links a cooperative approach to the initial report that covers it.
//
// One row per (report, approach) for the life of the report — NOT one
// per version. Which versions a link was live for is reconstructed from
// addedInMajor/removedInMajor, so nothing has to be copied forward when
// a new version is filed.
//
// cooperativeApproachId is globally unique: an approach belongs to
// exactly one initial report. That is a real database constraint here
// only because links are not duplicated across versions.
@Entity()
@Unique(["cooperativeApproachId"])
export class InitialReportCooperativeApproach extends EntitySubject {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  reportNumber: string;

  @Column()
  cooperativeApproachId: string;

  // The major version that introduced this link. NULL means it was added
  // since the last submit and has not been filed yet — which is exactly
  // what tells submitReport whether to bump major or minor.
  @Column({ type: "int", nullable: true })
  addedInMajor?: number;

  // Set instead of deleting, so an earlier version still renders the
  // approach set it was filed with.
  @Column({ type: "int", nullable: true })
  removedInMajor?: number;

  // The approach's scalar fields as they stood when it was added,
  // preserving the audit value the old initial_report.cooperativeApproachDetails
  // column carried.
  @Column("jsonb", { array: false, nullable: true })
  cooperativeApproachDetails: any;

  @Column({ type: "bigint" })
  createdTime: number;

  @BeforeInsert()
  async timestampAtInsert() {
    this.createdTime = new Date().getTime();
  }
}
