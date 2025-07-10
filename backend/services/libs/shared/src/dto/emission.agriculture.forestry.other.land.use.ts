import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { EmissionProperties } from './emission.properties';
import { Type } from 'class-transformer';

export class EmissionAgricultureForestryOtherLandUse {
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => EmissionProperties)
  livestock: EmissionProperties;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => EmissionProperties)
  land: EmissionProperties;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => EmissionProperties)
  aggregateNonCo2SourcesLand: EmissionProperties;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => EmissionProperties)
  other: EmissionProperties;
}
