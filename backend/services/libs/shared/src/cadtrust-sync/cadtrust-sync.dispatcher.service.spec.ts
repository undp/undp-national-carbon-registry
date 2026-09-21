import { AsyncActionType } from "../enum/async.action.type.enum";
import { CadTrustSyncDispatcherService } from "./cadtrust-sync.dispatcher.service";

function buildDispatcher() {
  const createHandle = jest.fn(async () => undefined);
  const commitHandle = jest.fn(async () => undefined);
  const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

  const dispatcher = new CadTrustSyncDispatcherService(
    [
      { actionType: AsyncActionType.CADTV2ProjectCreate, handle: createHandle },
      { actionType: AsyncActionType.CADTV2Commit, handle: commitHandle },
    ] as any,
    logger as any
  );

  return { dispatcher, createHandle, commitHandle, logger };
}

describe("CadTrustSyncDispatcherService", () => {
  describe("canHandle", () => {
    it("recognises registered action types", () => {
      const { dispatcher } = buildDispatcher();

      expect(dispatcher.canHandle(AsyncActionType.CADTV2ProjectCreate)).toBe(true);
      expect(dispatcher.canHandle(AsyncActionType.CADTV2Commit)).toBe(true);
    });

    it("recognises them as strings too — the queue hands back stringified ordinals", () => {
      const { dispatcher } = buildDispatcher();

      expect(dispatcher.canHandle(AsyncActionType.CADTV2ProjectCreate.toString())).toBe(true);
    });

    it("leaves every other action type to the existing switch", () => {
      const { dispatcher } = buildDispatcher();

      expect(dispatcher.canHandle(AsyncActionType.Email)).toBe(false);
      expect(dispatcher.canHandle(AsyncActionType.CADTUpdateProgramme)).toBe(false);
      // CADTV2ProjectUpdate is not registered in this fixture.
      expect(dispatcher.canHandle(AsyncActionType.CADTV2ProjectUpdate)).toBe(false);
      expect(dispatcher.canHandle(undefined)).toBe(false);
      expect(dispatcher.canHandle(null)).toBe(false);
    });
  });

  it("routes to the right handler with the payload", async () => {
    const { dispatcher, createHandle, commitHandle } = buildDispatcher();

    await dispatcher.handle(AsyncActionType.CADTV2ProjectCreate.toString(), { refId: "0042" });

    expect(createHandle).toHaveBeenCalledWith({ refId: "0042" });
    expect(commitHandle).not.toHaveBeenCalled();
  });

  it("warns rather than throwing for an unregistered type", async () => {
    const { dispatcher, logger } = buildDispatcher();

    await expect(dispatcher.handle(AsyncActionType.Email.toString(), {})).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalled();
  });

  it("swallows a handler that throws, as a backstop for the async cursor", async () => {
    const { dispatcher, logger } = buildDispatcher();
    const throwing = new CadTrustSyncDispatcherService(
      [
        {
          actionType: AsyncActionType.CADTV2Commit,
          handle: async () => {
            throw new Error("handler bug");
          },
        },
      ] as any,
      logger as any
    );

    await expect(
      throwing.handle(AsyncActionType.CADTV2Commit.toString(), {})
    ).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
    expect(dispatcher).toBeDefined();
  });
});
