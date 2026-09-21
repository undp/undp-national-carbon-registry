/**
 * Which local table a sync record points at. Paired with `localId`.
 *
 * String-valued — see the note in cadtrust.sync.status.enum.ts.
 * Extend as more entities are synced (CREDIT_BLOCK, ACTIVITY, ...).
 */
export enum CadTrustLocalEntityType {
  /** project_entity, keyed by refId. */
  PROJECT = "PROJECT",
  /**
   * The CAD Trust node itself — there is exactly one home organization per node,
   * so `localId` is the constant "HOME" rather than a local table key.
   */
  ORGANIZATION = "ORGANIZATION",
  /**
   * This registry's one national crediting program. Not backed by a local table;
   * `localId` is the resolved `programRegistryActivityId` from
   * `CadTrustRegistryProfileService`.
   */
  PROGRAM = "PROGRAM",
  /**
   * This registry's one methodology. Not backed by a local table; `localId` is
   * the resolved `methodologyCode` from `CadTrustRegistryProfileService`.
   */
  METHODOLOGY = "METHODOLOGY",
  /**
   * The PD company that owns a project. `localId` is `String(companyId)` — one
   * CAD Trust stakeholder per company, reused across every project that company
   * creates. Not keyed by refId, unlike everything below.
   */
  STAKEHOLDER = "STAKEHOLDER",
  /**
   * The project <-> methodology relationship. `localId` is `refId` — this
   * registry has exactly one methodology, so one project has exactly one of
   * these.
   */
  PROJECT_METHODOLOGY = "PROJECT_METHODOLOGY",
  /**
   * The project <-> stakeholder (owning PD company) relationship. `localId` is
   * `refId` — one owning stakeholder per project in this registry's model.
   */
  STAKEHOLDER_PROJECT = "STAKEHOLDER_PROJECT",
  /** The project's site location. `localId` is `refId` — one location per project. */
  LOCATION = "LOCATION",
  /**
   * A CAD Trust validation record for a specific approved document version. `localId` is
   * `${refId}-${documentType}-v${documentVersion}` — a rejected-and-resubmitted PDD or validation
   * report is a legitimately distinct validation event on re-approval, so the key includes the
   * version rather than collapsing every version onto one record.
   */
  VALIDATION = "VALIDATION",
  /**
   * A CAD Trust verification record for one monitoring-cycle's verification-report approval.
   * `localId` is `${refId}-VERIFICATION-v${documentVersion}` — same composite-key shape as
   * VALIDATION, and for the same reason (a project has many monitoring cycles over its life).
   */
  VERIFICATION = "VERIFICATION",
  /**
   * A CAD Trust issuance record — one per verification event, 1:1 with its VERIFICATION sync
   * record and keyed identically (`${refId}-VERIFICATION-v${documentVersion}`), since the two are
   * always created together in the same handler run.
   */
  ISSUANCE = "ISSUANCE",
  /**
   * A CAD Trust unit — this registry's credit-block equivalent. `localId` is `creditBlockId`
   * directly: every distinct block a split ever produces gets exactly one unit, created once and
   * kept in sync via full-replace update thereafter. See `cadtrust-sync/README.md`'s "Why not
   * unit.split" for why this registry never uses CAD Trust's `/unit/split` action.
   */
  UNIT = "UNIT",
  /**
   * This registry's one "Article 6 - Authorisation" label. Not backed by a local table; `localId`
   * is the constant `"ARTICLE_6_AUTHORISATION"` — bootstrapped once, like PROGRAM/METHODOLOGY.
   */
  LABEL = "LABEL",
  /**
   * The unit <-> label relationship, staged when a credit block is ITMO-authorized. `localId` is
   * `creditBlockId` — one authorized unit has exactly one Article 6 label attached.
   */
  UNIT_LABEL = "UNIT_LABEL",
}
