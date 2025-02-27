import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class ProjectionProperties {
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  bau: number;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  conditionalNdc: number;

  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  unconditionalNdc: number;

}
