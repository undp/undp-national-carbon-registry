import { Clock, systemClock } from '../clock';
import { AefSubmissionDefaults, ensureSubmissionForYear } from '../submission/bootstrap';
import { AefStore } from '../store/aef-store.port';
import { AefT2AuthorizationsCreateInput, AefT2AuthorizationsRecord } from '../tables/aefT2Authorizations';
import { AefT3ActionsCreateInput, AefT3ActionsRecord } from '../tables/aefT3Actions';
import {
  AefT5AuthorizedEntitiesCreateInput,
  AefT5AuthorizedEntitiesRecord,
} from '../tables/aefT5AuthorizedEntities';

/**
 * Writes actions and authorizations through the library.
 *
 * The registry must never assemble the year's `aefT1SubmissionId` itself and
 * hand it to a raw `store.create(...)` — that is exactly the orchestration
 * this module owns. Every function here resolves the reporting year from the
 * record's own date field and links it to that year's Submission, creating
 * the Submission if this is its first row.
 */

export class InvalidRecordDateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRecordDateError';
  }
}

export interface RecordOptions {
  /**
   * Skips the year-lookup and writes straight to this Submission.
   *
   * Load-bearing, not a convenience: a host that derives the year from
   * `ensureSubmissionForYear` on every write invites a race — two concurrent
   * writers in a fresh year can both miss the existing row and both try to
   * insert it, tripping the `(party, reportYear, version)` unique constraint.
   * A host that resolves the submission once, out of band, and passes it in
   * here avoids that race entirely.
   */
  submissionId?: string;
  clock?: Clock;
}

/**
 * `aefT3ActionsDate` is ISO 8601 with a zero UTC offset
 * (`<yyyy-mm-dd>T<hh:mm:ss.sss>Z`, per `aefT3Actions.ts`), so the year is
 * simply its first four characters. Deliberately not `new Date(...).getUTCFullYear()`
 * — a plain string parse cannot be fooled by a locale or an invalid date
 * silently becoming `NaN`.
 */
function yearFromIsoDate(value: string, field: string): number {
  const match = /^(\d{4})-\d{2}-\d{2}T/.exec(value);
  if (!match) {
    throw new InvalidRecordDateError(
      `${field} "${value}" is not an ISO 8601 date-time (<yyyy-mm-dd>T<hh:mm:ss.sss>Z)`,
    );
  }
  return Number.parseInt(match[1], 10);
}

/** `dd/mm/yyyy`, per Common Nomenclature Table 4 — the year is the last segment. */
function yearFromDmyDate(value: string, field: string): number {
  const match = /^\d{2}\/\d{2}\/(\d{4})$/.exec(value);
  if (!match) {
    throw new InvalidRecordDateError(`${field} "${value}" is not dd/mm/yyyy`);
  }
  return Number.parseInt(match[1], 10);
}

async function resolveSubmissionId(
  store: AefStore,
  defaults: AefSubmissionDefaults,
  year: number,
  options: RecordOptions,
): Promise<string> {
  if (options.submissionId) {
    return options.submissionId;
  }
  const { record } = await ensureSubmissionForYear(store, defaults, year, options.clock ?? systemClock);
  return record.id;
}

/**
 * Writes one Table 3 Action, linked to its year's Submission.
 *
 * The year is read from `input.aefT3ActionsDate` unless `options.submissionId`
 * is supplied.
 */
export async function recordAction(
  store: AefStore,
  defaults: AefSubmissionDefaults,
  input: AefT3ActionsCreateInput,
  options: RecordOptions = {},
): Promise<AefT3ActionsRecord> {
  const submissionId =
    options.submissionId ??
    (await resolveSubmissionId(
      store,
      defaults,
      yearFromIsoDate(requireDate(input.aefT3ActionsDate, 'aefT3ActionsDate'), 'aefT3ActionsDate'),
      options,
    ));

  return store.create('t3Actions', { ...input, aefT1SubmissionId: submissionId });
}

/**
 * Writes several Actions in one call, grouping by reporting year so each
 * distinct year's Submission is resolved once rather than once per row.
 *
 * `options.submissionId`, if given, applies to every input — appropriate when
 * the caller already knows they are all for the same year.
 */
export async function recordActions(
  store: AefStore,
  defaults: AefSubmissionDefaults,
  inputs: readonly AefT3ActionsCreateInput[],
  options: RecordOptions = {},
): Promise<AefT3ActionsRecord[]> {
  const submissionIdByYear = new Map<number, Promise<string>>();
  const results: AefT3ActionsRecord[] = [];

  for (const input of inputs) {
    let submissionId: string;
    if (options.submissionId) {
      submissionId = options.submissionId;
    } else {
      const year = yearFromIsoDate(requireDate(input.aefT3ActionsDate, 'aefT3ActionsDate'), 'aefT3ActionsDate');
      let pending = submissionIdByYear.get(year);
      if (!pending) {
        pending = resolveSubmissionId(store, defaults, year, options);
        submissionIdByYear.set(year, pending);
      }
      submissionId = await pending;
    }
    results.push(await store.create('t3Actions', { ...input, aefT1SubmissionId: submissionId }));
  }

  return results;
}

/**
 * Writes one Table 2 Authorization, linked to its year's Submission.
 *
 * The year is read from `input.aefT2AuthorizationsDate` unless
 * `options.submissionId` is supplied.
 */
export async function recordAuthorization(
  store: AefStore,
  defaults: AefSubmissionDefaults,
  input: AefT2AuthorizationsCreateInput,
  options: RecordOptions = {},
): Promise<AefT2AuthorizationsRecord> {
  const submissionId =
    options.submissionId ??
    (await resolveSubmissionId(
      store,
      defaults,
      yearFromDmyDate(
        requireDate(input.aefT2AuthorizationsDate, 'aefT2AuthorizationsDate'),
        'aefT2AuthorizationsDate',
      ),
      options,
    ));

  return store.create('t2Authorizations', { ...input, aefT1SubmissionId: submissionId });
}

/**
 * Writes one Table 5 Authorized entity, linked to its year's Submission.
 *
 * The year is read from `input.aefT5AuthorizedEntitiesAuthorizationDate`
 * unless `options.submissionId` is supplied.
 */
export async function recordAuthorizedEntity(
  store: AefStore,
  defaults: AefSubmissionDefaults,
  input: AefT5AuthorizedEntitiesCreateInput,
  options: RecordOptions = {},
): Promise<AefT5AuthorizedEntitiesRecord> {
  const submissionId =
    options.submissionId ??
    (await resolveSubmissionId(
      store,
      defaults,
      yearFromDmyDate(
        requireDate(
          input.aefT5AuthorizedEntitiesAuthorizationDate,
          'aefT5AuthorizedEntitiesAuthorizationDate',
        ),
        'aefT5AuthorizedEntitiesAuthorizationDate',
      ),
      options,
    ));

  return store.create('t5AuthorizedEntities', { ...input, aefT1SubmissionId: submissionId });
}

function requireDate(value: string | undefined, field: string): string {
  if (!value) {
    throw new InvalidRecordDateError(
      `${field} is required to derive the reporting year; pass options.submissionId to skip it`,
    );
  }
  return value;
}

/**
 * Resolves the **circular** T2 <-> T5 relationship the README describes:
 * Postgres allows both columns to be nullable, but neither row can be
 * inserted with its counterpart already set, so both must exist before either
 * side is linked. Call this once both records have been written.
 */
export async function linkAuthorizationToEntity(
  store: AefStore,
  authorizationId: string,
  entityId: string,
): Promise<{
  authorization: AefT2AuthorizationsRecord;
  entity: AefT5AuthorizedEntitiesRecord;
}> {
  const authorization = await store.update('t2Authorizations', authorizationId, {
    aefT5AuthorizedEntitiesId: entityId,
  });
  const entity = await store.update('t5AuthorizedEntities', entityId, {
    aefT2AuthorizationsId: authorizationId,
  });
  return { authorization, entity };
}
