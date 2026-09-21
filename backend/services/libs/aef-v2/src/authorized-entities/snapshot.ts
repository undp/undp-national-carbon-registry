import { Clock, currentYear, systemClock } from '../clock';
import {
  AefSubmissionDefaults,
  ensureSubmissionForYear,
  findSubmissionVersions,
} from '../submission/bootstrap';
import { AefStore } from '../store/aef-store.port';
import {
  AefT5AuthorizedEntitiesCreateInput,
  AefT5AuthorizedEntitiesRecord,
} from '../tables/aefT5AuthorizedEntities';
import { AuthorizedEntitiesProvider } from './provider';

/**
 * Page size used when reading a year's Authorized entities.
 *
 * Mirrors `MAX_HOLDINGS_PER_YEAR` in `holdings/snapshot.ts` for the same
 * reason: high enough that a year's list always arrives in one query, so the
 * default page size never silently truncates a snapshot.
 */
const MAX_AUTHORIZED_ENTITIES_PER_YEAR = 10_000;

export class AuthorizedEntitiesSnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizedEntitiesSnapshotError';
  }
}

export interface CurrentYearAuthorizedEntities {
  reportedYear: number;
  asOf: Date;
  provisional: true;
  rows: AefT5AuthorizedEntitiesCreateInput[];
}

/**
 * Live Authorized entities for the open year. Nothing is stored.
 *
 * Mirrors `getCurrentYearHoldings`: these figures are as-at-now and will
 * change, so `provisional` is returned rather than left to be inferred.
 */
export async function getCurrentYearAuthorizedEntities(
  provider: AuthorizedEntitiesProvider,
  year?: number,
  clock: Clock = systemClock,
): Promise<CurrentYearAuthorizedEntities> {
  const reportedYear = year ?? currentYear(clock);
  const asOf = clock.now();
  const rows = await provider.getAuthorizedEntities({ reportedYear, asOf });
  return { reportedYear, asOf, provisional: true, rows };
}

export interface AuthorizedEntitiesSnapshotResult {
  reportedYear: number;
  rows: AefT5AuthorizedEntitiesRecord[];
  /** False when an existing snapshot was returned untouched. */
  created: boolean;
}

export interface AuthorizedEntitiesSnapshotOptions {
  /**
   * The instant the list is taken at. Defaults to now.
   *
   * Mirrors `SnapshotOptions.asOf` in `holdings/snapshot.ts`: the registry
   * owns this, and supplying it waives the open-year guard, because passing
   * an instant is a statement of intent.
   */
  asOf?: Date;

  /**
   * Overwrite an existing snapshot, or freeze a year that is not yet over.
   *
   * Same reasoning as `SnapshotOptions.force` — a deliberate correction, not a
   * routine path.
   */
  force?: boolean;
}

/**
 * Freezes the 31 December Authorized entities for a completed year.
 *
 * The Table 5 counterpart to `snapshotHoldingsForYear` — see that function's
 * docblock for the underlying reasoning, which applies here unchanged: who was
 * authorized on 31 December stops being reconstructible from current state
 * once an authorization is later revoked, so it has to be captured while it is
 * still true.
 *
 * Ensures the year's Submission exists first, because CMA.6 gives Table 5 no
 * reported-year column either — the year association runs through
 * `aefT1SubmissionId`, exactly as for Table 4.
 *
 * **Reconciles by business key rather than inserting a fresh batch.** A host
 * may write an unfrozen row mid-year — e.g. when an Action needs to reference
 * an Authorized entity, before this year's snapshot has run at all — and this
 * function is the only place that would otherwise collide with it. For every
 * entity the provider computes, an existing unfrozen row sharing its
 * `aefT5AuthorizedEntitiesId` is updated in place (fresh field values plus
 * `snapshotAt`) instead of a second row being created. Any unfrozen row left
 * over after that — one the provider's own live query didn't independently
 * return, e.g. because the entity's `authorizationDate` is unset — is frozen
 * as-is rather than silently discarded, since it is still a real record for
 * this year.
 */
export async function snapshotAuthorizedEntitiesForYear(
  store: AefStore,
  provider: AuthorizedEntitiesProvider,
  defaults: AefSubmissionDefaults,
  year: number,
  options: AuthorizedEntitiesSnapshotOptions = {},
  clock: Clock = systemClock,
): Promise<AuthorizedEntitiesSnapshotResult> {
  // Mirrors the guard in `snapshotHoldingsForYear`: an explicit `asOf` is a
  // statement of intent, so the open-year guard only applies to the default
  // path — a mid-year run that forgot to say when.
  if (options.asOf === undefined && year >= currentYear(clock) && !options.force) {
    throw new AuthorizedEntitiesSnapshotError(
      `Refusing to snapshot ${year}: the year is not over and no asOf was given, so this ` +
        `would freeze a partial list as though it were the year-end position. Pass an ` +
        `explicit asOf, or force to override.`,
    );
  }

  const { record: submission } = await ensureSubmissionForYear(store, defaults, year, clock);

  const existing = await store.find('t5AuthorizedEntities', {
    where: { aefT1SubmissionId: submission.id },
    pageSize: MAX_AUTHORIZED_ENTITIES_PER_YEAR,
  });
  // `!= null`, not `!== undefined`: a store backed by a real database returns
  // SQL NULL for an unfrozen row, and `null !== undefined` is true — which
  // classified every real-time row as already frozen and returned here without
  // ever calling the provider. Table 5 has a real-time write path
  // (AefV2WriteService), so it hits that case constantly; the in-memory test
  // store leaves the field absent, i.e. `undefined`, which is why the specs
  // never caught it. Same reasoning at every `snapshotAt` check below.
  const frozen = existing.data.filter((row) => row.snapshotAt != null);

  if (frozen.length > 0 && !options.force) {
    return { reportedYear: year, rows: frozen, created: false };
  }

  if (frozen.length > 0 && options.force) {
    for (const row of frozen) {
      await store.delete('t5AuthorizedEntities', row.id);
    }
  }

  // Rows still unfrozen after the deletion above — real-time writes this
  // year, keyed by business key so the loop below can match against them.
  const unfrozenByKey = new Map<string, AefT5AuthorizedEntitiesRecord>();
  for (const row of existing.data) {
    if (row.snapshotAt != null) {
      continue; // was frozen; either returned above, or just deleted under force
    }
    if (typeof row.aefT5AuthorizedEntitiesId === 'string') {
      unfrozenByKey.set(row.aefT5AuthorizedEntitiesId, row);
    }
  }

  const asOf = options.asOf ?? clock.now();
  const snapshotAt = clock.now().toISOString();
  const computed = await provider.getAuthorizedEntities({ reportedYear: year, asOf });

  const rows: AefT5AuthorizedEntitiesRecord[] = [];
  const matchedKeys = new Set<string>();
  for (const row of computed) {
    const key = row.aefT5AuthorizedEntitiesId;
    const existingRow = typeof key === 'string' ? unfrozenByKey.get(key) : undefined;
    if (existingRow) {
      matchedKeys.add(key as string);
      rows.push(
        await store.update('t5AuthorizedEntities', existingRow.id, {
          ...row,
          snapshotAt,
          aefT1SubmissionId: submission.id,
        }),
      );
    } else {
      rows.push(
        await store.create('t5AuthorizedEntities', {
          ...row,
          snapshotAt,
          aefT1SubmissionId: submission.id,
        }),
      );
    }
  }

  // Real-time rows the live query didn't independently return this pass —
  // still real for this year, so filed rather than left unfrozen forever.
  for (const [key, row] of unfrozenByKey) {
    if (matchedKeys.has(key)) {
      continue;
    }
    rows.push(await store.update('t5AuthorizedEntities', row.id, { snapshotAt }));
  }

  return { reportedYear: year, rows, created: true };
}

export interface AuthorizedEntitiesForYear {
  reportedYear: number;
  rows: AefT5AuthorizedEntitiesCreateInput[];
  /** True when the figures are live and still changing. */
  provisional: boolean;
  /** When the snapshot was frozen. Absent for a provisional year. */
  snapshotAt?: string;
}

/**
 * Stored snapshot for a closed year; live computation for the open one.
 *
 * The Table 5 counterpart to `getHoldingsForYear` — same version-walking
 * behaviour, for the same reason: a revision creates a new Submission, but
 * rows filed under the previous version keep pointing at it.
 */
export async function getAuthorizedEntitiesForYear(
  store: AefStore,
  provider: AuthorizedEntitiesProvider,
  defaults: AefSubmissionDefaults,
  year: number,
  clock: Clock = systemClock,
): Promise<AuthorizedEntitiesForYear> {
  const versions = await findSubmissionVersions(store, defaults.aefT1SubmissionParty, year);
  // Only meaningful for the currently-open year — a past year has no "now"
  // to compute live entities as of, and the provider's own contract is
  // "authorized as of `asOf`", not "as of the year in question". Fetched
  // lazily so a closed year's lookup never calls the provider at all.
  const live =
    year === currentYear(clock) ? await getCurrentYearAuthorizedEntities(provider, year, clock) : undefined;

  if (versions.length > 0) {
    const page = await store.find('t5AuthorizedEntities', {
      whereIn: { aefT1SubmissionId: versions.map((version) => version.id) },
      pageSize: MAX_AUTHORIZED_ENTITIES_PER_YEAR,
    });

    const frozenByVersion = new Map<string, typeof page.data>();
    for (const row of page.data) {
      /** For a current year draft version all the auth entities that are engaged in any action
       *  should be visible in T5.
       * */ 
      if (year !== currentYear(clock) && (row.snapshotAt == null || row.aefT1SubmissionId == null)) {
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
      let rows: AefT5AuthorizedEntitiesCreateInput[] | undefined = frozenByVersion.get(version.id);
      let provisional = false;
      if (year === currentYear(clock)) {
        const byKey = new Map((rows ?? []).map((row) => [row.aefT5AuthorizedEntitiesId, row]));
        for (const row of live?.rows ?? []) {
          if (!byKey.has(row.aefT5AuthorizedEntitiesId)) {
            byKey.set(row.aefT5AuthorizedEntitiesId, row);
          }
        }
        rows = [...byKey.values()];
        provisional = true;
      }
      if (rows && rows.length > 0) {
        return {
          reportedYear: year,
          rows,
          provisional,
          snapshotAt: rows[0].snapshotAt,
        };
      }
    }
  }

  // Mirrors the fix in getHoldingsForYear (holdings/snapshot.ts) — only the
  // currently open year has a meaningful "live" figure to fall back to. A
  // past year with no versions at all (nothing was ever tracked, or the
  // system started after it ended) has no true entity list to report, and a
  // future year hasn't happened yet; falling through unconditionally here
  // used to return *today's* live entities mislabeled as whatever
  // past/future year was asked for.
  if (year !== currentYear(clock)) {
    return { reportedYear: year, rows: [], provisional: false };
  }

  // `live` was computed above precisely because year === currentYear(clock)
  // — the branch above already returned otherwise, so it is always set here.
  return { reportedYear: year, rows: live!.rows, provisional: true };
}
