/**
 * Shared conventions for the five AEF tables.
 *
 * **Field keys** are CAD Trust's (`aefT{n}*`), verbatim — including
 * `aefT2AuthorizationsAuthoziedEntityId`, whose misspelling is preserved so no
 * translation layer is needed between this library and a CAD Trust sync.
 *
 * **Requiredness and types** are the UNFCCC's, from the Common Nomenclature of
 * 17 February 2026, which overrides CAD Trust wherever the two disagree. CAD
 * Trust's `/v2/aef-*` endpoints are a lossy implementation of CMA.6: they mark
 * `Sector`, `Metric`, `ActionType` and `MitigationType` optional when the spec
 * requires them, require the underlying-unit and party fields when the spec does
 * not, and type the ITMO block bounds as strings when the spec says integer.
 *
 * **Relationships** fall into two kinds, and they are stored differently:
 *
 *  - *Internal* — Submission, Authorization, Authorized entity. This library
 *    owns all three tables, so these are ordinary `uuid` foreign keys with real
 *    constraints, cascades and indexes.
 *  - *External* — project and unit. These belong to the host registry, so they
 *    are unconstrained identifier columns. See {@link AefRegistryRefs}.
 */

/** Lib-managed columns present on every stored record. Not AEF fields. */
export interface AefRecordMeta {
  /** This store's identifier. */
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * References to records the host registry owns.
 *
 * Typed as plain strings and never constrained, because identifier shapes vary
 * wildly between the systems that might own these records. This registry keys a
 * project by a short sequential `refId` (`'0002'`) and a credit block by an id
 * like `'CA0NNN-NG-XX-1-1'`; a CAD Trust node uses UUIDs; another deployment
 * something else again. A `uuid` type or a foreign key would quietly exclude
 * the very case these exist for.
 *
 * A deployment that wants hard integrity can add its own constraint; this
 * library neither emits nor depends on one. `RefResolver` is the runtime way to
 * turn one of these back into an object.
 */
export interface AefRegistryRefs {
  /** The host registry's project identifier — `ProjectEntity.refId` here. */
  projectId?: string;
  /**
   * The host registry's unit identifier — `CreditBlocksEntity.creditBlockId`
   * here, not its serial number: a serial encodes the block's range and changes
   * when a partial transfer splits it, so a reference to one would silently
   * break.
   */
  unitId?: string;
}

/**
 * Create/update payload for any table.
 *
 * Deliberately `Partial`: a half-filled AEF record is a legitimate draft and
 * must be storable. Completeness is enforced by `validateSubmission` at filing
 * time, not by the store. See `validation/validate`.
 */
export type AefCreateInput<TData> = Partial<TData>;
