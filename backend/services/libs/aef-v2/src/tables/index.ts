import {
  AefT1SubmissionCreateInput,
  AefT1SubmissionData,
  AefT1SubmissionRecord,
} from './aefT1Submission';
import {
  AefT2AuthorizationsCreateInput,
  AefT2AuthorizationsData,
  AefT2AuthorizationsRecord,
} from './aefT2Authorizations';
import { AefT3ActionsCreateInput, AefT3ActionsData, AefT3ActionsRecord } from './aefT3Actions';
import { AefT4HoldingsCreateInput, AefT4HoldingsData, AefT4HoldingsRecord } from './aefT4Holdings';
import {
  AefT5AuthorizedEntitiesCreateInput,
  AefT5AuthorizedEntitiesData,
  AefT5AuthorizedEntitiesRecord,
} from './aefT5AuthorizedEntities';

export * from './common';
export * from './aefT1Submission';
export * from './aefT2Authorizations';
export * from './aefT3Actions';
export * from './aefT4Holdings';
export * from './aefT5AuthorizedEntities';

export const AEF_TABLE_NAMES = [
  't1Submission',
  't2Authorizations',
  't3Actions',
  't4Holdings',
  't5AuthorizedEntities',
] as const;

export type AefTableName = (typeof AEF_TABLE_NAMES)[number];

/**
 * Presentation order — the order the tables appear in Decision 4/CMA.6 Annex II
 * and in `AEF_CMA6_second_iteration.csv`.
 *
 * This is *not* an insert-order constraint: canonical AEF relates its tables by
 * business key (`Authorization ID`, `Cooperative approach ID`), so there is no
 * foreign-key chain to walk. The one real ordering rule is that a Submission
 * must exist before Holdings can be linked to a year — `snapshotHoldingsForYear`
 * handles that itself.
 */
export const AEF_TABLE_ORDER: readonly AefTableName[] = AEF_TABLE_NAMES;

/** The spec-shaped data payload for each table. */
export interface AefDataMap {
  t1Submission: AefT1SubmissionData;
  t2Authorizations: AefT2AuthorizationsData;
  t3Actions: AefT3ActionsData;
  t4Holdings: AefT4HoldingsData;
  t5AuthorizedEntities: AefT5AuthorizedEntitiesData;
}

/** The stored record for each table, including library metadata. */
export interface AefRecordMap {
  t1Submission: AefT1SubmissionRecord;
  t2Authorizations: AefT2AuthorizationsRecord;
  t3Actions: AefT3ActionsRecord;
  t4Holdings: AefT4HoldingsRecord;
  t5AuthorizedEntities: AefT5AuthorizedEntitiesRecord;
}

/** The create/update payload for each table. */
export interface AefCreateInputMap {
  t1Submission: AefT1SubmissionCreateInput;
  t2Authorizations: AefT2AuthorizationsCreateInput;
  t3Actions: AefT3ActionsCreateInput;
  t4Holdings: AefT4HoldingsCreateInput;
  t5AuthorizedEntities: AefT5AuthorizedEntitiesCreateInput;
}

export function isAefTableName(value: string): value is AefTableName {
  return (AEF_TABLE_NAMES as readonly string[]).includes(value);
}
