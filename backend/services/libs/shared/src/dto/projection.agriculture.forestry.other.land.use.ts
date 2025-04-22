import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectionProperties } from './projection.properties';

export class ProjectionAgricultureForestryOtherLandUse {
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => ProjectionProperties)
  livestock: ProjectionProperties;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => ProjectionProperties)
  land: ProjectionProperties;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => ProjectionProperties)
  aggregateNonCo2SourcesLand: ProjectionProperties;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => ProjectionProperties)
  other: ProjectionProperties;
}
