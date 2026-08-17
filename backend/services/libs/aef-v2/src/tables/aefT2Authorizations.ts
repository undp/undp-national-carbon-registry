import { AefCreateInput, AefRecordMeta, AefRegistryRefs } from './common';

/**
 * Relationships owned by this library.
 *
 * `aefT5AuthorizedEntitiesId` is one half of a **circular** pair — T5 points
 * back at T2. Postgres allows it because both are nullable, but neither row can
 * be inserted with its counterpart already set: write one, then update.
 */
export interface AefT2AuthorizationsLinks extends AefRegistryRefs {
  aefT1SubmissionId?: string;
  aefT5AuthorizedEntitiesId?: string;
}

/**
 * AEF Table 2 — Authorizations.
 *
 * The authorization instrument and its conditions. Actions and Holdings
 * reference it by `Authorization ID` — a business key, not a foreign key.
 *
 * Field order follows `AEF_CMA6_second_iteration.csv`.
 */
export interface AefT2AuthorizationsData {
  /** Authorization ID assigned by the reporting Party. Alphanumeric, space, hyphen. */
  aefT2AuthorizationsId: string;
  /** Date the authorization was issued, `dd/mm/yyyy`. */
  aefT2AuthorizationsDate: string;
  /** Cooperative approach ID, `CANNNN`. Registry data — see the controlled-value provider. */
  aefT2AuthorizationsCooperativeApproachId: string;
  /**
   * Version of the authorization. Integer per the nomenclature.
   *
   * CAD Trust types this as an optional string; the spec requires it.
   */
  aefT2AuthorizationsVersion: number;
  /** Maximum quantity authorized for NDC and/or OIMP use. Optional. */
  aefT2AuthorizationsQuantity?: number;
  /** `GHG` or `non-GHG`. Required by the spec; CAD Trust marks it optional. */
  aefT2AuthorizationsMetric: string;
  /** GWP value(s) applied, where non-CO2 gases are involved. */
  aefT2AuthorizationsGwpValue?: string;
  /** Non-GHG metric type. `NA` or blank when the ITMOs are in a GHG metric. */
  aefT2AuthorizationsApplicableNonGhgMetric?: string;
  /** Sector(s) in which the mitigation outcome occurred. Required by the spec. */
  aefT2AuthorizationsSector: string;
  /**
   * Mitigation activity type(s).
   *
   * SPEC CONFLICT: the CMA.6 table lists this as a Table 2 field, while Common
   * Nomenclature Table 51(a) marks it `Required: true` but `Naming in AEF: not
   * applicable`. CAD Trust settles it in practice by shipping it optional, which
   * is what is implemented. Revisit against the live CARP template.
   */
  aefT2AuthorizationsActivityType?: string;
  /** Purpose(s) for authorization. Required by the spec; CAD Trust marks it optional. */
  aefT2AuthorizationsPurposesForAuthorization: string;
  /** Specific Party(ies) authorized to use the outcomes, where not open to any Party. */
  aefT2AuthorizationsAuthorizedPartyId?: string;
  /**
   * Authorized entity identifier(s).
   *
   * SOURCE TYPO, PRESERVED: CAD Trust spells this `Authozied`. Kept verbatim —
   * renaming it would reintroduce the mapping layer this library avoids.
   */
  aefT2AuthorizationsAuthoziedEntityId?: string;
  /** The specific OIMP, where the authorization covers one (e.g. CORSIA). */
  aefT2AuthorizationsOimpAuthorizedParty?: string;
  /** Timeframe for which outcomes may occur and/or be used, `dddd - dddd`. */
  aefT2AuthorizationsAuthorizedTimeframe?: string;
  /** Terms and conditions attached to the authorization. */
  aefT2AuthorizationsAuthorizationTerms?: string;
  /** CARP-populated. Hyperlink to the authorization documentation. */
  aefT2AuthorizationsAuthorizationDocumentation?: string;
  /** First transfer definition for OIMP, per decision 2/CMA.3 annex para. 2(b). */
  aefT2AuthorizationsFirstTransferDefinitionOimp?: string;
  /** Any further information the Party considers useful. */
  aefT2AuthorizationsAdditionalInformation?: string;
}

export type AefT2AuthorizationsCreateInput = AefCreateInput<AefT2AuthorizationsData> &
  AefT2AuthorizationsLinks;

export interface AefT2AuthorizationsRecord
  extends AefT2AuthorizationsData,
    AefT2AuthorizationsLinks,
    AefRecordMeta {}
