import { AefV2ReportService } from "./aef-v2-report.service";

/**
 * `query` is the reporting tables' read path. It shapes Table 3's Action date
 * for display without touching what is stored or exported - see the service's
 * `forDisplay` docblock for why the two must differ.
 *
 * The service is constructed with stubs for everything except the store, which
 * is the only dependency `loadSubmissionBundle` actually reaches for here.
 */
describe("AefV2ReportService query display shaping", () => {
  const defaults = {
    aefT1SubmissionParty: "NGA",
    aefT1SubmissionNdcFirstYear: 2021,
    aefT1SubmissionNdcLastYear: 2030,
  };

  const buildService = (actions: Record<string, unknown>[]) => {
    const service = new AefV2ReportService(
      {} as any, // storeFactory
      defaults as any,
      {} as any, // holdings
      {} as any, // authorizedEntities
      {} as any, // fileHandler
      {} as any, // controlledValues
      {} as any // countryService
    );
    // Stubbed at the bundle boundary: the shaping under test happens after it,
    // and a real bundle would need the whole store/provider stack.
    (service as any).loadBundle = jest.fn().mockResolvedValue({
      submission: undefined,
      authorizations: [],
      actions,
      holdings: [],
      authorizedEntities: [],
      provisional: { holdings: false, authorizedEntities: false },
      snapshotAt: { holdings: undefined, authorizedEntities: undefined },
    });
    return service;
  };

  it("shows Table 3's Action date as dd/mm/yyyy, not the stored ISO datetime", async () => {
    const service = buildService([
      { aefT3ActionsDate: "2026-08-11T12:14:03.356Z", aefT3ActionsType: "First transfer" },
    ]);

    const result = await service.query("t3Actions", 2026);

    expect(result.data[0]).toMatchObject({
      aefT3ActionsDate: "11/08/2026",
      aefT3ActionsType: "First transfer",
    });
  });

  /**
   * The stored instant is UTC. A late-evening UTC action must not display as
   * the next day just because the server sits east of Greenwich.
   */
  it("takes the day from the UTC instant, not the server's timezone", async () => {
    const service = buildService([{ aefT3ActionsDate: "2026-08-11T23:45:00.000Z" }]);

    const result = await service.query("t3Actions", 2026);

    expect(result.data[0]).toMatchObject({ aefT3ActionsDate: "11/08/2026" });
  });

  it("passes a value through untouched when it is not a parseable date", async () => {
    const service = buildService([{ aefT3ActionsDate: "not a date" }]);

    const result = await service.query("t3Actions", 2026);

    expect(result.data[0]).toMatchObject({ aefT3ActionsDate: "not a date" });
  });

  it("leaves other tables alone", async () => {
    const service = buildService([]);

    const result = await service.query("t2Authorizations", 2026);

    expect(result.data).toEqual([]);
  });
});

/**
 * `query`'s ordering. Applied in memory rather than through the store's own
 * `sort`, because the same bundle feeds `download`/`submit` - see the service's
 * `sorted` docblock.
 */
describe("AefV2ReportService query sorting", () => {
  const defaults = {
    aefT1SubmissionParty: "NGA",
    aefT1SubmissionNdcFirstYear: 2021,
    aefT1SubmissionNdcLastYear: 2030,
  };

  const buildService = (bundle: Record<string, unknown>) => {
    const service = new AefV2ReportService(
      {} as any, // storeFactory
      defaults as any,
      {} as any, // holdings
      {} as any, // authorizedEntities
      {} as any, // fileHandler
      {} as any, // controlledValues
      {} as any // countryService
    );
    (service as any).loadBundle = jest.fn().mockResolvedValue({
      submission: undefined,
      authorizations: [],
      actions: [],
      holdings: [],
      authorizedEntities: [],
      provisional: { holdings: false, authorizedEntities: false },
      snapshotAt: { holdings: undefined, authorizedEntities: undefined },
      ...bundle,
    });
    return service;
  };

  it("defaults to newest first by updatedAt when the caller sends no sort", async () => {
    const service = buildService({
      authorizations: [
        { aefT2AuthorizationsId: "old", updatedAt: "2026-01-05T00:00:00.000Z" },
        { aefT2AuthorizationsId: "new", updatedAt: "2026-08-11T00:00:00.000Z" },
        { aefT2AuthorizationsId: "mid", updatedAt: "2026-04-02T00:00:00.000Z" },
      ],
    });

    const result = await service.query("t2Authorizations", 2026);

    expect(result.data.map((row: any) => row.aefT2AuthorizationsId)).toEqual(["new", "mid", "old"]);
  });

  /**
   * Holdings overrides the `updatedAt` default: an open year's rows are computed
   * live by the provider and carry no such key, so the default would be a no-op.
   */
  it("defaults Holdings to authorization id, descending", async () => {
    const service = buildService({
      holdings: [
        { aefT4HoldingsAuthorizationId: "AUTH-002" },
        { aefT4HoldingsAuthorizationId: "AUTH-003" },
        { aefT4HoldingsAuthorizationId: "AUTH-001" },
      ],
    });

    const result = await service.query("t4Holdings", 2026);

    expect(result.data.map((row: any) => row.aefT4HoldingsAuthorizationId)).toEqual([
      "AUTH-003",
      "AUTH-002",
      "AUTH-001",
    ]);
  });

  /**
   * `aefT4HoldingsAuthorizationId` holds the authorization request's own id,
   * which in practice is a plain sequential id stored as a string ("1", "2",
   * "10", ...) — not a prefixed code like "AUTH-001". Comparing those as text
   * sorts "10" before "9", so once a registry has more than nine
   * authorizations the default appears to stop working past the first page.
   */
  it("orders numeric-string authorization ids numerically, not lexicographically", async () => {
    const service = buildService({
      holdings: [
        { aefT4HoldingsAuthorizationId: "2" },
        { aefT4HoldingsAuthorizationId: "20" },
        { aefT4HoldingsAuthorizationId: "9" },
        { aefT4HoldingsAuthorizationId: "11" },
        { aefT4HoldingsAuthorizationId: "10" },
        { aefT4HoldingsAuthorizationId: "1" },
      ],
    });

    const result = await service.query("t4Holdings", 2026);

    expect(result.data.map((row: any) => row.aefT4HoldingsAuthorizationId)).toEqual([
      "20",
      "11",
      "10",
      "9",
      "2",
      "1",
    ]);
  });

  it("leaves the other tables on the updatedAt default", async () => {
    const service = buildService({
      actions: [
        { aefT3ActionsType: "older", updatedAt: "2026-01-05T00:00:00.000Z" },
        { aefT3ActionsType: "newer", updatedAt: "2026-08-11T00:00:00.000Z" },
      ],
    });

    const result = await service.query("t3Actions", 2026);

    expect(result.data.map((row: any) => row.aefT3ActionsType)).toEqual(["newer", "older"]);
  });

  /**
   * The store hands back `Date` objects for the `timestamptz` metadata columns,
   * not the ISO strings `AefRecordMeta` types them as. Stringifying a Date gives
   * `"Sat Jan 03 2026 …"`, which collates by weekday name — so these two dates,
   * three days apart in the same month, came back in the wrong order.
   */
  it("orders Date values chronologically, not by their stringified weekday", async () => {
    const service = buildService({
      authorizations: [
        { aefT2AuthorizationsId: "sat-jan-03", updatedAt: new Date("2026-01-03T00:00:00.000Z") },
        { aefT2AuthorizationsId: "mon-jan-05", updatedAt: new Date("2026-01-05T00:00:00.000Z") },
      ],
    });

    const result = await service.query("t2Authorizations", 2026);

    expect(result.data.map((row: any) => row.aefT2AuthorizationsId)).toEqual([
      "mon-jan-05",
      "sat-jan-03",
    ]);
  });

  /**
   * Timestamps compare as epoch, not as text, so precision cannot change the
   * order: `…T00:00:00Z` collates *after* `…T00:00:00.500Z` under any string
   * compare, because `.` precedes `Z`.
   */
  it("orders instants of differing precision chronologically", async () => {
    const service = buildService({
      authorizations: [
        { aefT2AuthorizationsId: "earlier", updatedAt: "2026-01-05T00:00:00Z" },
        { aefT2AuthorizationsId: "later", updatedAt: "2026-01-05T00:00:00.500Z" },
      ],
    });

    const result = await service.query("t2Authorizations", 2026);

    expect(result.data.map((row: any) => row.aefT2AuthorizationsId)).toEqual(["later", "earlier"]);
  });

  /**
   * The two stores disagree on representation — TypeORM hands back `Date`, the
   * in-memory one an ISO string. Both normalise to epoch, so a table sorts the
   * same way whichever is behind it.
   */
  it("orders Date and ISO-string timestamps on the same scale", async () => {
    const service = buildService({
      authorizations: [
        { aefT2AuthorizationsId: "iso-oldest", updatedAt: "2026-01-05T00:00:00.000Z" },
        { aefT2AuthorizationsId: "date-newest", updatedAt: new Date("2026-08-11T00:00:00.000Z") },
        { aefT2AuthorizationsId: "iso-middle", updatedAt: "2026-04-02T00:00:00.000Z" },
      ],
    });

    const result = await service.query("t2Authorizations", 2026);

    expect(result.data.map((row: any) => row.aefT2AuthorizationsId)).toEqual([
      "date-newest",
      "iso-middle",
      "iso-oldest",
    ]);
  });

  /**
   * Only a full ISO instant is read as a timestamp. A string column must keep
   * sorting as text, or a loose `Date.parse` would reorder it arbitrarily.
   */
  it("does not treat ordinary strings as timestamps", async () => {
    const service = buildService({
      authorizations: [
        { aefT2AuthorizationsId: "CA0004-VU-CH-356" },
        { aefT2AuthorizationsId: "CA0001-VU-CH-356" },
        { aefT2AuthorizationsId: "CA0002-VU-CH-356" },
      ],
    });

    const result = await service.query("t2Authorizations", 2026, {
      key: "aefT2AuthorizationsId",
      order: "ASC",
    } as any);

    expect(result.data.map((row: any) => row.aefT2AuthorizationsId)).toEqual([
      "CA0001-VU-CH-356",
      "CA0002-VU-CH-356",
      "CA0004-VU-CH-356",
    ]);
  });

  it("honours an explicit key and order from the request", async () => {
    const service = buildService({
      authorizations: [
        { aefT2AuthorizationsId: "b", updatedAt: "2026-08-11T00:00:00.000Z" },
        { aefT2AuthorizationsId: "a", updatedAt: "2026-01-05T00:00:00.000Z" },
      ],
    });

    const result = await service.query("t2Authorizations", 2026, {
      key: "aefT2AuthorizationsId",
      order: "ASC",
    } as any);

    expect(result.data.map((row: any) => row.aefT2AuthorizationsId)).toEqual(["a", "b"]);
  });

  /**
   * Table 3's Action date is rewritten to `dd/mm/yyyy` for display, which orders
   * wrongly under a string compare - so the sort has to run on the stored ISO
   * value, before that rewrite.
   */
  it("orders Table 3 by the stored instant, not the displayed dd/mm/yyyy", async () => {
    const service = buildService({
      actions: [
        { aefT3ActionsType: "earlier", aefT3ActionsDate: "2026-02-28T00:00:00.000Z" },
        { aefT3ActionsType: "later", aefT3ActionsDate: "2026-11-01T00:00:00.000Z" },
      ],
    });

    const result = await service.query("t3Actions", 2026, {
      key: "aefT3ActionsDate",
      order: "DESC",
    } as any);

    expect(result.data.map((row: any) => row.aefT3ActionsType)).toEqual(["later", "earlier"]);
    // Still displayed as the day alone.
    expect(result.data[0]).toMatchObject({ aefT3ActionsDate: "01/11/2026" });
  });

  /**
   * An open year's Holdings are computed live and never stored, so they carry no
   * `updatedAt` to sort on. They must keep the provider's order rather than be
   * shuffled into an arbitrary one.
   */
  it("leaves rows with no value for the sort key in their original order", async () => {
    const service = buildService({
      holdings: [
        { aefT4HoldingsUnitRegistryId: "first" },
        { aefT4HoldingsUnitRegistryId: "second" },
        { aefT4HoldingsUnitRegistryId: "third" },
      ],
      provisional: { holdings: true, authorizedEntities: false },
    });

    const result = await service.query("t4Holdings", 2026);

    expect(result.data.map((row: any) => row.aefT4HoldingsUnitRegistryId)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("puts rows missing the key last, after the ones that have it", async () => {
    const service = buildService({
      authorizations: [
        { aefT2AuthorizationsId: "unstamped" },
        { aefT2AuthorizationsId: "stamped", updatedAt: "2026-01-05T00:00:00.000Z" },
      ],
    });

    const result = await service.query("t2Authorizations", 2026);

    expect(result.data.map((row: any) => row.aefT2AuthorizationsId)).toEqual([
      "stamped",
      "unstamped",
    ]);
  });
});
