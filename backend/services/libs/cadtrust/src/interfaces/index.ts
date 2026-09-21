/**
 * CAD Trust v2 sync-event data interfaces — barrel export.
 *
 * Insert order (dependency order for staging records so foreign keys resolve —
 * per the source doc's "Data Model Overview" section):
 *
 *   program -> methodology -> stakeholder -> label -> project ->
 *   project_methodology -> stakeholder_projects -> validation -> verification ->
 *   location -> estimation -> rating -> co_benefit -> issuance -> unit -> unit_label
 *
 * AEF insert order (only if Article 6.2 reporting applies):
 *
 *   aef_t5_authorized_entities and/or aef_t1_submission -> aef_t2_authorizations ->
 *   aef_t3_actions / aef_t4_holdings
 *
 * Every entity below stages a change only; nothing is published to the network
 * until actions/staging.ts's commit flow runs. See common.ts for the shared
 * conventions (staging model, orgUid handling, picklist handling, PUT = full
 * replace) that apply across every file in this package.
 */

export * from './common';
export * from './picklistValues';

// Baseline data tables, in dependency (insert) order.
export * from './program';
export * from './methodology';
export * from './stakeholder';
export * from './label';
export * from './project';
export * from './projectMethodology';
export * from './stakeholderProject';
export * from './validation';
export * from './verification';
export * from './location';
export * from './estimation';
export * from './rating';
export * from './coBenefit';
export * from './issuance';
export * from './unit';
export * from './unitLabel';

// Article 6.2 AEF tables (optional).
export * from './aef/aefT1Submission';
export * from './aef/aefT2Authorizations';
export * from './aef/aefT5AuthorizedEntities';
export * from './aef/aefT3Actions';
export * from './aef/aefT4Holdings';

// Onboarding, staging/commit, and resource-specific non-CRUD actions.
export * from './actions/organizations';
export * from './actions/staging';
export * from './actions/projectActions';
export * from './actions/unitActions';
export * from './actions/offer';
export * from './actions/governance';
export * from './actions/system';
