import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { AppAbility } from "@app/shared/casl/casl-ability.factory";
import { CheckPolicies } from "@app/shared/casl/policy.decorator";
import { PoliciesGuard } from "@app/shared/casl/policy.guard";
import { ProjectEntity } from "@app/shared/entities/projects.entity";
import { CadtV2ApiService } from "@app/shared/cadt/cadt-v2-api.service";
import { CadtV2ExportService } from "@app/shared/cadt/cadt-v2-export.service";

@ApiTags("cadtExport")
@Controller("cadtExport")
export class CadtExportController {
  constructor(
    private readonly cadtV2ApiService: CadtV2ApiService,
    private readonly cadtV2ExportService: CadtV2ExportService
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Manage, ProjectEntity)
  )
  @Post("sync")
  async syncAll(@Request() req): Promise<any> {
    try {
      const result = await this.cadtV2ApiService.syncAll();
      return {
        statusCode: 200,
        message: "CADT v2 sync completed",
        ...result,
      };
    } catch (err) {
      throw new HttpException(
        err.message || "Sync failed",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Manage, ProjectEntity)
  )
  @Post("syncProject/:id")
  async syncProject(@Param("id") id: string): Promise<any> {
    try {
      await this.cadtV2ApiService.syncProject(id);
      return {
        statusCode: 200,
        message: `Project ${id} synced to CADT v2`,
      };
    } catch (err) {
      throw new HttpException(
        err.message || "Sync failed",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Read, ProjectEntity)
  )
  @Get("download")
  async downloadExport(@Query("format") format?: string): Promise<any> {
    try {
      if (format === "csv") {
        return await this.cadtV2ExportService.generateCsvExport();
      }
      return await this.cadtV2ExportService.generateExport();
    } catch (err) {
      throw new HttpException(
        err.message || "Export failed",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) =>
    ability.can(Action.Read, ProjectEntity)
  )
  @Get("status")
  async getSyncStatus(): Promise<any> {
    return this.cadtV2ApiService.getSyncStatus();
  }
}
