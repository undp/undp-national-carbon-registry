import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectionProperties } from './projection.properties';

export class ProjectionFuelCombustionActivities {
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => ProjectionProperties)
  energyIndustries: ProjectionProperties;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => ProjectionProperties)
  manufacturingIndustriesConstruction: ProjectionProperties;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => ProjectionProperties)
  transport: ProjectionProperties;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => ProjectionProperties)
  otherSectors: ProjectionProperties;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => ProjectionProperties)
  nonSpecified: ProjectionProperties;
}
