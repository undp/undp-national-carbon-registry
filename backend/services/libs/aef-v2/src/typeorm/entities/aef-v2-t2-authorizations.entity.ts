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
import type { AefV2T5AuthorizedEntitiesEntity } from './aef-v2-t5-authorized-entities.entity';

/**
 * AEF Table 2 — Authorizations.
 *
 * **Circular relation with Table 5**: T2 references T5 and T5 references T2, as
 * CAD Trust models it. Postgres allows it because both columns are nullable,
 * but neither row can be inserted with its counterpart already set — write one,
 * then update. The T5 side is imported `type`-only here and referenced through
 * a lazy arrow so the module cycle never resolves at load time.
 */
@Entity('aef_v2_t2_authorizations')
export class AefV2T2AuthorizationsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Indexed: Actions and Holdings reference authorizations by this business key. */
  @Index('IDX_aef_v2_t2_authorization_id')
  @Column({ type: 'varchar', length: 255 })
  aefT2AuthorizationsId: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  aefT2AuthorizationsDate?: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  aefT2AuthorizationsCooperativeApproachId?: string;

  @Column({ type: 'int', nullable: true })
  aefT2AuthorizationsVersion?: number;

  @Column({ type: 'bigint', nullable: true })
  aefT2AuthorizationsQuantity?: number;

  @Column({ type: 'varchar', length: 32, nullable: true })
  aefT2AuthorizationsMetric?: string;

  @Column({ type: 'text', nullable: true })
  aefT2AuthorizationsGwpValue?: string;

  @Column({ type: 'text', nullable: true })
  aefT2AuthorizationsApplicableNonGhgMetric?: string;

  @Column({ type: 'text', nullable: true })
  aefT2AuthorizationsSector?: string;

  @Column({ type: 'text', nullable: true })
  aefT2AuthorizationsActivityType?: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  aefT2AuthorizationsPurposesForAuthorization?: string;

  @Column({ type: 'text', nullable: true })
  aefT2AuthorizationsAuthorizedPartyId?: string;

  /** SOURCE TYPO, PRESERVED: CAD Trust spells this `Authozied`. */
  @Column({ type: 'text', nullable: true })
  aefT2AuthorizationsAuthoziedEntityId?: string;

  @Column({ type: 'text', nullable: true })
  aefT2AuthorizationsOimpAuthorizedParty?: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  aefT2AuthorizationsAuthorizedTimeframe?: string;

  @Column({ type: 'text', nullable: true })
  aefT2AuthorizationsAuthorizationTerms?: string;

  /** CARP-populated. */
  @Column({ type: 'text', nullable: true })
  aefT2AuthorizationsAuthorizationDocumentation?: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  aefT2AuthorizationsFirstTransferDefinitionOimp?: string;

  @Column({ type: 'text', nullable: true })
  aefT2AuthorizationsAdditionalInformation?: string;

  // ---- Relationships ------------------------------------------------------

  /** CASCADE — a Submission is the reporting year; its rows go with it. */
  @Index('IDX_aef_v2_t2_submission')
  @Column({ type: 'uuid', nullable: true })
  aefT1SubmissionId?: string;

  @ManyToOne(() => AefV2T1SubmissionEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'aefT1SubmissionId', foreignKeyConstraintName: 'FK_aef_v2_t2_submission' })
  submission?: AefV2T1SubmissionEntity;

  /** The circular half. SET NULL, so removing an entity does not delete authorizations. */
  @Index('IDX_aef_v2_t2_authorized_entity')
  @Column({ type: 'uuid', nullable: true })
  aefT5AuthorizedEntitiesId?: string;

  @ManyToOne('AefV2T5AuthorizedEntitiesEntity', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'aefT5AuthorizedEntitiesId', foreignKeyConstraintName: 'FK_aef_v2_t2_authorized_entity' })
  authorizedEntity?: AefV2T5AuthorizedEntitiesEntity;

  /** Host-registry references. Unconstrained by design. */
  @Index('IDX_aef_v2_t2_project')
  @Column({ type: 'varchar', length: 255, nullable: true })
  projectId?: string;

  @Index('IDX_aef_v2_t2_unit')
  @Column({ type: 'varchar', length: 255, nullable: true })
  unitId?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
