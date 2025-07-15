import { Test, TestingModule } from '@nestjs/testing';
import { ProgrammeSlService } from './programme-sl.service';

describe('ProgrammeSlService', () => {
  let service: ProgrammeSlService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProgrammeSlService],
    }).compile();

    service = module.get<ProgrammeSlService>(ProgrammeSlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
