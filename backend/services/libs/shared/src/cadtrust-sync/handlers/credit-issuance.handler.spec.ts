import { CadTrustCreditIssuanceHandler, CadTrustCreditIssuanceProps } from "./credit-issuance.handler";

const PROPS: CadTrustCreditIssuanceProps = { creditBlockId: "CA0001-XX-XX-1-1-100" };

function buildHandler(
  overrides: {
    enabled?: boolean;
    ensureCreditIssuance?: jest.Mock;
    commit?: jest.Mock;
  } = {}
) {
  const resources = {
    ensureCreditIssuance: overrides.ensureCreditIssuance ?? jest.fn(async () => true),
  };
  const commitHandler = { handle: overrides.commit ?? jest.fn(async () => undefined) };
  const configService = { get: () => overrides.enabled ?? true };
  const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

  const handler = new CadTrustCreditIssuanceHandler(
    resources as any,
    commitHandler as any,
    configService as any,
    logger as any
  );

  return { handler, resources, commitHandler, logger };
}

describe("CadTrustCreditIssuanceHandler", () => {
  it("delegates to ensureCreditIssuance and commits inline when a commit is owed", async () => {
    const { handler, resources, commitHandler } = buildHandler();

    await handler.handle(PROPS);

    expect(resources.ensureCreditIssuance).toHaveBeenCalledWith(PROPS.creditBlockId);
    expect(commitHandler.handle).toHaveBeenCalledTimes(1);
  });

  it("does not commit when nothing was owed", async () => {
    const { handler, commitHandler } = buildHandler({
      ensureCreditIssuance: jest.fn(async () => false),
    });

    await handler.handle(PROPS);

    expect(commitHandler.handle).not.toHaveBeenCalled();
  });

  it("skips entirely when the integration is disabled", async () => {
    const { handler, resources, commitHandler } = buildHandler({ enabled: false });

    await handler.handle(PROPS);

    expect(resources.ensureCreditIssuance).not.toHaveBeenCalled();
    expect(commitHandler.handle).not.toHaveBeenCalled();
  });

  describe("the head-of-line guarantee", () => {
    it("does not rethrow when ensureCreditIssuance fails unexpectedly", async () => {
      const { handler } = buildHandler({
        ensureCreditIssuance: jest.fn(async () => {
          throw new Error("CAD Trust rejected the issuance payload");
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
      expect(resources.ensureCreditIssuance).not.toHaveBeenCalled();
    });
  });
});
