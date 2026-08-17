import { AuthorizedEntitiesProvider } from '../authorized-entities/provider';
import { getAuthorizedEntitiesForYear } from '../authorized-entities/snapshot';
import { Clock, systemClock } from '../clock';
import { AefSubmissionExport } from '../export/submission';
import { HoldingsProvider, getHoldingsForYear } from '../holdings/snapshot';
import { AefStore } from '../store/aef-store.port';
import { AefT1SubmissionRecord, AefSubmissionStatus } from '../tables/aefT1Submission';
import { AefT2AuthorizationsRecord } from '../tables/aefT2Authorizations';
import { AefT3ActionsRecord } from '../tables/aefT3Actions';
import { AefT4HoldingsCreateInput } from '../tables/aefT4Holdings';
import { AefT5AuthorizedEntitiesCreateInput } from '../tables/aefT5AuthorizedEntities';
import { AefSubmissionBundle } from '../validation/validate';
import { AefSubmissionDefaults, findSubmissionVersions } from './bootstrap';

/**
 * Page size used when reading a year's Authorizations and Actions.
 *
 * Same reasoning as `MAX_HOLDINGS_PER_YEAR` in `holdings/snapshot.ts`: high
 * enough that a year's rows always arrive in one query, so the default page
 * size of 25 never silently truncates a submission.
 */
const MAX_BUNDLE_ROWS_PER_YEAR = 10_000;

export interface AefBundleDeps {
  store: AefStore;
  holdings: HoldingsProvider;
  authorizedEntities: AuthorizedEntitiesProvider;
}

/**
 * One reporting year's five tables, fetched and labelled — the read side of
 * this library's contract, mirroring `AefRolloverDeps`/`recordAction` on the
 * write side.
 *
 * Table 1, 2 and 3 always come from the AEF store: they have no meaning
 * except as filed rows. Table 4 and 5 follow `getHoldingsForYear` /
 * `getAuthorizedEntitiesForYear` — stored and frozen for a closed year, live
 * and `provisional` for the year still being aggregated, because a current
 * balance or entity list is registry state, not an AEF row, until it is
 * snapshotted.
 */
export interface AefLoadedBundle {
  reportedYear: number;
  /** The current (latest non-superseded) Submission for the year, if any. */
  submission?: AefT1SubmissionRecord;
  authorizations: AefT2AuthorizationsRecord[];
  actions: AefT3ActionsRecord[];
  holdings: AefT4HoldingsCreateInput[];
  authorizedEntities: AefT5AuthorizedEntitiesCreateInput[];
  provisional: { holdings: boolean; authorizedEntities: boolean };
  snapshotAt: { holdings?: string; authorizedEntities?: string };
}

/**
 * Fetches one reporting year's five tables as a single bundle.
 *
 * Resolves across **every** Submission version for the year for Table 2 and
 * 3, not just the current one — a revision creates a new Submission, and rows
 * filed under the previous version keep pointing at it, exactly as
 * `getHoldingsForYear` already handles for Table 4.
 */
export async function loadSubmissionBundle(
  deps: AefBundleDeps,
  defaults: AefSubmissionDefaults,
  year: number,
  clock: Clock = systemClock,
): Promise<AefLoadedBundle> {
  const versions = await findSubmissionVersions(deps.store, defaults.aefT1SubmissionParty, year);
  const live = versions.filter((version) => version.status !== AefSubmissionStatus.SUPERSEDED);
  // `findSubmissionVersions` sorts newest version first.
  const submission = live[0];
  const versionIds = versions.map((version) => version.id);

  const authorizations =
    versionIds.length === 0
      ? []
      : (
          await deps.store.find('t2Authorizations', {
            whereIn: { aefT1SubmissionId: versionIds },
            pageSize: MAX_BUNDLE_ROWS_PER_YEAR,
          })
        ).data;

  const actions =
    versionIds.length === 0
      ? []
      : (
          await deps.store.find('t3Actions', {
            whereIn: { aefT1SubmissionId: versionIds },
            pageSize: MAX_BUNDLE_ROWS_PER_YEAR,
          })
        ).data;

  const holdingsResult = await getHoldingsForYear(deps.store, deps.holdings, defaults, year, clock);
  const authorizedEntitiesResult = await getAuthorizedEntitiesForYear(
    deps.store,
    deps.authorizedEntities,
    defaults,
    year,
    clock,
  );

  return {
    reportedYear: year,
    submission,
    authorizations,
    actions,
    holdings: holdingsResult.rows,
    authorizedEntities: authorizedEntitiesResult.rows,
    provisional: {
      holdings: holdingsResult.provisional,
      authorizedEntities: authorizedEntitiesResult.provisional,
    },
    snapshotAt: {
      holdings: holdingsResult.snapshotAt,
      authorizedEntities: authorizedEntitiesResult.snapshotAt,
    },
  };
}

/**
 * Reshapes a loaded bundle for {@link toSubmissionCsv} / `toSubmissionXlsxBuffer`.
 *
 * One fetch feeds both export and validation without the caller reshaping
 * anything twice.
 */
export function toAefSubmissionExport(bundle: AefLoadedBundle): AefSubmissionExport {
  return {
    t1Submission: bundle.submission ? [bundle.submission as unknown as Record<string, unknown>] : [],
    t2Authorizations: bundle.authorizations as unknown as Record<string, unknown>[],
    t3Actions: bundle.actions as unknown as Record<string, unknown>[],
    t4Holdings: bundle.holdings as unknown as Record<string, unknown>[],
    t5AuthorizedEntities: bundle.authorizedEntities as unknown as Record<string, unknown>[],
  };
}

/** Reshapes a loaded bundle for {@link validateSubmission}. */
export function toValidationBundle(bundle: AefLoadedBundle): AefSubmissionBundle {
  return {
    submission: bundle.submission as unknown as Readonly<Record<string, unknown>> | undefined,
    authorizations: bundle.authorizations as unknown as readonly Readonly<Record<string, unknown>>[],
    actions: bundle.actions as unknown as readonly Readonly<Record<string, unknown>>[],
    holdings: bundle.holdings as unknown as readonly Readonly<Record<string, unknown>>[],
    authorizedEntities: bundle.authorizedEntities as unknown as readonly Readonly<
      Record<string, unknown>
    >[],
  };
}
