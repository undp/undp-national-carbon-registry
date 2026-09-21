/**
 * Internal timestamps are epoch milliseconds; CAD Trust wants `YYYY-MM-DD`. The single
 * implementation for the whole `cadtrust-sync` module — it was previously copy-pasted into five
 * mappers/services, four of them missing the `Number(...)` coercion below.
 *
 * `Number(...)` is load-bearing, not defensive typing. Several of the bigint columns whose values
 * reach here (`CreditBlocksEntity.txTime`, `createTime`, ...) are hydrated by TypeORM as **strings**
 * unless the column carries `NumberTransformer`, and `new Date("1700000000000")` parses its argument
 * as a *date string*, not epoch millis — an Invalid Date whose `.toISOString()` throws
 * `RangeError: Invalid time value`.
 *
 * Returns `undefined` (never throws) for a missing or unparseable value, so one bad timestamp can't
 * sink the whole sync record. Callers that need a required date field decide their own fallback.
 */
export function toCadTrustIsoDate(epochMs: number | string | undefined | null): string | undefined {
  if (epochMs === undefined || epochMs === null || epochMs === "") {
    return undefined;
  }
  const date = new Date(Number(epochMs));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().split("T")[0];
}
