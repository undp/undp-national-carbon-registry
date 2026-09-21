/**
 * AUTO-EXTRACTED from Chia-Network/cadt docs/cadt_rpc_api_v2.md, `governance` section.
 *
 * Only the picklist read is covered here. The rest of the governance section
 * (create governance body, set picklist/glossary data, subscribe to a governance
 * body) is for CAD Trust's own Technical Committee tooling, not for a registry
 * pushing climate data — a registry reads picklists, it does not write them.
 */

// ---------------------------------------------------------------------------
// Get picklist data  ·  GET /v2/governance/meta/pickList
//
// This is the authoritative, live source for every field this package types as
// `string` because it is picklist-governed (see common.ts rule 5). Values are
// managed by CAD Trust's Technical Committee via a formal change-request process
// and drift over time — fetch them, do not hardcode them.
//
// NOTE: The key set is deliberately NOT modelled as a closed union. The API
// guide's example shows `registries`, `projectSector`, `projectType` and
// `coveredByNDC`, but that example is illustrative (it is not even valid JSON —
// it has a trailing comma) and the full set is larger and changes with the
// picklist version. Each entity field's JSDoc in this package names the specific
// key it expects, e.g. "unit_status".
// ---------------------------------------------------------------------------

/** Response for `GET /v2/governance/meta/pickList`: picklist key -> allowed values. */
export type PickListResponse = Record<string, string[]>;
