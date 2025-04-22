import { Test, TestingModule } from '@nestjs/testing';
import { RegistryClientService } from './registry-client.service';

describe('RegistryClentService', () => {
  let service: RegistryClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RegistryClientService],
    }).compile();

    service = module.get<RegistryClientService>(RegistryClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  
});
