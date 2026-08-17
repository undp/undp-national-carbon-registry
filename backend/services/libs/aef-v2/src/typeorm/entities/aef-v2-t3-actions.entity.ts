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
 * AEF Table 3 — Actions.
 *
 * ITMO block bounds are **bigint**, not varchar: the Common Nomenclature types
 * `FirstID`/`LastID` as integers, and range comparisons in validation depend on
 * them being numeric. CAD Trust types them as strings, which is one of the
 * places this library follows the spec instead.
 */
@Entity('aef_v2_t3_actions')
export class AefV2T3ActionsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  aefT3ActionsDate?: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  aefT3ActionsType?: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  aefT3ActionsSubtype?: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  aefT3ActionsCooperativeApproachId?: string;

  @Index('IDX_aef_v2_t3_authorization_id')
  @Column({ type: 'varchar', length: 255, nullable: true })
  aefT3ActionsAuthorizationId?: string;

  @Column({ type: 'varchar', length: 8, nullable: true })
  aefT3ActionsFirstTransferringPartyId?: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  aefT3ActionsPartyItmoRegistryId?: string;

  @Column({ type: 'bigint', nullable: true, transformer: NumberTransformer })
  aefT3ActionsItmoFirstId?: number;

  @Column({ type: 'bigint', nullable: true, transformer: NumberTransformer })
  aefT3ActionsItmoLastId?: number;

  @Column({ type: 'varchar', length: 32, nullable: true })
  aefT3ActionsUnitRegistryId?: string;

  @Column({ type: 'bigint', nullable: true, transformer: NumberTransformer })
  aefT3ActionsUnitFirstId?: number;

  @Column({ type: 'bigint', nullable: true, transformer: NumberTransformer })
  aefT3ActionsUnitLastId?: number;

  @Column({ type: 'varchar', length: 32, nullable: true })
  aefT3ActionsMetric?: string;

  @Column({ type: 'text', nullable: true })
  aefT3ActionsGwpValue?: string;

  @Column({ type: 'text', nullable: true })
  aefT3ActionsApplicableNonGhgMetric?: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true, transformer: NumberTransformer })
  aefT3ActionsQuantityTCo2?: number;

  @Column({ type: 'text', nullable: true })
  aefT3ActionsQuantityNonGhg?: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  aefT3ActionsMitigationType?: string;

  @Column({ type: 'int', nullable: true })
  aefT3ActionsVintageYear?: number;

  @Column({ type: 'varchar', length: 8, nullable: true })
  aefT3ActionsTransferringPartyId?: string;

  @Column({ type: 'varchar', length: 8, nullable: true })
  aefT3ActionsAcquiringPartyId?: string;

  @Column({ type: 'text', nullable: true })
  aefT3ActionsPurposeOfUseOimp?: string;

  @Column({ type: 'varchar', length: 8, nullable: true })
  aefT3ActionsUsingParticipatingPartyId?: string;

  @Column({ type: 'text', nullable: true })
  aefT3ActionsUsingAuthorizedEntityId?: string;

  @Column({ type: 'int', nullable: true })
  aefT3ActionsItmoUsedYear?: number;

  /** CARP-populated. */
  @Column({ type: 'text', nullable: true })
  aefT3ActionsConsistencyCheckResult?: string;

  @Column({ type: 'text', nullable: true })
  aefT3ActionsAdditionalInformation?: string;

  // ---- Relationships ------------------------------------------------------

  /**
   * The reporting year this row belongs to.
   *
   * CASCADE: a Submission *is* the reporting year, so deleting one should take
   * its rows with it rather than leave them orphaned and unreachable.
   */
  @Index('IDX_aef_v2_t3_submission')
  @Column({ type: 'uuid', nullable: true })
  aefT1SubmissionId?: string;

  @ManyToOne(() => AefV2T1SubmissionEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'aefT1SubmissionId', foreignKeyConstraintName: 'FK_aef_v2_t3_submission' })
  submission?: AefV2T1SubmissionEntity;

  /**
   * SET NULL rather than CASCADE: an Action outliving its Authorization is a
   * data problem `validateSubmission` already reports as `missing-authorization`.
   * Deleting the Action would hide it instead of surfacing it.
   */
  @Index('IDX_aef_v2_t3_authorization')
  @Column({ type: 'uuid', nullable: true })
  aefT2AuthorizationsId?: string;

  @ManyToOne(() => AefV2T2AuthorizationsEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'aefT2AuthorizationsId', foreignKeyConstraintName: 'FK_aef_v2_t3_authorization' })
  authorization?: AefV2T2AuthorizationsEntity;

  /**
   * Host-registry references. Plain strings, deliberately unconstrained — this
   * registry keys a project by a short `refId` (`'0002'`) and a block by an id
   * like `'CA0NNN-NG-XX-1-1'`, a CAD Trust node by UUID. A `uuid` type or an FK
   * would exclude the case they exist for.
   */
  @Index('IDX_aef_v2_t3_project')
  @Column({ type: 'varchar', length: 255, nullable: true })
  projectId?: string;

  @Index('IDX_aef_v2_t3_unit')
  @Column({ type: 'varchar', length: 255, nullable: true })
  unitId?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
