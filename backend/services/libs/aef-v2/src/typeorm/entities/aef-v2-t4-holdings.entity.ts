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

import { NumberTransformer } from '../transformers';
import { AefV2T1SubmissionEntity } from './aef-v2-t1-submission.entity';
import { AefV2T2AuthorizationsEntity } from './aef-v2-t2-authorizations.entity';

/**
 * AEF Table 4 — Holdings.
 *
 * A frozen 31 December snapshot. `snapshotAt` marks a row as frozen; rows
 * without it are provisional. Neither `snapshotAt` nor the relationship columns reach the
 * exported file — export is driven by the field spec, which holds only AEF
 * fields.
 */
@Entity('aef_v2_t4_holdings')
export class AefV2T4HoldingsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  aefT4HoldingsCooperativeApproachId?: string;

  @Index('IDX_aef_v2_t4_authorization_id')
  @Column({ type: 'varchar', length: 255, nullable: true })
  aefT4HoldingsAuthorizationId?: string;

  @Column({ type: 'varchar', length: 8, nullable: true })
  aefT4HoldingsFirstTransferringPartyId?: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  aefT4HoldingsPartyItmoRegistryId?: string;

  @Column({ type: 'bigint', nullable: true, transformer: NumberTransformer })
  aefT4HoldingsItmoFirstId?: number;

  @Column({ type: 'bigint', nullable: true, transformer: NumberTransformer })
  aefT4HoldingsItmoLastId?: number;

  @Column({ type: 'varchar', length: 32, nullable: true })
  aefT4HoldingsUnitRegistryId?: string;

  @Column({ type: 'bigint', nullable: true, transformer: NumberTransformer })
  aefT4HoldingsUnitFirstId?: number;

  @Column({ type: 'bigint', nullable: true, transformer: NumberTransformer })
  aefT4HoldingsUnitLastId?: number;

  @Column({ type: 'varchar', length: 32, nullable: true })
  aefT4HoldingsMetric?: string;

  @Column({ type: 'text', nullable: true })
  aefT4HoldingsGwpValue?: string;

  @Column({ type: 'text', nullable: true })
  aefT4HoldingsApplicableNonGhgMetric?: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true, transformer: NumberTransformer })
  aefT4HoldingsQuantityTCo2?: number;

  @Column({ type: 'text', nullable: true })
  aefT4HoldingsQuantityNonGhg?: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  aefT4HoldingsMitigationType?: string;

  @Column({ type: 'int', nullable: true })
  aefT4HoldingsVintageYear?: number;

  /**
   * Library metadata: when this snapshot was frozen. Absent means provisional.
   */
  @Column({ type: 'timestamptz', nullable: true })
  snapshotAt?: Date;

  // ---- Relationships ------------------------------------------------------

  /**
   * The reporting year this snapshot belongs to.
   *
   * CMA.6 gives Table 4 no reported-year column, so this **is** the year
   * association. CASCADE, for the same reason as elsewhere: a Submission is the
   * reporting year, and its holdings have no meaning without it.
   */
  @Index('IDX_aef_v2_t4_submission')
  @Column({ type: 'uuid', nullable: true })
  aefT1SubmissionId?: string;

  @ManyToOne(() => AefV2T1SubmissionEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'aefT1SubmissionId', foreignKeyConstraintName: 'FK_aef_v2_t4_submission' })
  submission?: AefV2T1SubmissionEntity;

  /** SET NULL — see the Actions entity for why this differs from the above. */
  @Index('IDX_aef_v2_t4_authorization')
  @Column({ type: 'uuid', nullable: true })
  aefT2AuthorizationsId?: string;

  @ManyToOne(() => AefV2T2AuthorizationsEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'aefT2AuthorizationsId', foreignKeyConstraintName: 'FK_aef_v2_t4_authorization' })
  authorization?: AefV2T2AuthorizationsEntity;

  /** Host-registry references. Unconstrained by design. */
  @Index('IDX_aef_v2_t4_project')
  @Column({ type: 'varchar', length: 255, nullable: true })
  projectId?: string;

  @Index('IDX_aef_v2_t4_unit')
  @Column({ type: 'varchar', length: 255, nullable: true })
  unitId?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
