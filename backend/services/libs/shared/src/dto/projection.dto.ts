import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectionProperties } from './projection.properties';
import { ProjectionAgricultureForestryOtherLandUse } from './projection.agriculture.forestry.other.land.use';
import { ProjectionEnergyEmissions } from './projection.energy.emissions';
import { ProjectionIndustrialProcessesProductUse } from './projection.industrial.processes.product.use';
import { ProjectionOther } from './projection.other';
import { ProjectionWaste } from './projection.waste';

export class ProjectionDto {
  @ApiProperty()
  @IsNotEmpty()
  year: string;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => ProjectionEnergyEmissions)
  energyEmissions: ProjectionEnergyEmissions;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => ProjectionIndustrialProcessesProductUse)
  industrialProcessesProductUse: ProjectionIndustrialProcessesProductUse;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => ProjectionAgricultureForestryOtherLandUse)
  agricultureForestryOtherLandUse: ProjectionAgricultureForestryOtherLandUse;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => ProjectionWaste)
  waste: ProjectionWaste;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => ProjectionOther)
  other: ProjectionOther;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => ProjectionProperties)
  totalCo2WithoutLand: ProjectionProperties;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => ProjectionProperties)
  totalCo2WithLand: ProjectionProperties;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  emissionDocument?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiPropertyOptional()
  @IsInt()
  version: number;
}
