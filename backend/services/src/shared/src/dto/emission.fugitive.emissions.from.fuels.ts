import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { EmissionProperties } from './emission.properties';
import { Type } from 'class-transformer';

export class EmissionFugitiveEmissionsFromFuels {
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => EmissionProperties)
  solidFuels: EmissionProperties;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => EmissionProperties)
  oilNaturalGas: EmissionProperties;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => EmissionProperties)
  otherEmissionsEnergyProduction: EmissionProperties;
}
