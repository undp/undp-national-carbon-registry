import { AefCreateInput, AefRecordMeta, AefRegistryRefs } from './common';

/**
 * Relationships owned by this library, plus the two the host registry owns.
 *
 * `aefT1SubmissionId` is what ties a Holdings row to its reporting year — CMA.6
 * gives Table 4 no reported-year column of its own.
 */
export interface AefT4HoldingsLinks extends AefRegistryRefs {
  aefT1SubmissionId?: string;
  aefT2AuthorizationsId?: string;
}

/**
 * AEF Table 4 — Holdings.
 *
 * A **31 December snapshot** of ITMOs still available to the reporting Party —
 * not a live query. Holdings are a balance at an instant, so once credits move
 * in January the previous year-end figure stops being reconstructible from
 * current state. See `holdings/snapshot`.
 *
 * CMA.6 gives this table no reported-year column; the year comes from
 * `aefT1SubmissionId`.
 *
 * Field order follows `AEF_CMA6_second_iteration.csv`.
 */
export interface AefT4HoldingsData {
  /** Cooperative approach ID, `CANNNN`. */
  aefT4HoldingsCooperativeApproachId: string;
  /** Authorization ID — must match a Table 2 record. */
  aefT4HoldingsAuthorizationId: string;
  /** Party where the mitigation outcome occurred. Alpha-3. */
  aefT4HoldingsFirstTransferringPartyId: string;
  /** Registry in which the ITMOs are held on 31 December. */
  aefT4HoldingsPartyItmoRegistryId: string;
  /** First ITMO serial in the holding block. Integer per the nomenclature. */
  aefT4HoldingsItmoFirstId: number;
  /** Last ITMO serial in the holding block. Integer. */
  aefT4HoldingsItmoLastId: number;
  /** Underlying registry, if any. Optional per the spec; CAD Trust requires it. */
  aefT4HoldingsUnitRegistryId?: string;
  /** First underlying-unit ID. Integer, optional. */
  aefT4HoldingsUnitFirstId?: number;
  /** Last underlying-unit ID. Integer, optional. */
  aefT4HoldingsUnitLastId?: number;
  /** `GHG` or `non-GHG`. */
  aefT4HoldingsMetric: string;
  /** GWP value(s) applied for non-CO2 gases. */
  aefT4HoldingsGwpValue?: string;
  /** Non-GHG metric type; `NA` when GHG-denominated. */
  aefT4HoldingsApplicableNonGhgMetric?: string;
  /** Held quantity in tonnes of CO2 equivalent. */
  aefT4HoldingsQuantityTCo2: number;
  /** Held quantity in the non-GHG metric; `NA` when GHG-denominated. */
  aefT4HoldingsQuantityNonGhg?: string;
  /** Emission reductions / Removals / both. Required by the spec. */
  aefT4HoldingsMitigationType: string;
  /** Calendar year in which the mitigation outcome occurred. */
  aefT4HoldingsVintageYear: number;
}

export type AefT4HoldingsCreateInput = AefCreateInput<AefT4HoldingsData> &
  AefT4HoldingsLinks & {
    /** Library metadata. Set by `snapshotHoldingsForYear` when a year is frozen. */
    snapshotAt?: string;
  };

export interface AefT4HoldingsRecord
  extends AefT4HoldingsData,
    AefT4HoldingsLinks,
    AefRecordMeta {
  /**
   * When this snapshot was frozen. Library metadata, excluded from export.
   *
   * Absent means the row has not been snapshotted — a provisional figure for the
   * still-open year.
   */
  snapshotAt?: string;
}
