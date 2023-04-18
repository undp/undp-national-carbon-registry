import { Test, TestingModule } from '@nestjs/testing';
import { DataImporterService } from './data-importer.service';

describe('DataImporterService', () => {
  let service: DataImporterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DataImporterService],
    }).compile();

    service = module.get<DataImporterService>(DataImporterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
