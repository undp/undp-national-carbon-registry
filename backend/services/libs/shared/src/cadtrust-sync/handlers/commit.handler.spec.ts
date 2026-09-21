import { CadTrustCommitHandler } from "./commit.handler";

function buildHandler(
  overrides: {
    enabled?: boolean;
    commit?: jest.Mock;
    hasUncommittedStagedRows?: jest.Mock;
    commitStuckThreshold?: number;
    stuckFailures?: any[];
  } = {}
) {
  const commit = overrides.commit ?? jest.fn(async () => ({ message: "Committing", success: true }));
  // Defaults to "work is owed" so the happy-path tests below don't need to know about this.
  const hasUncommittedStagedRows =
    overrides.hasUncommittedStagedRows ?? jest.fn(async () => true);
  // Never expected to be called by this handler — see the "never calls resetCommitted" test.
  const resetCommitted = jest.fn();

  const syncRecords = {
    markAllStagedAsCommitted: jest.fn(async () => 3),
    markAllStagedAsFailed: jest.fn(async () => 3),
    findStuckFailures: jest.fn(async () => overrides.stuckFailures ?? []),
  };
  const cadTrustV2Service = {
    getClient: () => ({ staging: { hasUncommittedStagedRows, commit, resetCommitted } }),
  };
  const configService = {
    get: (key: string) =>
      key === "cadTrustV2.enable"
        ? overrides.enabled ?? true
        : key === "cadTrustV2.commitAuthor"
        ? "Test Registry"
        : key === "cadTrustV2.commitStuckThreshold"
        ? overrides.commitStuckThreshold ?? 6
        : "SystemX",
  };
  const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

  const handler = new CadTrustCommitHandler(
    syncRecords as any,
    cadTrustV2Service as any,
    configService as any,
    logger as any
  );

  return { handler, syncRecords, commit, hasUncommittedStagedRows, resetCommitted, logger };
}

describe("CadTrustCommitHandler", () => {
  it("commits with the configured author", async () => {
    const { handler, commit } = buildHandler();

    await handler.handle();

    expect(commit).toHaveBeenCalledWith({
      author: "Test Registry",
      comment: "National registry sync",
    });
  });

  it("flips every staged record to committed", async () => {
    const { handler, syncRecords } = buildHandler();

    await handler.handle();

    expect(syncRecords.markAllStagedAsCommitted).toHaveBeenCalledTimes(1);
  });

  it("skips the commit and reconciles staged records when nothing is staged on the node", async () => {
    const hasUncommittedStagedRows = jest.fn(async () => false);
    const { handler, commit, syncRecords } = buildHandler({ hasUncommittedStagedRows });

    await handler.handle();

    expect(commit).not.toHaveBeenCalled();
    expect(syncRecords.markAllStagedAsCommitted).toHaveBeenCalledTimes(1);
  });

  it("commits when there are uncommitted staged rows", async () => {
    const hasUncommittedStagedRows = jest.fn(async () => true);
    const { handler, commit } = buildHandler({ hasUncommittedStagedRows });

    await handler.handle();

    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the integration is disabled", async () => {
    const { handler, commit, hasUncommittedStagedRows } = buildHandler({ enabled: false });

    await handler.handle();

    expect(hasUncommittedStagedRows).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
  });

  describe("the head-of-line guarantee", () => {
    it("marks staged records failed and does NOT rethrow when the commit fails", async () => {
      const commit = jest.fn(async () => {
        throw new Error("node unreachable");
      });
      const { handler, syncRecords } = buildHandler({ commit });

      await expect(handler.handle()).resolves.toBeUndefined();
      expect(syncRecords.markAllStagedAsFailed).toHaveBeenCalled();
      expect(syncRecords.markAllStagedAsCommitted).not.toHaveBeenCalled();
    });

    it("marks staged records failed and does NOT rethrow when hasUncommittedStagedRows fails", async () => {
      const hasUncommittedStagedRows = jest.fn(async () => {
        throw new Error("node unreachable");
      });
      const { handler, commit, syncRecords } = buildHandler({ hasUncommittedStagedRows });

      await expect(handler.handle()).resolves.toBeUndefined();
      expect(commit).not.toHaveBeenCalled();
      expect(syncRecords.markAllStagedAsFailed).toHaveBeenCalled();
      expect(syncRecords.markAllStagedAsCommitted).not.toHaveBeenCalled();
    });
  });

  describe("stuck-commit escalation", () => {
    // Regression coverage: CAD Trust's "pending commit" guard is not always self-resolving (see
    // the class doc) — a plain retry-forever loop can spin on a genuinely stuck row. This handler
    // must log a loud warning past the threshold, and must never call resetCommitted() itself
    // (it's node-global and re-publishes every tenant's stuck rows on a shared node).
    it("logs a warning naming reset-committed when findStuckFailures reports any", async () => {
      const commit = jest.fn(async () => {
        throw new Error("There are 2 pending commit(s) in the staging table");
      });
      const stuckFailures = [
        { localEntityType: "PROJECT", localId: "0042" },
        { localEntityType: "VALIDATION", localId: "0042-PDD-v1" },
      ];
      const { handler, logger, syncRecords } = buildHandler({ commit, stuckFailures });

      await handler.handle();

      expect(syncRecords.findStuckFailures).toHaveBeenCalledWith(6);
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("COMMIT STUCK"));
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("reset-committed"));
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("PROJECT:0042"));
    });

    it("does not warn when nothing has crossed the threshold", async () => {
      const commit = jest.fn(async () => {
        throw new Error("transient");
      });
      const { handler, logger } = buildHandler({ commit, stuckFailures: [] });

      await handler.handle();

      expect(logger.warn).not.toHaveBeenCalled();
    });

    it("respects a configured threshold", async () => {
      const commit = jest.fn(async () => {
        throw new Error("transient");
      });
      const { handler, syncRecords } = buildHandler({ commit, commitStuckThreshold: 10 });

      await handler.handle();

      expect(syncRecords.findStuckFailures).toHaveBeenCalledWith(10);
    });

    it("never calls resetCommitted, however stuck the failures are", async () => {
      const commit = jest.fn(async () => {
        throw new Error("stuck");
      });
      const { handler, resetCommitted } = buildHandler({
        commit,
        stuckFailures: [{ localEntityType: "PROJECT", localId: "0042" }],
      });

      await handler.handle();

      expect(resetCommitted).not.toHaveBeenCalled();
    });
  });
});
