import { MODULE_METADATA } from "@nestjs/common/constants";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Logger } from "@nestjs/common";
import { CreditTransactionsManagementModule } from "../credit-transactions-management/credit-transactions-management.module";
import { DocumentManagementService } from "../document-management/document-management.service";
import { DocumentManagementModule } from "../document-management/document-management.module";
import { Country } from "../entities/country.entity";
import { MarketTradeExecutionEntity } from "../entities/market.trade.execution.entity";
import { ProjectEntity } from "../entities/projects.entity";
import { ProgrammeLedgerService } from "../programme-ledger/programme-ledger.service";
import { ProgrammeLedgerModule } from "../programme-ledger/programme-ledger.module";
import { ProjectManagementModule } from "../project-management/project-management.module";
import { RegionalMarketModule } from "./regional-market.module";
import { RegionalMarketService } from "./regional-market.service";

describe("RegionalMarketService", () => {
  it("declares the real registry dependencies required by the regional facade", () => {
    const imports =
      Reflect.getMetadata(MODULE_METADATA.IMPORTS, RegionalMarketModule) ?? [];

    expect(imports).toContain(ProjectManagementModule);
    expect(imports).toContain(DocumentManagementModule);
    expect(imports).toContain(ProgrammeLedgerModule);
    expect(imports).toContain(CreditTransactionsManagementModule);
    expect(
      imports.some(
        (moduleImport) =>
          moduleImport?.module === TypeOrmModule &&
          moduleImport?.providers?.some((provider) =>
            provider?.provide?.includes?.(MarketTradeExecutionEntity.name)
          ) &&
          moduleImport?.providers?.some((provider) =>
            provider?.provide?.includes?.(ProjectEntity.name)
          ) &&
          moduleImport?.providers?.some((provider) =>
            provider?.provide?.includes?.(Country.name)
          )
      )
    ).toBe(true);
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

  it("executes an OTC trade as registry transfer plus market metadata", async () => {
    const creditTransactionsManagementService = {
      transferCredits: jest.fn().mockResolvedValue({
        id: "TX-1",
        creditBlockId: "CB-1",
      }),
    };
    const marketTradeExecutionService = {
      createFromTransfer: jest.fn().mockResolvedValue({ id: "TRADE-1" }),
    };
    const service = new RegionalMarketService(
      undefined,
      creditTransactionsManagementService as any,
      undefined,
      undefined,
      marketTradeExecutionService as any
    );
    const dto = {
      transfer: {
        senderId: 10,
        recieverId: 20,
        amount: 100,
        projectRefId: "PRJ-1",
        creditBlockId: "CB-1",
        serialNumber: "SN-1",
      },
      market: {
        unitPrice: 42,
        currency: "CNY",
        tradeTime: new Date("2026-06-11T00:00:00.000Z"),
      },
    };
    const user = { id: 1 };

    await expect(service.executeOtcTrade(dto as any, user)).resolves.toEqual({
      registryTransaction: { id: "TX-1", creditBlockId: "CB-1" },
      marketTrade: { id: "TRADE-1" },
      cashSettlementMode: "offline",
      settlementStatus: "SETTLED_OFFLINE",
    });
    expect(creditTransactionsManagementService.transferCredits).toHaveBeenCalledWith(
      dto.transfer,
      user
    );
    expect(marketTradeExecutionService.createFromTransfer).toHaveBeenCalledWith(
      expect.objectContaining({
        creditTransactionId: "TX-1",
        creditBlockId: "CB-1",
        sellerCompanyId: 10,
        buyerCompanyId: 20,
        amount: 100,
        unitPrice: 42,
      })
    );
  });

  it("marks OTC trades for reconciliation when market metadata cannot be recorded after registry transfer", async () => {
    const errorSpy = jest
      .spyOn(Logger.prototype, "error")
      .mockImplementation(() => undefined);
    const creditTransactionsManagementService = {
      transferCredits: jest.fn().mockResolvedValue({
        id: "TX-1",
        creditBlockId: "CB-1",
      }),
    };
    const marketTradeExecutionService = {
      createFromTransfer: jest
        .fn()
        .mockRejectedValue(new Error("database unavailable")),
    };
    const service = new RegionalMarketService(
      undefined,
      creditTransactionsManagementService as any,
      undefined,
      undefined,
      marketTradeExecutionService as any
    );
    const dto = {
      transfer: {
        senderId: 10,
        receiverId: 20,
        amount: 100,
        projectRefId: "PRJ-1",
        creditBlockId: "CB-1",
        serialNumber: "SN-1",
      },
      market: {
        unitPrice: 42,
        currency: "CNY",
      },
    };

    await expect(service.executeOtcTrade(dto as any, { id: 1 })).resolves.toEqual({
      registryTransaction: { id: "TX-1", creditBlockId: "CB-1" },
      marketTrade: undefined,
      cashSettlementMode: "offline",
      settlementStatus: "RECONCILIATION_REQUIRED",
      reconciliationRequired: true,
      reconciliationReason: "database unavailable",
    });
    expect(errorSpy).toHaveBeenCalledWith(
      "OTC market metadata recording failed after registry transfer",
      expect.objectContaining({
        creditTransactionId: "TX-1",
        creditBlockId: "CB-1",
        reconciliationRequired: true,
      })
    );
    errorSpy.mockRestore();
  });
});
