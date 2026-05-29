import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface OddLinkResult {
  primary: string[];
  secondary: string[];
  confidence: number;
  metadata: {
    linked_at: Date;
    linker_version: string;
    fallback_mode: boolean;
  };
}

export interface KgRelations {
  graph_id: string;
  nodes: Array<{
    type: 'ODD' | 'NDC' | 'PROJECT';
    id: string;
    weight: number;
  }>;
  last_sync: Date;
}

export interface ProjectInput {
  id: string;
  title: string;
  description: string;
  country: string;
  sector?: string;
}

/**
 * ATLAS Knowledge Graph ODD Linker Service
 * 
 * Phase 1: Proof of Concept
 * - Link UNDP projects to SDG (ODD) via ATLAS KG
 * - Fallback mode if ATLAS KG unavailable
 * - Cache frequent mappings in Redis (future)
 * 
 * @see ADR-001-KG-Integration.md
 */
@Injectable()
export class KgLinkerService {
  private readonly logger = new Logger(KgLinkerService.name);
  private readonly ATLAS_KG_URL: string;
  private readonly ATLAS_API_KEY: string;
  private readonly TIMEOUT_MS = 5000;
  private readonly VERSION = '1.0.0';

  // Fallback ODD mapping par secteur (Morocco specific)
  private readonly FALLBACK_ODD_MAP = {
    'Agriculture': ['ODD_2.4', 'ODD_13.1'],
    'Forestry': ['ODD_13.1', 'ODD_15.1', 'ODD_15.2'],
    'Energy': ['ODD_7.2', 'ODD_13.1'],
    'Transport': ['ODD_11.2', 'ODD_13.1'],
    'Waste': ['ODD_12.5', 'ODD_13.1'],
    'Default': ['ODD_13.1'],  // Climate action par défaut
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.ATLAS_KG_URL = this.configService.get<string>(
      'ATLAS_KG_URL',
      'http://cortex-kg:8080/api/v4',
    );
    this.ATLAS_API_KEY = this.configService.get<string>(
      'ATLAS_API_KEY',
      '',
    );

    this.logger.log(`KG Linker initialized: ${this.ATLAS_KG_URL}`);
  }

  /**
   * Link a UNDP project to SDG (ODD) via ATLAS Knowledge Graph
   * 
   * @param project - Project data (title, description, country)
   * @returns ODD links with confidence scores
   */
  async linkProjectToODD(project: ProjectInput): Promise<OddLinkResult> {
    this.logger.debug(`Linking project ${project.id} to ODD via ATLAS KG`);

    try {
      // Call ATLAS KG API
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.ATLAS_KG_URL}/odd/link`,
          {
            text: `${project.title} ${project.description}`,
            country: project.country,
            sector: project.sector,
            context: 'carbon_credit',
          },
          {
            headers: {
              Authorization: `Bearer ${this.ATLAS_API_KEY}`,
              'Content-Type': 'application/json',
            },
            timeout: this.TIMEOUT_MS,
          },
        ),
      );

      // Parse ATLAS KG response
      const oddCodes = response.data.odd_codes || [];
      const primary = oddCodes
        .filter((o: any) => o.confidence > 0.75)
        .map((o: any) => o.code);
      const secondary = oddCodes
        .filter((o: any) => o.confidence > 0.5 && o.confidence <= 0.75)
        .map((o: any) => o.code);

      this.logger.log(
        `Project ${project.id} linked to ${primary.length} primary ODD, ${secondary.length} secondary ODD`,
      );

      return {
        primary,
        secondary,
        confidence: response.data.global_confidence || 0.85,
        metadata: {
          linked_at: new Date(),
          linker_version: `atlas-kg@${this.VERSION}`,
          fallback_mode: false,
        },
      };
    } catch (error) {
      this.logger.warn(
        `ATLAS KG unavailable for project ${project.id}, using fallback mode`,
        error,
      );

      // Fallback mode: use sector-based mapping
      return this.getFallbackODD(project);
    }
  }

  /**
   * Build Knowledge Graph relations for a project
   * 
   * @param project - Project data
   * @param oddLinks - ODD links from linkProjectToODD()
   * @returns KG relations structure
   */
  async buildKgRelations(
    project: ProjectInput,
    oddLinks: OddLinkResult,
  ): Promise<KgRelations> {
    const graphId = `atlas-kg-${project.country.toLowerCase()}-2024`;

    const nodes = [
      // Project node
      {
        type: 'PROJECT' as const,
        id: project.id,
        weight: 1.0,
      },
      // ODD nodes
      ...oddLinks.primary.map((oddCode) => ({
        type: 'ODD' as const,
        id: oddCode,
        weight: 0.9,
      })),
      ...oddLinks.secondary.map((oddCode) => ({
        type: 'ODD' as const,
        id: oddCode,
        weight: 0.6,
      })),
    ];

    return {
      graph_id: graphId,
      nodes,
      last_sync: new Date(),
    };
  }

  /**
   * Validate ODD links for a project
   * 
   * @param projectId - Project ID
   * @param oddLinks - ODD links to validate
   * @returns Validation result with warnings
   */
  async validateOddLinks(
    projectId: string,
    oddLinks: OddLinkResult,
  ): Promise<{
    valid: boolean;
    warnings: string[];
    score: number;
  }> {
    const warnings: string[] = [];

    // Validation 1: Au moins 1 ODD primaire
    if (oddLinks.primary.length === 0) {
      warnings.push('No primary ODD found, at least ODD 13.1 expected');
    }

    // Validation 2: ODD 13.x (Climate Action) obligatoire pour carbon projects
    const hasClimateODD = oddLinks.primary.some((odd) =>
      odd.startsWith('ODD_13'),
    );
    if (!hasClimateODD) {
      warnings.push('Missing ODD 13.x (Climate Action) for carbon project');
    }

    // Validation 3: Confiance minimale
    if (oddLinks.confidence < 0.6) {
      warnings.push(
        `Low confidence score: ${oddLinks.confidence} (expected > 0.6)`,
      );
    }

    // Validation 4: Fallback mode warning
    if (oddLinks.metadata.fallback_mode) {
      warnings.push('Fallback mode used - manual review recommended');
    }

    const valid = warnings.length === 0;
    const score = valid ? 1.0 : Math.max(0, 1.0 - warnings.length * 0.2);

    this.logger.debug(
      `Project ${projectId} ODD validation: ${valid ? 'PASS' : 'WARN'} (score: ${score})`,
    );

    return { valid, warnings, score };
  }

  /**
   * Health check for ATLAS KG connectivity
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    atlas_kg_reachable: boolean;
    response_time_ms: number;
  }> {
    const startTime = Date.now();

    try {
      await firstValueFrom(
        this.httpService.get(`${this.ATLAS_KG_URL}/health`, {
          timeout: 2000,
        }),
      );

      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 500 ? 'healthy' : 'degraded',
        atlas_kg_reachable: true,
        response_time_ms: responseTime,
      };
    } catch (error) {
      this.logger.error('ATLAS KG health check failed', error);

      return {
        status: 'unhealthy',
        atlas_kg_reachable: false,
        response_time_ms: Date.now() - startTime,
      };
    }
  }

  /**
   * Fallback ODD mapping (used when ATLAS KG unavailable)
   * 
   * @private
   */
  private getFallbackODD(project: ProjectInput): OddLinkResult {
    const sector = project.sector || 'Default';
    const primary =
      this.FALLBACK_ODD_MAP[sector] || this.FALLBACK_ODD_MAP['Default'];

    return {
      primary,
      secondary: [],
      confidence: 0.5, // Low confidence in fallback mode
      metadata: {
        linked_at: new Date(),
        linker_version: `atlas-kg@${this.VERSION}`,
        fallback_mode: true,
      },
    };
  }
}
