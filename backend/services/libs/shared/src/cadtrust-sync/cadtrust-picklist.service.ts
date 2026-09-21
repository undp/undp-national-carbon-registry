import { CadTrustV2Service } from "@app/cadtrust";
import { Injectable, Logger } from "@nestjs/common";

/**
 * Cached read of `GET /v2/governance/meta/pickList`, used to sanity-check the
 * values in `mappers/picklist.map.ts`.
 *
 * Picklist values are governed by CAD Trust's Technical Committee and change
 * over time, which is why `@app/cadtrust` types those fields as plain `string`
 * rather than unions. This service closes that loop for the adaptor — but it
 * **warns, it never blocks**. A locally stale mapping table is not a good enough
 * reason to stop real data reaching CAD Trust, and the node will reject a genuinely
 * bad value anyway with a message far more useful than anything guessed here.
 */
@Injectable()
export class CadTrustPicklistService {
  private static readonly CACHE_TTL_MS = 60 * 60 * 1000;

  private cache?: Record<string, string[]>;
  private cachedAt = 0;

  constructor(
    private readonly cadTrustV2Service: CadTrustV2Service,
    private readonly logger: Logger
  ) {}

  /** Returns the live picklists, or undefined when the node cannot be reached. */
  async getPickLists(): Promise<Record<string, string[]> | undefined> {
    if (this.cache && Date.now() - this.cachedAt < CadTrustPicklistService.CACHE_TTL_MS) {
      return this.cache;
    }

    try {
      this.cache = await this.cadTrustV2Service.getClient().governance.getPickList();
      this.cachedAt = Date.now();
      return this.cache;
    } catch (error) {
      this.logger.warn(
        "Could not fetch CAD Trust picklists; skipping mapped-value validation for this run",
        error
      );
      // Deliberately not cached, so the next sync retries rather than being
      // stuck with a failed lookup for an hour.
      return undefined;
    }
  }

  /**
   * Logs a warning for any mapped value that is not in the live picklist.
   * Returns the values unchanged either way.
   */
  async warnOnUnknownValues(pickListKey: string, values: string[]): Promise<string[]> {
    const pickLists = await this.getPickLists();
    const allowed = pickLists?.[pickListKey];

    if (!allowed) {
      // Either the node is unreachable or CAD Trust does not publish this key
      // under this name — both are worth knowing, neither is worth failing on.
      return values;
    }

    for (const value of values) {
      if (value && !allowed.includes(value)) {
        this.logger.warn(
          `CAD Trust picklist "${pickListKey}" does not contain mapped value "${value}". ` +
            `Update libs/shared/src/cadtrust-sync/mappers/picklist.map.ts. Allowed: ${allowed.join(", ")}`
        );
      }
    }

    return values;
  }
}
