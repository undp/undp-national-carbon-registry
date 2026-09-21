import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";
import { EntitySubject } from "./entity.subject";

// An immutable record of one filing of an initial report, written only
// by submitReport.
//
// `snapshot` holds the whole filing — the report's general fields, every
// cooperative approach it covered, and each of those approaches' full
// authorized-entity set at that moment. Capturing the entities is what
// makes a minor version meaningful: 2.0 -> 2.1 differs only in an
// approach's entities, which live in another module's table and are not
// otherwise versioned.
@Entity()
@Unique(["reportNumber", "majorVersion", "minorVersion"])
export class InitialReportVersion extends EntitySubject {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  reportNumber: string;

  // A new cooperative approach bumps major and resets minor; an
  // amendment to an approach already on the report bumps minor.
  @Column({ type: "int" })
  majorVersion: number;

  @Column({ type: "int" })
  minorVersion: number;

  // The approach whose addition or amendment produced this version, when
  // one did. Null for a filing driven only by general-field edits.
  @Column({ type: "text", nullable: true })
  changedCooperativeApproachId?: string;

  @Column({ type: "text", nullable: true })
  submittedBy?: string;

  @Column({ type: "bigint" })
  submittedTime: number;

  @Column("jsonb", { array: false })
  snapshot: any;
}
