import { AsyncActionType } from "../enum/async.action.type.enum";
import { DocumentTypeEnum } from "../enum/document.type.enum";
import { ProjectProposalStage } from "../enum/projectProposalStage.enum";
import { TxType } from "../enum/txtype.enum";
import { CadTrustSyncEnqueueService } from "./cadtrust-sync.enqueue.service";

function buildService() {
  const AddAction = jest.fn(async () => true);
  const asyncOperationsInterface = { AddAction };
  const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

  return {
    AddAction,
    logger,
    service: new CadTrustSyncEnqueueService(asyncOperationsInterface as any, logger as any),
  };
}

describe("CadTrustSyncEnqueueService", () => {
  it("enqueues a project-create snapshot, destructured to an explicit minimal shape", async () => {
    const { service, AddAction } = buildService();

    await service.enqueueProjectCreate({
      refId: "0042",
      title: "Kunene Solar",
      sector: "ENERGY",
      sectoralScope: "ENERGY_INDUSTRIES",
      projectProposalStage: ProjectProposalStage.PENDING,
      createTime: 1_700_000_000_000,
      updateTime: 1_700_000_000_000,
      companyId: 7,
      // Anything not in the explicit destructure must not leak onto the wire payload.
      extraneous: "should not appear" as any,
    } as any);

    expect(AddAction).toHaveBeenCalledWith({
      actionType: AsyncActionType.CADTV2ProjectCreate,
      actionProps: {
        refId: "0042",
        title: "Kunene Solar",
        sector: "ENERGY",
        sectoralScope: "ENERGY_INDUSTRIES",
        projectProposalStage: ProjectProposalStage.PENDING,
        createTime: 1_700_000_000_000,
        updateTime: 1_700_000_000_000,
        companyId: 7,
      },
    });
  });

  it("enqueues a project update with just the refId and txType", async () => {
    const { service, AddAction } = buildService();

    await service.enqueueProjectUpdate("0042", TxType.APPROVE_INF);

    expect(AddAction).toHaveBeenCalledWith({
      actionType: AsyncActionType.CADTV2ProjectUpdate,
      actionProps: { refId: "0042", txType: TxType.APPROVE_INF },
    });
  });

  it("enqueues a validation-record snapshot, destructured to an explicit minimal shape", async () => {
    const { service, AddAction } = buildService();

    await service.enqueueValidation({
      refId: "0042",
      documentType: DocumentTypeEnum.PROJECT_DESIGN_DOCUMENT,
      documentVersion: 1,
      validationBodyName: "Kunene Certifiers",
      creditPeriodStartDate: "2026-01-01",
      creditPeriodEndDate: "2033-01-01",
      validationDate: "2026-03-15",
      extraneous: "should not appear" as any,
    } as any);

    expect(AddAction).toHaveBeenCalledWith({
      actionType: AsyncActionType.CADTV2ValidationCreate,
      actionProps: {
        refId: "0042",
        documentType: DocumentTypeEnum.PROJECT_DESIGN_DOCUMENT,
        documentVersion: 1,
        validationBodyName: "Kunene Certifiers",
        creditPeriodStartDate: "2026-01-01",
        creditPeriodEndDate: "2033-01-01",
        validationDate: "2026-03-15",
      },
    });
  });

  it("enqueues bootstrap and commit with no props", async () => {
    const { service, AddAction } = buildService();

    await service.enqueueBootstrap();
    await service.enqueueCommit();

    expect(AddAction).toHaveBeenNthCalledWith(1, {
      actionType: AsyncActionType.CADTV2Bootstrap,
      actionProps: {},
    });
    expect(AddAction).toHaveBeenNthCalledWith(2, {
      actionType: AsyncActionType.CADTV2Commit,
      actionProps: {},
    });
  });

  it("never fails the caller when AddAction throws", async () => {
    const { service, logger } = buildService();
    const throwingInterface = {
      AddAction: jest.fn(async () => {
        throw new Error("db is down");
      }),
    };
    const throwingService = new CadTrustSyncEnqueueService(throwingInterface as any, logger as any);

    await expect(throwingService.enqueueProjectUpdate("0042", TxType.APPROVE_INF)).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });
});
