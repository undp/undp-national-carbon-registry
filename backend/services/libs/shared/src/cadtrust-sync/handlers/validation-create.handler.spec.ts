import { DocumentTypeEnum } from "../../enum/document.type.enum";
import { CadTrustValidationSyncProps } from "../cadtrust-sync.enqueue.service";
import { CadTrustValidationCreateHandler } from "./validation-create.handler";

const PROPS: CadTrustValidationSyncProps = {
  refId: "0042",
  documentType: DocumentTypeEnum.PROJECT_DESIGN_DOCUMENT,
  documentVersion: 1,
  validationBodyName: "Kunene Certifiers",
  creditPeriodStartDate: "2026-01-01",
  creditPeriodEndDate: "2033-01-01",
  validationDate: "2026-03-15",
};

function buildHandler(
  overrides: {
    enabled?: boolean;
    ensureValidation?: jest.Mock;
    commit?: jest.Mock;
  } = {}
) {
  const resources = {
    ensureValidation:
      overrides.ensureValidation ??
      jest.fn(async () => ({ cadTrustId: "cadt-validation-1", commitOwed: true })),
  };
  const commitHandler = { handle: overrides.commit ?? jest.fn(async () => undefined) };
  const configService = { get: () => overrides.enabled ?? true };
  const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

  const handler = new CadTrustValidationCreateHandler(
    resources as any,
    commitHandler as any,
    configService as any,
    logger as any
  );

  return { handler, resources, commitHandler, logger };
}

describe("CadTrustValidationCreateHandler", () => {
  it("delegates to ensureValidation and commits inline when a commit is owed", async () => {
    const { handler, resources, commitHandler } = buildHandler();

    await handler.handle(PROPS);

    expect(resources.ensureValidation).toHaveBeenCalledWith(PROPS);
    expect(commitHandler.handle).toHaveBeenCalledTimes(1);
  });

  it("does not commit when nothing was staged (already synced)", async () => {
    const { handler, commitHandler } = buildHandler({
      ensureValidation: jest.fn(async () => ({ cadTrustId: "cadt-validation-1", commitOwed: false })),
    });

    await handler.handle(PROPS);

    expect(commitHandler.handle).not.toHaveBeenCalled();
  });

  it("does not commit when ensureValidation fails (returns undefined)", async () => {
    const { handler, commitHandler } = buildHandler({
      ensureValidation: jest.fn(async () => undefined),
    });

    await handler.handle(PROPS);

    expect(commitHandler.handle).not.toHaveBeenCalled();
  });

  it("skips entirely when the integration is disabled", async () => {
    const { handler, resources, commitHandler } = buildHandler({ enabled: false });

    await handler.handle(PROPS);

    expect(resources.ensureValidation).not.toHaveBeenCalled();
    expect(commitHandler.handle).not.toHaveBeenCalled();
  });

  describe("the head-of-line guarantee", () => {
    it("does not rethrow when ensureValidation fails unexpectedly", async () => {
      const { handler } = buildHandler({
        ensureValidation: jest.fn(async () => {
          throw new Error("CAD Trust rejected the validation payload");
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
      expect(resources.ensureValidation).not.toHaveBeenCalled();
    });
  });
});
