import { CadTrustUnitUpdateHandler, CadTrustUnitUpdateProps } from "./unit-update.handler";

const PROPS: CadTrustUnitUpdateProps = { creditBlockId: "CA0001-XX-XX-1-1-100" };

function buildHandler(
  overrides: {
    enabled?: boolean;
    ensureUnitUpdate?: jest.Mock;
    ensureItmoLabelIfAuthorized?: jest.Mock;
    commit?: jest.Mock;
  } = {}
) {
  const resources = {
    ensureUnitUpdate: overrides.ensureUnitUpdate ?? jest.fn(async () => true),
    ensureItmoLabelIfAuthorized: overrides.ensureItmoLabelIfAuthorized ?? jest.fn(async () => false),
  };
  const commitHandler = { handle: overrides.commit ?? jest.fn(async () => undefined) };
  const configService = { get: () => overrides.enabled ?? true };
  const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

  const handler = new CadTrustUnitUpdateHandler(
    resources as any,
    commitHandler as any,
    configService as any,
    logger as any
  );

  return { handler, resources, commitHandler, logger };
}

describe("CadTrustUnitUpdateHandler", () => {
  it("delegates to ensureUnitUpdate and commits inline when it owes a commit", async () => {
    const { handler, resources, commitHandler } = buildHandler();

    await handler.handle(PROPS);

    expect(resources.ensureUnitUpdate).toHaveBeenCalledWith(PROPS.creditBlockId);
    expect(commitHandler.handle).toHaveBeenCalledTimes(1);
  });

  it("also checks ensureItmoLabelIfAuthorized on every run, and commits if only the label owed one", async () => {
    const { handler, resources, commitHandler } = buildHandler({
      ensureUnitUpdate: jest.fn(async () => false),
      ensureItmoLabelIfAuthorized: jest.fn(async () => true),
    });

    await handler.handle(PROPS);

    expect(resources.ensureItmoLabelIfAuthorized).toHaveBeenCalledWith(PROPS.creditBlockId);
    expect(commitHandler.handle).toHaveBeenCalledTimes(1);
  });

  it("does not commit when neither the unit update nor the label owed a commit", async () => {
    const { handler, commitHandler } = buildHandler({
      ensureUnitUpdate: jest.fn(async () => false),
      ensureItmoLabelIfAuthorized: jest.fn(async () => false),
    });

    await handler.handle(PROPS);

    expect(commitHandler.handle).not.toHaveBeenCalled();
  });

  it("skips entirely when the integration is disabled", async () => {
    const { handler, resources, commitHandler } = buildHandler({ enabled: false });

    await handler.handle(PROPS);

    expect(resources.ensureUnitUpdate).not.toHaveBeenCalled();
    expect(resources.ensureItmoLabelIfAuthorized).not.toHaveBeenCalled();
    expect(commitHandler.handle).not.toHaveBeenCalled();
  });

  describe("the head-of-line guarantee", () => {
    it("does not rethrow when ensureUnitUpdate fails unexpectedly", async () => {
      const { handler } = buildHandler({
        ensureUnitUpdate: jest.fn(async () => {
          throw new Error("CAD Trust rejected the unit payload");
        }),
      });

      await expect(handler.handle(PROPS)).resolves.toBeUndefined();
    });

    it("does not rethrow when ensureItmoLabelIfAuthorized fails unexpectedly", async () => {
      const { handler } = buildHandler({
        ensureItmoLabelIfAuthorized: jest.fn(async () => {
          throw new Error("CAD Trust rejected the label payload");
        }),
      });

      await expect(handler.handle(PROPS)).resolves.toBeUndefined();
    });

    it("does not rethrow if the inline commit call somehow throws", async () => {
      const { handler } = buildHandler({
        commit: jest.fn(async () => {
          throw new Error("unexpected");
        }),
      });

      await expect(handler.handle(PROPS)).resolves.toBeUndefined();
    });

    it("does not rethrow on a malformed payload (no creditBlockId)", async () => {
      const { handler, resources } = buildHandler();

      await expect(handler.handle({} as any)).resolves.toBeUndefined();
      expect(resources.ensureUnitUpdate).not.toHaveBeenCalled();
    });
  });
});
