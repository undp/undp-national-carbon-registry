import { Test, TestingModule } from '@nestjs/testing';
import { QLDBLedgerService } from "./qldb-ledger.service";

describe('LedgerDbService', () => {
  let service: QLDBLedgerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QLDBLedgerService],
    }).compile();

    service = module.get<QLDBLedgerService>(QLDBLedgerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
