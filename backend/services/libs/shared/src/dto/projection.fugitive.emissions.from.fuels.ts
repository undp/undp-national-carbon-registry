import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectionProperties } from './projection.properties';

export class ProjectionFugitiveEmissionsFromFuels {
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => ProjectionProperties)
  solidFuels: ProjectionProperties;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => ProjectionProperties)
  oilNaturalGas: ProjectionProperties;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => ProjectionProperties)
  otherEmissionsEnergyProduction: ProjectionProperties;
}
