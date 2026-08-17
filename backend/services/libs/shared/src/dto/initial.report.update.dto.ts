import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class InitialReportUpdateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  reportId: string;

  @ApiPropertyOptional()
  @IsOptional()
  participationDemonstration?: any;

  @ApiPropertyOptional()
  @IsOptional()
  itmoMetrics?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caMethodDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  ndcQuantification?: any;

  @ApiPropertyOptional()
  @IsOptional()
  cooperativeApproachDetails?: any;

  @ApiPropertyOptional()
  @IsOptional()
  environmentalIntegrity?: any;
}
