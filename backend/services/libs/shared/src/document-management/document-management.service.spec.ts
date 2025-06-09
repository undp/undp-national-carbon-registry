import { Test, TestingModule } from '@nestjs/testing';
import { DocumentManagementService } from './document-management.service';

describe('DocumentManagementService', () => {
  let service: DocumentManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentManagementService],
    }).compile();

    service = module.get<DocumentManagementService>(DocumentManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
