import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { HttpModule, HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { KgLinkerService, ProjectInput } from './kg-linker.service';

describe('KgLinkerService', () => {
  let service: KgLinkerService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        HttpModule,
      ],
      providers: [KgLinkerService],
    }).compile();

    service = module.get<KgLinkerService>(KgLinkerService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('linkProjectToODD', () => {
    it('should link Morocco agroforestry project to ODD 13.1, 13.2, 15.1', async () => {
      const project: ProjectInput = {
        id: 'PROJECT_123',
        title: 'Agroforesterie El Alaoui',
        description: '500 hectares d\'arganiers pour séquestration carbone',
        country: 'MA',
        sector: 'Forestry',
      };

      const mockResponse = {
        data: {
          odd_codes: [
            { code: 'ODD_13.1', confidence: 0.92 },
            { code: 'ODD_13.2', confidence: 0.85 },
            { code: 'ODD_15.1', confidence: 0.78 },
            { code: 'ODD_2.4', confidence: 0.65 },
          ],
          global_confidence: 0.87,
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse as any));

      const result = await service.linkProjectToODD(project);

      expect(result.primary).toContain('ODD_13.1');
      expect(result.primary).toContain('ODD_13.2');
      expect(result.primary).toContain('ODD_15.1');
      expect(result.secondary).toContain('ODD_2.4');
      expect(result.confidence).toBe(0.87);
      expect(result.metadata.fallback_mode).toBe(false);
    });

    it('should use fallback mode when ATLAS KG unavailable', async () => {
      const project: ProjectInput = {
        id: 'PROJECT_456',
        title: 'Solar Farm Sahara',
        description: 'Renewable energy project',
        country: 'MA',
        sector: 'Energy',
      };

      jest.spyOn(httpService, 'post').mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      const result = await service.linkProjectToODD(project);

      expect(result.primary).toContain('ODD_7.2');
      expect(result.primary).toContain('ODD_13.1');
      expect(result.confidence).toBe(0.5);
      expect(result.metadata.fallback_mode).toBe(true);
    });

    it('should handle forestry projects with correct ODD mapping', async () => {
      const project: ProjectInput = {
        id: 'PROJECT_789',
        title: 'Cedar Forest Restoration',
        description: 'Reforestation of Atlas Mountains',
        country: 'MA',
        sector: 'Forestry',
      };

      const mockResponse = {
        data: {
          odd_codes: [
            { code: 'ODD_13.1', confidence: 0.88 },
            { code: 'ODD_15.1', confidence: 0.95 },
            { code: 'ODD_15.2', confidence: 0.82 },
          ],
          global_confidence: 0.90,
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse as any));

      const result = await service.linkProjectToODD(project);

      expect(result.primary).toContain('ODD_15.1');
      expect(result.primary).toContain('ODD_15.2');
      expect(result.confidence).toBeGreaterThan(0.85);
    });
  });

  describe('buildKgRelations', () => {
    it('should build correct KG relations structure', async () => {
      const project: ProjectInput = {
        id: 'PROJECT_123',
        title: 'Test Project',
        description: 'Test Description',
        country: 'MA',
      };

      const oddLinks = {
        primary: ['ODD_13.1', 'ODD_15.1'],
        secondary: ['ODD_2.4'],
        confidence: 0.85,
        metadata: {
          linked_at: new Date(),
          linker_version: 'atlas-kg@1.0.0',
          fallback_mode: false,
        },
      };

      const result = await service.buildKgRelations(project, oddLinks);

      expect(result.graph_id).toBe('atlas-kg-ma-2024');
      expect(result.nodes).toHaveLength(4); // 1 project + 3 ODD
      expect(result.nodes[0].type).toBe('PROJECT');
      expect(result.nodes[0].id).toBe('PROJECT_123');
      expect(result.nodes[1].type).toBe('ODD');
      expect(result.nodes[1].id).toBe('ODD_13.1');
    });
  });

  describe('validateOddLinks', () => {
    it('should validate correct ODD links', async () => {
      const oddLinks = {
        primary: ['ODD_13.1', 'ODD_15.1'],
        secondary: [],
        confidence: 0.85,
        metadata: {
          linked_at: new Date(),
          linker_version: 'atlas-kg@1.0.0',
          fallback_mode: false,
        },
      };

      const result = await service.validateOddLinks('PROJECT_123', oddLinks);

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.score).toBe(1.0);
    });

    it('should warn when missing climate ODD', async () => {
      const oddLinks = {
        primary: ['ODD_2.4'],
        secondary: [],
        confidence: 0.85,
        metadata: {
          linked_at: new Date(),
          linker_version: 'atlas-kg@1.0.0',
          fallback_mode: false,
        },
      };

      const result = await service.validateOddLinks('PROJECT_456', oddLinks);

      expect(result.valid).toBe(false);
      expect(result.warnings).toContain(
        'Missing ODD 13.x (Climate Action) for carbon project',
      );
    });

    it('should warn when confidence too low', async () => {
      const oddLinks = {
        primary: ['ODD_13.1'],
        secondary: [],
        confidence: 0.45,
        metadata: {
          linked_at: new Date(),
          linker_version: 'atlas-kg@1.0.0',
          fallback_mode: false,
        },
      };

      const result = await service.validateOddLinks('PROJECT_789', oddLinks);

      expect(result.valid).toBe(false);
      expect(result.warnings.some((w) => w.includes('Low confidence'))).toBe(
        true,
      );
    });

    it('should warn when fallback mode used', async () => {
      const oddLinks = {
        primary: ['ODD_13.1'],
        secondary: [],
        confidence: 0.85,
        metadata: {
          linked_at: new Date(),
          linker_version: 'atlas-kg@1.0.0',
          fallback_mode: true,
        },
      };

      const result = await service.validateOddLinks('PROJECT_999', oddLinks);

      expect(result.valid).toBe(false);
      expect(result.warnings).toContain(
        'Fallback mode used - manual review recommended',
      );
    });
  });

  describe('healthCheck', () => {
    it('should return healthy when ATLAS KG reachable', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(
        of({
          data: { status: 'ok' },
          status: 200,
        } as any),
      );

      const result = await service.healthCheck();

      expect(result.status).toBe('healthy');
      expect(result.atlas_kg_reachable).toBe(true);
      expect(result.response_time_ms).toBeLessThan(500);
    });

    it('should return unhealthy when ATLAS KG unreachable', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(
        throwError(() => new Error('Connection refused')),
      );

      const result = await service.healthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.atlas_kg_reachable).toBe(false);
    });
  });
});
