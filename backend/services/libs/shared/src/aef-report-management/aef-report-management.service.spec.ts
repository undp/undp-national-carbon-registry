import { Test, TestingModule } from '@nestjs/testing';
import { AefReportManagementService } from './aef-report-management.service';

describe('AefReportManagementService', () => {
  let service: AefReportManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AefReportManagementService],
    }).compile();

    service = module.get<AefReportManagementService>(AefReportManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
