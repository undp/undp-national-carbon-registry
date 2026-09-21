import { AsyncActionType } from "@app/shared/enum/async.action.type.enum";
import { CADTRUST_V2_ACTION_TYPES } from "@app/shared/enum/cadtrust.async.action.types";
import { CounterType } from "@app/shared/util/counter.type.enum";

import { CadTrustAsyncOperationsHandlerService } from "./cadtrust-async-operations-handler.service";

const RECONCILE_INTERVAL_MS = 300_000;

function buildService(
  overrides: {
    counter?: number;
    actions?: any[];
    dispatch?: jest.Mock;
  } = {}
) {
  let queryResult = overrides.actions ?? [];
  const queryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(async () => {
      const result = queryResult;
      queryResult = []; // subsequent polls see an empty table, same as a real drain
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
  const cadTrustSyncDispatcher = {
    handle: overrides.dispatch ?? jest.fn(async () => undefined),
  };
  const configService = {
    get: (key: string) => (key === "cadTrustV2.reconcileIntervalMs" ? RECONCILE_INTERVAL_MS : undefined),
  };
  const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

  const service = new CadTrustAsyncOperationsHandlerService(
    logger as any,
    configService as any,
    counterRepo as any,
    asyncActionRepo as any,
    cadTrustSyncDispatcher as any
  );

  return { service, counterRepo, asyncActionRepo, queryBuilder, cadTrustSyncDispatcher, logger };
}

/**
 * `setTimeout` is mocked to a no-op (never auto-invokes the callback) for every test — this is
 * what lets `service.asyncHandler(...)` resolve deterministically without waiting on either a
 * real delay or fake-timer advancement (this Jest/TypeScript version has no
 * `advanceTimersByTimeAsync`). A scheduled follow-up poll or reconcile tick is asserted by
 * inspecting the spy's recorded calls, and — for the reconcile timer — by invoking the captured
 * callback directly, once, rather than letting `setTimeout` re-invoke it (which would recurse
 * unbounded against this same mock).
 */
function mockSetTimeout() {
  return jest.spyOn(global, "setTimeout").mockImplementation(() => 0 as unknown as NodeJS.Timeout);
}

describe("CadTrustAsyncOperationsHandlerService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("cursor loop", () => {
    it("reads the CADTRUST_ASYNC_OPERATIONS cursor, not ASYNC_OPERATIONS", async () => {
      mockSetTimeout();
      const { service, counterRepo } = buildService();

      await service.asyncHandler({});

      expect(counterRepo.findOneBy).toHaveBeenCalledWith({ id: CounterType.CADTRUST_ASYNC_OPERATIONS });
    });

    it("starts from 0 when no cursor row exists yet", async () => {
      mockSetTimeout();
      const { service, queryBuilder } = buildService({ counter: undefined });

      await service.asyncHandler({});

      expect(queryBuilder.where).toHaveBeenCalledWith("asyncAction.actionId > :lastExecuted", {
        lastExecuted: 0,
      });
    });

    it("filters the query to only CAD Trust action types", async () => {
      mockSetTimeout();
      const { service, queryBuilder } = buildService();

      await service.asyncHandler({});

      expect(queryBuilder.andWhere).toHaveBeenCalledWith("asyncAction.actionType IN (:...cadTrustActionTypes)", {
        cadTrustActionTypes: CADTRUST_V2_ACTION_TYPES,
      });
    });

    it("dispatches every returned action via CadTrustSyncDispatcherService and advances the cursor per action", async () => {
      mockSetTimeout();
      const actions = [
        { actionId: 5, actionType: AsyncActionType.CADTV2ProjectCreate, actionProps: JSON.stringify({ refId: "a" }) },
        { actionId: 6, actionType: AsyncActionType.CADTV2ProjectUpdate, actionProps: JSON.stringify({ refId: "b" }) },
      ];
      const dispatch = jest.fn(async () => undefined);
      const { service, counterRepo } = buildService({ actions, dispatch });

      await service.asyncHandler({});

      expect(dispatch).toHaveBeenNthCalledWith(1, AsyncActionType.CADTV2ProjectCreate, { refId: "a" });
      expect(dispatch).toHaveBeenNthCalledWith(2, AsyncActionType.CADTV2ProjectUpdate, { refId: "b" });
      expect(counterRepo.save).toHaveBeenNthCalledWith(1, {
        id: CounterType.CADTRUST_ASYNC_OPERATIONS,
        counter: 5,
      });
      expect(counterRepo.save).toHaveBeenNthCalledWith(2, {
        id: CounterType.CADTRUST_ASYNC_OPERATIONS,
        counter: 6,
      });
    });

    it("resumes from the saved cursor on the next poll", async () => {
      mockSetTimeout();
      const { service, queryBuilder } = buildService({ counter: 41 });

      await service.asyncHandler({});

      expect(queryBuilder.where).toHaveBeenCalledWith("asyncAction.actionId > :lastExecuted", {
        lastExecuted: 41,
      });
    });

    it("schedules the next poll without blocking on it", async () => {
      const setTimeoutSpy = mockSetTimeout();
      const { service } = buildService();

      await service.asyncHandler({});

      // The cursor loop's own 5s poll — a second call is also recorded for the reconcile
      // timer's first schedule, asserted separately below.
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 5000);
    });
  });

  describe("reconcile timer", () => {
    it("schedules its first tick immediately, at reconcileIntervalMs — but does not run reconcile synchronously", async () => {
      const setTimeoutSpy = mockSetTimeout();
      const { service, cadTrustSyncDispatcher } = buildService();

      await service.asyncHandler({});

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), RECONCILE_INTERVAL_MS);
      expect(cadTrustSyncDispatcher.handle).not.toHaveBeenCalledWith(AsyncActionType.CADTV2Reconcile, {});
    });

    it("calls CADTV2Reconcile via the dispatcher when its tick fires, then reschedules", async () => {
      const setTimeoutSpy = mockSetTimeout();
      const dispatch = jest.fn(async () => undefined);
      const { service } = buildService({ dispatch });

      await service.asyncHandler({});
      const reconcileTick = setTimeoutSpy.mock.calls.find(([, delay]) => delay === RECONCILE_INTERVAL_MS)?.[0] as () => Promise<void>;
      expect(reconcileTick).toBeDefined();

      await reconcileTick();

      expect(dispatch).toHaveBeenCalledWith(AsyncActionType.CADTV2Reconcile, {});
      // Reschedules itself for another tick.
      const rescheduleCount = setTimeoutSpy.mock.calls.filter(([, delay]) => delay === RECONCILE_INTERVAL_MS).length;
      expect(rescheduleCount).toBe(2);
    });

    it("is independent of the cursor loop — a reconcile tick does not touch the CADTRUST_ASYNC_OPERATIONS counter", async () => {
      const setTimeoutSpy = mockSetTimeout();
      const { service, counterRepo } = buildService();

      await service.asyncHandler({});
      counterRepo.save.mockClear();
      const reconcileTick = setTimeoutSpy.mock.calls.find(([, delay]) => delay === RECONCILE_INTERVAL_MS)?.[0] as () => Promise<void>;
      await reconcileTick();

      expect(counterRepo.save).not.toHaveBeenCalled();
    });

    it("does not rethrow, and still reschedules, when the reconcile dispatch throws unexpectedly", async () => {
      const setTimeoutSpy = mockSetTimeout();
      const dispatch = jest.fn(async () => {
        throw new Error("unexpected");
      });
      const { service, logger } = buildService({ dispatch });

      await service.asyncHandler({});
      const reconcileTick = setTimeoutSpy.mock.calls.find(([, delay]) => delay === RECONCILE_INTERVAL_MS)?.[0] as () => Promise<void>;

      await expect(reconcileTick()).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalled();
      const rescheduleCount = setTimeoutSpy.mock.calls.filter(([, delay]) => delay === RECONCILE_INTERVAL_MS).length;
      expect(rescheduleCount).toBe(2);
    });
  });
});
