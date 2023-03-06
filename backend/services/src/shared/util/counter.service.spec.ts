import { Test, TestingModule } from '@nestjs/testing';
import { CounterService } from './counter.service';

describe('CounterService', () => {
  let service: CounterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CounterService],
    }).compile();

    service = module.get<CounterService>(CounterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
