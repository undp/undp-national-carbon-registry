import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { EmissionProperties } from './emission.properties';
import { Type } from 'class-transformer';

export class EmissionOther {
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => EmissionProperties)
  indirectN2oEmissions: EmissionProperties;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => EmissionProperties)
  other: EmissionProperties;
}
