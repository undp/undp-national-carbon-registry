import { Test, TestingModule } from '@nestjs/testing';
import { SerialNumberManagementService } from './serial-number-management.service';

describe('SerialNumberManagementService', () => {
  let service: SerialNumberManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SerialNumberManagementService],
    }).compile();

    service = module.get<SerialNumberManagementService>(SerialNumberManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
