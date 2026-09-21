import { CadTrustVerificationSyncProps } from "../cadtrust-sync.enqueue.service";
import { CadTrustVerificationCreateHandler } from "./verification-create.handler";

const PROPS: CadTrustVerificationSyncProps = {
  refId: "0042",
  documentVersion: 1,
  verificationBodyName: "Kunene Certifiers",
};

function buildHandler(
  overrides: {
    enabled?: boolean;
    ensureVerification?: jest.Mock;
    commit?: jest.Mock;
  } = {}
) {
  const resources = {
    ensureVerification:
      overrides.ensureVerification ??
      jest.fn(async () => ({ cadTrustId: "cadt-verification-1", commitOwed: true })),
  };
  const commitHandler = { handle: overrides.commit ?? jest.fn(async () => undefined) };
  const configService = { get: () => overrides.enabled ?? true };
  const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

  const handler = new CadTrustVerificationCreateHandler(
    resources as any,
    commitHandler as any,
    configService as any,
    logger as any
  );

  return { handler, resources, commitHandler, logger };
}

describe("CadTrustVerificationCreateHandler", () => {
  it("delegates to ensureVerification and commits inline when a commit is owed", async () => {
    const { handler, resources, commitHandler } = buildHandler();

    await handler.handle(PROPS);

    expect(resources.ensureVerification).toHaveBeenCalledWith(PROPS);
    expect(commitHandler.handle).toHaveBeenCalledTimes(1);
  });

  it("does not commit when nothing was staged (already synced)", async () => {
    const { handler, commitHandler } = buildHandler({
      ensureVerification: jest.fn(async () => ({ cadTrustId: "cadt-verification-1", commitOwed: false })),
    });

    await handler.handle(PROPS);

    expect(commitHandler.handle).not.toHaveBeenCalled();
  });

  it("does not commit when ensureVerification fails (returns undefined)", async () => {
    const { handler, commitHandler } = buildHandler({
      ensureVerification: jest.fn(async () => undefined),
    });

    await handler.handle(PROPS);

    expect(commitHandler.handle).not.toHaveBeenCalled();
  });

  it("skips entirely when the integration is disabled", async () => {
    const { handler, resources, commitHandler } = buildHandler({ enabled: false });

    await handler.handle(PROPS);

    expect(resources.ensureVerification).not.toHaveBeenCalled();
    expect(commitHandler.handle).not.toHaveBeenCalled();
  });

  describe("the head-of-line guarantee", () => {
    it("does not rethrow when ensureVerification fails unexpectedly", async () => {
      const { handler } = buildHandler({
        ensureVerification: jest.fn(async () => {
          throw new Error("CAD Trust rejected the verification payload");
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

    it("does not rethrow on a malformed payload (no refId)", async () => {
      const { handler, resources } = buildHandler();

      await expect(handler.handle({} as any)).resolves.toBeUndefined();
      expect(resources.ensureVerification).not.toHaveBeenCalled();
    });
  });
});
