import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectionProperties } from './projection.properties';

export class ProjectionOther {
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => ProjectionProperties)
  indirectN2oEmissions: ProjectionProperties;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => ProjectionProperties)
  other: ProjectionProperties;
}
