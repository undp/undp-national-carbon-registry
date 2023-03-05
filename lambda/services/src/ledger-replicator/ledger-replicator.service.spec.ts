import { Test, TestingModule } from '@nestjs/testing';
import { LedgerReplicatorService } from './qldb-kinesis-replicator.service';

describe('LedgerReplicatorService', () => {
  let service: LedgerReplicatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LedgerReplicatorService],
    }).compile();

    service = module.get<LedgerReplicatorService>(LedgerReplicatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
