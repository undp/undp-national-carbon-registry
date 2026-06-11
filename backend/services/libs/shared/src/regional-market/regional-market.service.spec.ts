import { Test, TestingModule } from "@nestjs/testing";
import { DocumentManagementService } from "../document-management/document-management.service";
import { ProgrammeLedgerService } from "../programme-ledger/programme-ledger.service";
import { RegionalMarketModule } from "./regional-market.module";
import { RegionalMarketService } from "./regional-market.service";

describe("RegionalMarketService", () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [RegionalMarketModule],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it("resolves from the regional market module", () => {
    expect(module.get(RegionalMarketService)).toBeInstanceOf(
      RegionalMarketService
    );
  });

  it("delegates project document creation to document management", async () => {
    const documentManagementService = {
      addDocument: jest.fn().mockResolvedValue({ id: 1 }),
    };
    const service = new RegionalMarketService(
      undefined,
      undefined,
      documentManagementService as any
    );
    const dto = { documentType: "INITIAL_NOTIFICATION_FORM" };
    const user = { id: 1 };

    await expect(service.createProjectDocument(dto as any, user)).resolves.toEqual({
      id: 1,
    });
    expect(documentManagementService.addDocument).toHaveBeenCalledWith(dto, user);
  });

  it("delegates project approval actions to document management", async () => {
    const documentManagementService = {
      verify: jest.fn().mockResolvedValue({ status: "APPROVED" }),
    };
    const service = new RegionalMarketService(
      undefined,
      undefined,
      documentManagementService as any
    );
    const dto = { documentId: 10, action: "APPROVE" };
    const user = { id: 2 };

    await expect(service.performProjectDocumentAction(dto as any, user)).resolves.toEqual({
      status: "APPROVED",
    });
    expect(documentManagementService.verify).toHaveBeenCalledWith(dto, user);
  });

  it("delegates credit issuance to the programme ledger", async () => {
    const programmeLedgerService = {
      issueCredits: jest.fn().mockResolvedValue({ creditIssued: 100 }),
    };
    const service = new RegionalMarketService(
      undefined,
      undefined,
      undefined,
      programmeLedgerService as any
    );
    const activity = { projectRefId: "PRJ-1" };
    const creditVerified = [{ vintage: 2025, creditAmount: 100 }];
    const document = { id: 10 };
    const user = { id: 3 };

    await expect(
      service.issueProjectCredits(
        activity as any,
        creditVerified as any,
        20,
        document as any,
        "TX-1",
        user as any
      )
    ).resolves.toEqual({ creditIssued: 100 });
    expect(programmeLedgerService.issueCredits).toHaveBeenCalledWith(
      activity,
      creditVerified,
      20,
      document,
      "TX-1",
      user
    );
  });
});
