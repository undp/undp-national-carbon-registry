import { AsyncActionType } from "../enum/async.action.type.enum";

/**
 * `AsyncActionType` is a numeric enum persisted as a Postgres enum whose labels
 * are the ordinals as strings. Two things break if a member is inserted or
 * reordered rather than appended:
 *
 *  - every existing `async_action_entity` row silently changes meaning, and
 *  - the labels created by `src/migrations/1785500000000-CadTrustV2Sync.ts`
 *    ('17', '18', '19') stop matching the members they were created for.
 *
 * Neither failure is visible at compile time, hence this test. If it fails, do
 * not update the numbers here — move the new member to the end of the enum
 * instead, and add its label in a new migration.
 */
describe("AsyncActionType ordinals", () => {
  it("pins the last pre-CAD-Trust-v2 member, so insertions above it are caught", () => {
    // The baseline migration created labels '0'..'16'; this is '16'.
    expect(AsyncActionType.NationalInvestment).toBe(16);
  });

  it.each([
    ["CADTV2ProjectCreate", AsyncActionType.CADTV2ProjectCreate, 17],
    ["CADTV2ProjectUpdate", AsyncActionType.CADTV2ProjectUpdate, 18],
    ["CADTV2Commit", AsyncActionType.CADTV2Commit, 19],
  ])("%s is %i, matching the label added in the migration", (_name, actual, expected) => {
    expect(actual).toBe(expected);
  });

  it("pins CADTV2Bootstrap to 20, matching the label added in 1785600000000-CadTrustV2Bootstrap.ts", () => {
    expect(AsyncActionType.CADTV2Bootstrap).toBe(20);
  });

  it("pins CADTV2ValidationCreate to 21, matching the label added in 1785800000000-CadTrustV2Validation.ts", () => {
    expect(AsyncActionType.CADTV2ValidationCreate).toBe(21);
  });

  it("pins CADTV2Reconcile to 22, matching the label added in 1786000000000-CadTrustV2Reconcile.ts", () => {
    expect(AsyncActionType.CADTV2Reconcile).toBe(22);
  });

  it.each([
    ["CADTV2VerificationCreate", AsyncActionType.CADTV2VerificationCreate, 23],
    ["CADTV2CreditIssuance", AsyncActionType.CADTV2CreditIssuance, 24],
    ["CADTV2UnitUpdate", AsyncActionType.CADTV2UnitUpdate, 25],
  ])("%s is %i, matching the label added in 1787700000000-CadTrustV2Credits.ts", (_name, actual, expected) => {
    expect(actual).toBe(expected);
  });
});
