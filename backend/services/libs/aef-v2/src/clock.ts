/**
 * Time seam.
 *
 * Nothing in this library calls `new Date()` directly. Two behaviours depend on
 * "now" and both need to be assertable against a fixed instant rather than the
 * test machine's clock:
 *
 *  - `ensureSubmissionForYear` defaults to the *previous* calendar year.
 *  - `snapshotHoldingsForYear` refuses to freeze the current (open) year.
 *
 * `portability.spec.ts` enforces that this file is the only place `new Date()`
 * appears.
 */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

/** Fixed clock, for tests and for any caller that needs a deterministic "now". */
export function fixedClock(instant: Date): Clock {
  return { now: () => new Date(instant.getTime()) };
}

/**
 * Last instant of `year` in UTC — `31 Dec <year> 23:59:59.999Z`.
 *
 * A **convenience for callers**, not something this library applies on its own.
 * `snapshotHoldingsForYear` takes whatever `asOf` it is given, because only the
 * registry knows which instant its balances are meaningful at. Pass this when
 * you want the year-end boundary specifically.
 *
 * Deliberately UTC. The Common Nomenclature specifies ISO-8601 timestamps with
 * a zero offset (`...Z`), and a year boundary computed in local time silently
 * includes or excludes every transfer that happened either side of midnight.
 */
export function endOfYearUtc(year: number): Date {
  return new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
}

/** Calendar year of `clock.now()`, in UTC. */
export function currentYear(clock: Clock): number {
  return clock.now().getUTCFullYear();
}
