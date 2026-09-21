import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { AefV2T1SubmissionEntity } from './aef-v2-t1-submission.entity';
import type { AefV2T2AuthorizationsEntity } from './aef-v2-t2-authorizations.entity';

/**
 * AEF Table 5 — Authorized entities.
 *
 * The other half of the **circular relation with Table 2** — see that entity for
 * the insert-order consequence.
 */
@Entity('aef_v2_t5_authorized_entities')
export class AefV2T5AuthorizedEntitiesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  aefT5AuthorizedEntitiesAuthorizationDate?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  aefT5AuthorizedEntitiesName?: string;

  @Column({ type: 'varchar', length: 8, nullable: true })
  aefT5AuthorizedEntitiesIncorporationCountry?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  aefT5AuthorizedEntitiesId?: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  aefT5AuthorizedEntitiesCooperativeApproachId?: string;

  @Column({ type: 'text', nullable: true })
  aefT5AuthorizedEntitiesConditions?: string;

  @Column({ type: 'text', nullable: true })
  aefT5AuthorizedEntitiesChangeConditions?: string;

  @Column({ type: 'text', nullable: true })
  aefT5AuthorizedEntitiesAdditionalInformation?: string;

  /**
   * Library metadata: when this snapshot was frozen. Absent means provisional.
   * Mirrors `AefV2T4HoldingsEntity.snapshotAt`.
   */
  @Column({ type: 'timestamptz', nullable: true })
  snapshotAt?: Date;

  // ---- Relationships ------------------------------------------------------

  /** CASCADE — a Submission is the reporting year; its rows go with it. */
  @Index('IDX_aef_v2_t5_submission')
  @Column({ type: 'uuid', nullable: true })
  aefT1SubmissionId?: string;

  @ManyToOne(() => AefV2T1SubmissionEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'aefT1SubmissionId', foreignKeyConstraintName: 'FK_aef_v2_t5_submission' })
  submission?: AefV2T1SubmissionEntity;

  /** The circular half. SET NULL — see the Actions entity for the reasoning. */
  @Index('IDX_aef_v2_t5_authorization')
  @Column({ type: 'uuid', nullable: true })
  aefT2AuthorizationsId?: string;

  @ManyToOne('AefV2T2AuthorizationsEntity', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'aefT2AuthorizationsId', foreignKeyConstraintName: 'FK_aef_v2_t5_authorization' })
  authorization?: AefV2T2AuthorizationsEntity;

  /** Host-registry references. Unconstrained by design. */
  @Index('IDX_aef_v2_t5_project')
  @Column({ type: 'varchar', length: 255, nullable: true })
  projectId?: string;

  @Index('IDX_aef_v2_t5_unit')
  @Column({ type: 'varchar', length: 255, nullable: true })
  unitId?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
