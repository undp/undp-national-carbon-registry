import { Controller, Post, Get, Param, Body, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { KgLinkerService, OddLinkResult, KgRelations } from './kg-linker.service';

export class LinkProjectDto {
  title: string;
  description: string;
  country: string;
  sector?: string;
}

/**
 * ATLAS KG ODD Linker Controller
 * 
 * Endpoints:
 * - POST /api/atlas/kg/link-project/:id - Link project to ODD
 * - GET  /api/atlas/kg/validate-odds/:id - Validate ODD links
 * - GET  /api/atlas/kg/health - Health check
 */
@Controller('api/atlas/kg')
export class KgLinkerController {
  private readonly logger = new Logger(KgLinkerController.name);

  constructor(private readonly kgLinkerService: KgLinkerService) {}

  /**
   * POST /api/atlas/kg/link-project/:id
   * 
   * Link a UNDP project to SDG (ODD) via ATLAS Knowledge Graph
   * 
   * @example
   * POST /api/atlas/kg/link-project/PROJECT_123
   * {
   *   "title": "Agroforesterie El Alaoui",
   *   "description": "500 hectares d'arganiers pour séquestration carbone",
   *   "country": "MA",
   *   "sector": "Forestry"
   * }
   * 
   * Response:
   * {
   *   "project_id": "PROJECT_123",
   *   "odd_links": {
   *     "primary": ["ODD_13.1", "ODD_13.2", "ODD_15.1"],
   *     "secondary": ["ODD_2.4"],
   *     "confidence": 0.87,
   *     "metadata": {
   *       "linked_at": "2024-01-14T10:30:00Z",
   *       "linker_version": "atlas-kg@1.0.0",
   *       "fallback_mode": false
   *     }
   *   },
   *   "kg_relations": {
   *     "graph_id": "atlas-kg-ma-2024",
   *     "nodes": [
   *       { "type": "PROJECT", "id": "PROJECT_123", "weight": 1.0 },
   *       { "type": "ODD", "id": "ODD_13.1", "weight": 0.9 }
   *     ],
   *     "last_sync": "2024-01-14T10:30:00Z"
   *   }
   * }
   */
  @Post('link-project/:id')
  async linkProject(
    @Param('id') projectId: string,
    @Body() dto: LinkProjectDto,
  ): Promise<{
    project_id: string;
    odd_links: OddLinkResult;
    kg_relations: KgRelations;
  }> {
    this.logger.log(`Received link request for project ${projectId}`);

    if (!dto.title || !dto.description || !dto.country) {
      throw new HttpException(
        'Missing required fields: title, description, country',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Step 1: Link to ODD
      const oddLinks = await this.kgLinkerService.linkProjectToODD({
        id: projectId,
        title: dto.title,
        description: dto.description,
        country: dto.country,
        sector: dto.sector,
      });

      // Step 2: Build KG relations
      const kgRelations = await this.kgLinkerService.buildKgRelations(
        {
          id: projectId,
          title: dto.title,
          description: dto.description,
          country: dto.country,
          sector: dto.sector,
        },
        oddLinks,
      );

      this.logger.log(
        `Project ${projectId} successfully linked to ${oddLinks.primary.length} ODD`,
      );

      return {
        project_id: projectId,
        odd_links: oddLinks,
        kg_relations: kgRelations,
      };
    } catch (error) {
      this.logger.error(`Failed to link project ${projectId}`, error);
      throw new HttpException(
        'Internal server error during ODD linkage',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/atlas/kg/validate-odds/:id
   * 
   * Validate ODD links for a project
   * 
   * @example
   * GET /api/atlas/kg/validate-odds/PROJECT_123?odd_links=["ODD_13.1","ODD_15.1"]
   * 
   * Response:
   * {
   *   "project_id": "PROJECT_123",
   *   "validation": {
   *     "valid": true,
   *     "warnings": [],
   *     "score": 1.0
   *   }
   * }
   */
  @Get('validate-odds/:id')
  async validateOdds(
    @Param('id') projectId: string,
    @Body() body: { odd_links: OddLinkResult },
  ): Promise<{
    project_id: string;
    validation: {
      valid: boolean;
      warnings: string[];
      score: number;
    };
  }> {
    this.logger.log(`Validating ODD links for project ${projectId}`);

    if (!body.odd_links) {
      throw new HttpException(
        'Missing odd_links in request body',
        HttpStatus.BAD_REQUEST,
      );
    }

    const validation = await this.kgLinkerService.validateOddLinks(
      projectId,
      body.odd_links,
    );

    return {
      project_id: projectId,
      validation,
    };
  }

  /**
   * GET /api/atlas/kg/health
   * 
   * Health check for ATLAS KG connectivity
   * 
   * @example
   * GET /api/atlas/kg/health
   * 
   * Response:
   * {
   *   "status": "healthy",
   *   "atlas_kg_reachable": true,
   *   "response_time_ms": 120,
   *   "version": "1.0.0"
   * }
   */
  @Get('health')
  async health(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    atlas_kg_reachable: boolean;
    response_time_ms: number;
    version: string;
  }> {
    const healthStatus = await this.kgLinkerService.healthCheck();

    return {
      ...healthStatus,
      version: '1.0.0',
    };
  }
}
