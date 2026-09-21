import { AefCreateInput, AefRecordMeta, AefRegistryRefs } from './common';

/** Relationships owned by this library, plus the two the host registry owns. */
export interface AefT3ActionsLinks extends AefRegistryRefs {
  aefT1SubmissionId?: string;
  aefT2AuthorizationsId?: string;
}

/**
 * AEF Table 3 — Actions.
 *
 * One row per homogeneous ITMO block undergoing one action. Several columns are
 * conditional on `aefT3ActionsType`; those rules are encoded in
 * `spec/conditions`, not left to comments.
 *
 * Field order follows `AEF_CMA6_second_iteration.csv`.
 */
export interface AefT3ActionsData {
  /**
   * When the action was executed in the Party ITMO registry.
   *
   * The printed annex says `dd/mm/yyyy`; the Feb-2026 technical metadata names
   * this "Action date-time" and specifies ISO 8601 with a zero UTC offset
   * (`<yyyy-mm-dd>T<hh:mm:ss.sss>Z`). The latter is implemented.
   */
  aefT3ActionsDate: string;
  /** Action type. Required by the spec; CAD Trust marks it optional. */
  aefT3ActionsType: string;
  /** Subtype; the valid set depends on `aefT3ActionsType`. */
  aefT3ActionsSubtype?: string;
  /** Cooperative approach ID, `CANNNN`. */
  aefT3ActionsCooperativeApproachId: string;
  /** Authorization ID — must match a Table 2 record. */
  aefT3ActionsAuthorizationId: string;
  /** Party in which the authorized mitigation outcome occurred. Alpha-3. */
  aefT3ActionsFirstTransferringPartyId: string;
  /** Registry in which this action was tracked. Alpha-3 plus two digits. */
  aefT3ActionsPartyItmoRegistryId: string;
  /**
   * First ITMO serial in the block. **Integer** per the nomenclature — CAD Trust
   * types this as a string.
   */
  aefT3ActionsItmoFirstId: number;
  /** Last ITMO serial in the block. Integer. */
  aefT3ActionsItmoLastId: number;
  /**
   * Underlying cooperative approach registry (e.g. `GS`).
   *
   * Optional per the spec — `NA` or blank when there is no underlying registry.
   * CAD Trust requires it, which is wrong for any approach that has none.
   */
  aefT3ActionsUnitRegistryId?: string;
  /** First underlying-unit ID. Integer, optional. */
  aefT3ActionsUnitFirstId?: number;
  /** Last underlying-unit ID. Integer, optional. */
  aefT3ActionsUnitLastId?: number;
  /** `GHG` or `non-GHG`. */
  aefT3ActionsMetric: string;
  /** GWP value(s) applied for non-CO2 gases. */
  aefT3ActionsGwpValue?: string;
  /** Non-GHG metric type; `NA` when the ITMOs are in a GHG metric. */
  aefT3ActionsApplicableNonGhgMetric?: string;
  /** Quantity in tonnes of CO2 equivalent. */
  aefT3ActionsQuantityTCo2: number;
  /** Quantity in the non-GHG metric; `NA` when GHG-denominated. */
  aefT3ActionsQuantityNonGhg?: string;
  /** Emission reductions / Removals / both. Required by the spec. */
  aefT3ActionsMitigationType: string;
  /** Calendar year in which the mitigation outcome occurred. */
  aefT3ActionsVintageYear: number;
  /**
   * Source Party. Only applicable to `Acquisition`.
   *
   * Optional per the spec; CAD Trust requires it unconditionally.
   */
  aefT3ActionsTransferringPartyId?: string;
  /** Receiving Party. Only applicable to `First transfer` and `Transfer`. */
  aefT3ActionsAcquiringPartyId?: string;
  /** Specific IMP/OP purpose. Only for `Use`, `First transfer`, `Cancellation`. */
  aefT3ActionsPurposeOfUseOimp?: string;
  /** Using/cancelling Party. Only for a use towards IMP or cancellation for OP. */
  aefT3ActionsUsingParticipatingPartyId?: string;
  /** Using/cancelling authorized entity. */
  aefT3ActionsUsingAuthorizedEntityId?: string;
  /** Calendar year the ITMOs are used towards the Party's NDC. Only for NDC use. */
  aefT3ActionsItmoUsedYear?: number;
  /** CARP-populated. Result of the consistency check on this action. */
  aefT3ActionsConsistencyCheckResult?: string;
  /** Any relevant additional information. */
  aefT3ActionsAdditionalInformation?: string;
}

export type AefT3ActionsCreateInput = AefCreateInput<AefT3ActionsData> & AefT3ActionsLinks;

export interface AefT3ActionsRecord
  extends AefT3ActionsData,
    AefT3ActionsLinks,
    AefRecordMeta {}
