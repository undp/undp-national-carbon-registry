import { CADTRUST_V2_ACTION_TYPES } from "@app/shared/enum/cadtrust.async.action.types";
import { CounterType } from "@app/shared/util/counter.type.enum";

import { AsyncOperationsDatabaseHandlerService } from "./async-operations-database-handler.service";

/**
 * Focused coverage for the one change this file needed as part of splitting CAD Trust onto its
 * own lane: excluding `CADTRUST_V2_ACTION_TYPES` from this loop's query, so the two consumer
 * lanes (this one and `CadTrustAsyncOperationsHandlerService`) partition `async_action_entity`
 * with no overlap. See that service's class doc for the full rationale.
 *
 * Not a full behavioral suite for the pre-existing cursor/backoff loop — there was none before
 * this change (see the service's own history), and reproducing it fully is out of scope here.
 * `setTimeout` is mocked to a no-op so `asyncHandler(...)` resolves deterministically without a
 * real delay or fake-timer advancement — see the sibling spec's doc for why.
 */
function buildService(overrides: { counter?: number; actions?: any[] } = {}) {
  let queryResult = overrides.actions ?? [];
  const queryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(async () => {
      const result = queryResult;
      queryResult = [];
      return result;
    }),
  };

  const counterRepo = {
    findOneBy: jest.fn(async () => (overrides.counter === undefined ? null : { counter: overrides.counter })),
    save: jest.fn(async () => undefined),
  };
  const asyncActionRepo = {
    createQueryBuilder: jest.fn(() => queryBuilder),
  };
  const asyncOperationsHandlerService = { handler: jest.fn(async () => undefined) };
  const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

  const service = new AsyncOperationsDatabaseHandlerService(
    logger as any,
    counterRepo as any,
    asyncActionRepo as any,
    asyncOperationsHandlerService as any
  );

  return { service, counterRepo, asyncActionRepo, queryBuilder, asyncOperationsHandlerService, logger };
}

describe("AsyncOperationsDatabaseHandlerService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reads the ASYNC_OPERATIONS cursor, not CADTRUST_ASYNC_OPERATIONS", async () => {
    jest.spyOn(global, "setTimeout").mockImplementation(() => 0 as unknown as NodeJS.Timeout);
    const { service, counterRepo } = buildService();

    await service.asyncHandler({});

    expect(counterRepo.findOneBy).toHaveBeenCalledWith({ id: CounterType.ASYNC_OPERATIONS });
  });

  it("excludes CAD Trust action types from its query — the new consumer lane owns those", async () => {
    jest.spyOn(global, "setTimeout").mockImplementation(() => 0 as unknown as NodeJS.Timeout);
    const { service, queryBuilder } = buildService();

    await service.asyncHandler({});

    expect(queryBuilder.andWhere).toHaveBeenCalledWith("asyncAction.actionType NOT IN (:...cadTrustActionTypes)", {
      cadTrustActionTypes: CADTRUST_V2_ACTION_TYPES,
    });
  });

  it("still dispatches non-CAD-Trust actions through the generic handler switch", async () => {
    jest.spyOn(global, "setTimeout").mockImplementation(() => 0 as unknown as NodeJS.Timeout);
    const actions = [{ actionId: 3, actionType: 0, actionProps: JSON.stringify({ to: "a@b.com" }) }];
    const { service, asyncOperationsHandlerService, counterRepo } = buildService({ actions });

    await service.asyncHandler({});

    expect(asyncOperationsHandlerService.handler).toHaveBeenCalledWith(0, { to: "a@b.com" });
    expect(counterRepo.save).toHaveBeenCalledWith({ id: CounterType.ASYNC_OPERATIONS, counter: 3 });
  });
});
