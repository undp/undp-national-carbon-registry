import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

import { AefSubmissionStatus } from '../../tables/aefT1Submission';

/**
 * AEF Table 1 — Submission.
 *
 * The root of the schema: it has no outbound links, and every other table
 * references it. That is also how a Holdings or Actions row knows its reporting
 * year — CMA.6 gives those tables no year column of their own.
 *
 * The unique constraint spans **version** as well as party and year: a revision
 * creates a new row for the same year, so `(party, year)` alone would block
 * every correction. What it still guarantees is that a cron tick and an operator
 * button cannot both insert version 1.0 for the same year.
 */
@Entity('aef_v2_t1_submission')
@Unique('UQ_aef_v2_t1_submission_party_year_version', [
  'aefT1SubmissionParty',
  'aefT1SubmissionReportYear',
  'aefT1SubmissionVersion',
])
export class AefV2T1SubmissionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 8 })
  aefT1SubmissionParty: string;

  @Column({ type: 'varchar', length: 16 })
  aefT1SubmissionVersion: string;

  @Column({ type: 'int' })
  aefT1SubmissionReportYear: number;

  @Column({ type: 'varchar', length: 32, nullable: true })
  aefT1SubmissionSubmissionDate?: string;

  /** CARP-populated. Present so a synced value can be read back, never written. */
  @Column({ type: 'text', nullable: true })
  aefT1SubmissionReviewStatus?: string;

  @Column({ type: 'text', nullable: true })
  aefT1SubmissionResultCheck?: string;

  @Column({ type: 'int', nullable: true })
  aefT1SubmissionNdcFirstYear?: number;

  @Column({ type: 'int', nullable: true })
  aefT1SubmissionNdcLastYear?: number;

  @Column({ type: 'text', nullable: true })
  aefT1SubmissionReferenceReviewReport?: string;

  /** Library metadata — local workflow state, never exported to the AEF file. */
  @Column({
    type: 'enum',
    enum: AefSubmissionStatus,
    default: AefSubmissionStatus.DRAFT,
  })
  status: AefSubmissionStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
