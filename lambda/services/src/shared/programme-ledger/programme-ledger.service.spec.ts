import { Test, TestingModule } from '@nestjs/testing';
import { ProgrammeLedgerService } from './programme-ledger.service';

describe('ProgrammeLedgerService', () => {
  let service: ProgrammeLedgerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProgrammeLedgerService],
    }).compile();

    service = module.get<ProgrammeLedgerService>(ProgrammeLedgerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
