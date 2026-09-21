import { AefT5AuthorizedEntitiesCreateInput } from '../tables/aefT5AuthorizedEntities';

/**
 * Supplies Table 5 rows. **Implemented by the registry.**
 *
 * Mirrors {@link HoldingsProvider} for the same reason: this library has no
 * concept of a "cooperative approach authorized entity" beyond the AEF shape
 * itself, and gains nothing by acquiring one. Working out who is currently
 * authorized, and since when, is registry data.
 */
export interface AuthorizedEntitiesProvider {
  /**
   * Authorized entities as at `asOf` — the instant the caller asked for, which
   * defaults to now but may be any point the registry states.
   *
   * Implementations should honour it rather than always returning the current
   * list. A provider that ignores `asOf` records the wrong instant, and because
   * a snapshot is frozen the error stays invisible until someone reconciles a
   * filed submission — the same failure mode {@link HoldingsProvider} warns
   * about.
   */
  getAuthorizedEntities(params: {
    reportedYear: number;
    asOf: Date;
  }): Promise<AefT5AuthorizedEntitiesCreateInput[]>;
}
