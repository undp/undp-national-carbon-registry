import { Test, TestingModule } from '@nestjs/testing';
import { CreditTransactionsManagementService } from './credit-transactions-management.service';

describe('CreditTransactionsManagementService', () => {
  let service: CreditTransactionsManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreditTransactionsManagementService],
    }).compile();

    service = module.get<CreditTransactionsManagementService>(CreditTransactionsManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
