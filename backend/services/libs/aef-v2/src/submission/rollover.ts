import { AuthorizedEntitiesProvider } from '../authorized-entities/provider';
import {
  AuthorizedEntitiesSnapshotResult,
  snapshotAuthorizedEntitiesForYear,
} from '../authorized-entities/snapshot';
import { Clock, currentYear, endOfYearUtc, systemClock } from '../clock';
import { HoldingsProvider, SnapshotResult, snapshotHoldingsForYear } from '../holdings/snapshot';
import { AefStore } from '../store/aef-store.port';
import { AefT1SubmissionRecord } from '../tables/aefT1Submission';
import { AefSubmissionDefaults, ensureSubmissionForYear } from './bootstrap';

/**
 * What `openReportingYear` needs from the host, gathered in one place so a
 * caller wires it up once rather than threading three arguments through every
 * call.
 */
export interface AefRolloverDeps {
  store: AefStore;
  holdings: HoldingsProvider;
  authorizedEntities: AuthorizedEntitiesProvider;
}

export interface AefRolloverOptions {
  /** The year being opened. Defaults to the current calendar year. */
  openYear?: number;
  /**
   * The instant the closed year's balances are taken at.
   *
   * Unlike `snapshotHoldingsForYear`, this operation **does** default the
   * boundary — to `endOfYearUtc(closedYear)` — because its entire purpose is
   * "close last year", so guessing at any other instant would defeat the
   * point of calling it. Pass an explicit value only to override that.
   */
  asOf?: Date;
  /** Forwarded to both snapshot calls. See `SnapshotOptions.force`. */
  force?: boolean;
}

export interface AefRolloverResult {
  openedYear: number;
  submission: AefT1SubmissionRecord;
  submissionCreated: boolean;
  closedYear: number;
  holdings: SnapshotResult;
  authorizedEntities: AuthorizedEntitiesSnapshotResult;
}

/**
 * Start-of-year rollover: opens next year's draft Submission and freezes the
 * year that just ended.
 *
 * Three idempotent operations run in sequence — a cron retry or a
 * double-clicked button lands on the same result either way:
 *
 *  1. `ensureSubmissionForYear(openYear)` — the new year's draft row.
 *  2. `snapshotHoldingsForYear(closedYear)` — via the registry's
 *     `HoldingsProvider`; also ensures the closed year's Submission exists,
 *     since Table 4 has no reported-year column of its own.
 *  3. `snapshotAuthorizedEntitiesForYear(closedYear)` — the Table 5 analogue.
 *
 * The trigger is deliberately not this function's concern, exactly as for
 * `ensureSubmissionForYear`: whether a cron or an operator calls it is the
 * registry's decision.
 */
export async function openReportingYear(
  deps: AefRolloverDeps,
  defaults: AefSubmissionDefaults,
  options: AefRolloverOptions = {},
  clock: Clock = systemClock,
): Promise<AefRolloverResult> {
  const openedYear = options.openYear ?? currentYear(clock);
  const closedYear = openedYear - 1;
  const asOf = options.asOf ?? endOfYearUtc(closedYear);

  const { record: submission, created: submissionCreated } = await ensureSubmissionForYear(
    deps.store,
    defaults,
    openedYear,
    clock,
  );

  const holdings = await snapshotHoldingsForYear(
    deps.store,
    deps.holdings,
    defaults,
    closedYear,
    { asOf, force: options.force },
    clock,
  );

  const authorizedEntities = await snapshotAuthorizedEntitiesForYear(
    deps.store,
    deps.authorizedEntities,
    defaults,
    closedYear,
    { asOf, force: options.force },
    clock,
  );

  return {
    openedYear,
    submission,
    submissionCreated,
    closedYear,
    holdings,
    authorizedEntities,
  };
}
