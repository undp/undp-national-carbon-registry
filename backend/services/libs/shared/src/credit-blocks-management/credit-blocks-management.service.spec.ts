import { Test, TestingModule } from '@nestjs/testing';
import { CreditBlocksManagementService } from './credit-blocks-management.service';

describe('CreditBlocksManagementService', () => {
  let service: CreditBlocksManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreditBlocksManagementService],
    }).compile();

    service = module.get<CreditBlocksManagementService>(CreditBlocksManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
