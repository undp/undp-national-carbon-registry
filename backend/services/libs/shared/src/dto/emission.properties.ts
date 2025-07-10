import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class EmissionProperties {
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  co2: number;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  ch4: number;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  n2o: number;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  co2eq: number;
}
