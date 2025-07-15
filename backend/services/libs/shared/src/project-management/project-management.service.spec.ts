import { Test, TestingModule } from '@nestjs/testing';
import { ProjectManagementService } from './project-management.service';

describe('ProjectManagementService', () => {
  let service: ProjectManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectManagementService],
    }).compile();

    service = module.get<ProjectManagementService>(ProjectManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
