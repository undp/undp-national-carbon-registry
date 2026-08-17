import { AefCreateInput, AefRecordMeta, AefRegistryRefs } from './common';

/**
 * Relationships owned by this library, plus the two the host registry owns.
 *
 * `aefT2AuthorizationsId` is the other half of the **circular** pair — T2 points
 * back at T5. See `AefT2AuthorizationsLinks`.
 */
export interface AefT5AuthorizedEntitiesLinks extends AefRegistryRefs {
  aefT1SubmissionId?: string;
  aefT2AuthorizationsId?: string;
}

/**
 * AEF Table 5 — Authorized entities.
 *
 * Entities the reporting Party has authorized to participate in, or use ITMOs
 * under, a cooperative approach.
 *
 * Field order follows `AEF_CMA6_second_iteration.csv`.
 */
export interface AefT5AuthorizedEntitiesData {
  /** Date the entity authorization was issued, `dd/mm/yyyy`. */
  aefT5AuthorizedEntitiesAuthorizationDate: string;
  /** Legal name of the authorized entity. */
  aefT5AuthorizedEntitiesName: string;
  /**
   * Country of incorporation, ISO 3166-1 alpha-3.
   *
   * Required by the spec; CAD Trust marks it optional.
   */
  aefT5AuthorizedEntitiesIncorporationCountry: string;
  /** Identification number within the country of incorporation. */
  aefT5AuthorizedEntitiesId: string;
  /** Cooperative approach under which the entity is authorized, `CANNNN`. */
  aefT5AuthorizedEntitiesCooperativeApproachId: string;
  /** Conditions under which the authorization was provided. */
  aefT5AuthorizedEntitiesConditions?: string;
  /** Whether and under what conditions the authorization may be changed or revoked. */
  aefT5AuthorizedEntitiesChangeConditions?: string;
  /** Any further entity-related information. */
  aefT5AuthorizedEntitiesAdditionalInformation?: string;
}

export type AefT5AuthorizedEntitiesCreateInput = AefCreateInput<AefT5AuthorizedEntitiesData> &
  AefT5AuthorizedEntitiesLinks & {
    /** Library metadata. Set by `snapshotAuthorizedEntitiesForYear` when a year is frozen. */
    snapshotAt?: string;
  };

export interface AefT5AuthorizedEntitiesRecord
  extends AefT5AuthorizedEntitiesData,
    AefT5AuthorizedEntitiesLinks,
    AefRecordMeta {
  /**
   * When this snapshot was frozen. Library metadata, excluded from export.
   *
   * Absent means the row has not been snapshotted — a provisional figure for
   * the still-open year. Mirrors `AefT4HoldingsRecord.snapshotAt`.
   */
  snapshotAt?: string;
}
