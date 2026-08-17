import { Clock, currentYear, systemClock } from '../clock';
import {
  AefSubmissionDefaults,
  ensureSubmissionForYear,
  findSubmissionVersions,
} from '../submission/bootstrap';
import { AefStore } from '../store/aef-store.port';
import { AefT4HoldingsCreateInput, AefT4HoldingsRecord } from '../tables/aefT4Holdings';

/**
 * Computes holdings balances. **Implemented by the registry.**
 *
 * This library has no concept of a credit block and gains nothing by acquiring
 * one, so the one thing it cannot do — work out how many ITMOs are held — comes
 * in through a port, exactly as `RefResolver` does.
 */
export interface HoldingsProvider {
  /**
   * Holdings as at `asOf` — the instant the caller asked for, which defaults to
   * now but may be any point the registry states.
   *
   * Implementations should honour it rather than always returning live
   * balances. A provider that ignores `asOf` records the wrong instant, and
   * because a snapshot is frozen the error stays invisible until someone
   * reconciles a filed submission.
   */
  getHoldings(params: { reportedYear: number; asOf: Date }): Promise<AefT4HoldingsCreateInput[]>;
}

/**
 * Page size used when reading a year's holdings.
 *
 * High enough that a year's snapshot always arrives in one query — the default
 * 25 would silently truncate and make a snapshot look smaller than it is.
 */
const MAX_HOLDINGS_PER_YEAR = 10_000;

export class HoldingsSnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HoldingsSnapshotError';
  }
}

export interface CurrentYearHoldings {
  reportedYear: number;
  asOf: Date;
  provisional: true;
  rows: AefT4HoldingsCreateInput[];
}

/**
 * Live holdings for the open year. Nothing is stored.
 *
 * These figures are as-at-now and will change; a caller must present them
 * differently from a frozen snapshot, which is why `provisional` is returned
 * rather than left to be inferred.
 */
export async function getCurrentYearHoldings(
  provider: HoldingsProvider,
  year?: number,
  clock: Clock = systemClock,
): Promise<CurrentYearHoldings> {
  const reportedYear = year ?? currentYear(clock);
  const asOf = clock.now();
  const rows = await provider.getHoldings({ reportedYear, asOf });
  return { reportedYear, asOf, provisional: true, rows };
}

export interface SnapshotResult {
  reportedYear: number;
  rows: AefT4HoldingsRecord[];
  /** False when an existing snapshot was returned untouched. */
  created: boolean;
}

export interface SnapshotOptions {
  /**
   * The instant the balance is taken at. Defaults to now.
   *
   * The registry owns this: it either runs the snapshot at the moment it wants
   * captured — 31 December, typically — or states the instant explicitly here.
   * The library does not compute a year-end boundary on the caller's behalf,
   * because only the registry knows which instant its balances are meaningful
   * at. {@link endOfYearUtc} is exported for callers that want one.
   *
   * Supplying this also **waives the open-year guard**: passing an instant is a
   * statement of intent, so snapshotting the current year is then allowed.
   */
  asOf?: Date;

  /**
   * Overwrite an existing snapshot, or freeze a year that is not yet over.
   *
   * A deliberate correction, not a routine path — the caller should log it. An
   * accidental re-run after credits have moved would silently rewrite a figure
   * that may already have been filed with CARP, and nothing would look broken.
   */
  force?: boolean;
}

/**
 * Freezes the 31 December holdings for a completed year.
 *
 * Holdings are a balance at an instant. Once credits move in January the
 * previous year-end position stops being reconstructible from current state, so
 * it has to be captured while it is still true — that is the whole reason this
 * table is stored rather than derived on read.
 *
 * Ensures the year's Submission exists first, because CMA.6 gives Table 4 no
 * reported-year column: the year association runs through
 * `aefT1SubmissionId`.
 *
 * **Timing is the registry's.** The balance is taken at `options.asOf`, or at
 * now when that is omitted — this function does not compute a year-end
 * boundary, because only the caller knows which instant its balances are
 * meaningful at.
 */
export async function snapshotHoldingsForYear(
  store: AefStore,
  provider: HoldingsProvider,
  defaults: AefSubmissionDefaults,
  year: number,
  options: SnapshotOptions = {},
  clock: Clock = systemClock,
): Promise<SnapshotResult> {
  // An explicit `asOf` is a statement of intent, so the open-year guard only
  // applies to the default path — a mid-year run that forgot to say when.
  // Without that exemption a 31 December cron could never snapshot its own year.
  if (options.asOf === undefined && year >= currentYear(clock) && !options.force) {
    throw new HoldingsSnapshotError(
      `Refusing to snapshot ${year}: the year is not over and no asOf was given, so this ` +
        `would freeze a partial balance as though it were the year-end position. Pass an ` +
        `explicit asOf, or force to override.`,
    );
  }

  const { record: submission } = await ensureSubmissionForYear(store, defaults, year, clock);

  const existing = await store.find('t4Holdings', {
    where: { aefT1SubmissionId: submission.id },
    pageSize: MAX_HOLDINGS_PER_YEAR,
  });
  const frozen = existing.data.filter((row) => row.snapshotAt !== undefined);

  if (frozen.length > 0 && !options.force) {
    return { reportedYear: year, rows: frozen, created: false };
  }

  if (frozen.length > 0 && options.force) {
    for (const row of frozen) {
      await store.delete('t4Holdings', row.id);
    }
  }

  const asOf = options.asOf ?? clock.now();
  const snapshotAt = clock.now().toISOString();
  const computed = await provider.getHoldings({ reportedYear: year, asOf });

  const rows: AefT4HoldingsRecord[] = [];
  for (const row of computed) {
    rows.push(
      await store.create('t4Holdings', {
        ...row,
        snapshotAt,
        aefT1SubmissionId: submission.id,
      }),
    );
  }

  return { reportedYear: year, rows, created: true };
}

export interface HoldingsForYear {
  reportedYear: number;
  rows: AefT4HoldingsCreateInput[];
  /** True when the figures are live and still moving. */
  provisional: boolean;
  /** When the snapshot was frozen. Absent for a provisional year. */
  snapshotAt?: string;
}

/**
 * Stored snapshot for a closed year; live computation for the open one.
 *
 * Resolves across **every** Submission version for the year, preferring the
 * newest that actually has rows — a revision creates a new Submission, but rows
 * filed under the previous version keep pointing at it.
 */
export async function getHoldingsForYear(
  store: AefStore,
  provider: HoldingsProvider,
  defaults: AefSubmissionDefaults,
  year: number,
  clock: Clock = systemClock,
): Promise<HoldingsForYear> {
  const versions = await findSubmissionVersions(store, defaults.aefT1SubmissionParty, year);

  if (versions.length > 0) {
    // One query across every version, rather than one round trip per version.
    const page = await store.find('t4Holdings', {
      whereIn: { aefT1SubmissionId: versions.map((version) => version.id) },
      pageSize: MAX_HOLDINGS_PER_YEAR,
    });

    const frozenByVersion = new Map<string, typeof page.data>();
    for (const row of page.data) {
      if (row.snapshotAt === undefined || row.aefT1SubmissionId === undefined) {
        continue;
      }
      const bucket = frozenByVersion.get(row.aefT1SubmissionId);
      if (bucket) {
        bucket.push(row);
      } else {
        frozenByVersion.set(row.aefT1SubmissionId, [row]);
      }
    }

    // `findSubmissionVersions` returns newest first, so the first version with
    // frozen rows is the most recent one actually filed.
    for (const version of versions) {
      const frozen = frozenByVersion.get(version.id);
      if (frozen && frozen.length > 0) {
        return {
          reportedYear: year,
          rows: frozen,
          provisional: false,
          snapshotAt: frozen[0].snapshotAt,
        };
      }
    }
  }

  // No frozen snapshot exists for this year. Only the currently open year has
  // a meaningful "live" figure to fall back to — a past year that was never
  // snapshotted (nothing was ever tracked, or the system started after it
  // ended) has no true holdings to report, and a future year hasn't happened
  // yet. Falling through unconditionally here used to return *today's* live
  // holdings mislabeled as whatever past/future year was asked for, which
  // doesn't match Submission/Authorizations/Actions — they already return
  // nothing for a year with no Submission record.
  if (year !== currentYear(clock)) {
    return { reportedYear: year, rows: [], provisional: false };
  }

  const live = await getCurrentYearHoldings(provider, year, clock);
  return { reportedYear: year, rows: live.rows, provisional: true };
}
