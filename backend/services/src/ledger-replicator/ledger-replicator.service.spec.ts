import { Test, TestingModule } from '@nestjs/testing';
import { QLDBKinesisReplicatorService } from './qldb-kinesis-replicator.service';

describe('LedgerReplicatorService', () => {
  let service: QLDBKinesisReplicatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QLDBKinesisReplicatorService],
    }).compile();

    service = module.get<QLDBKinesisReplicatorService>(QLDBKinesisReplicatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
