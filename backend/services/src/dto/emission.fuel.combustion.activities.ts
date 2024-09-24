import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { EmissionProperties } from './emission.properties';
import { Type } from 'class-transformer';

export class EmissionFuelCombustionActivities {
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => EmissionProperties)
  energyIndustries: EmissionProperties;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => EmissionProperties)
  manufacturingIndustriesConstruction: EmissionProperties;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => EmissionProperties)
  transport: EmissionProperties;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => EmissionProperties)
  otherSectors: EmissionProperties;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => EmissionProperties)
  nonSpecified: EmissionProperties;
}
