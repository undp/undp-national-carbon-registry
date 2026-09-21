import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { NdcType } from "../enum/ndc.type.enum";
import { CaMethod } from "../enum/ca.method.enum";

// The general NDC information a report is opened with. Cooperative
// approaches are attached afterwards through
// /initialReport/cooperativeApproach/add — a report is generated empty
// and cannot be submitted until at least one approach is on it.
//
// Everything is optional at generate time so a draft can be started and
// completed incrementally; submitReport enforces what a filing needs.
export class InitialReportCreateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  ndcStartYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  ndcEndYear?: number;

  @ApiPropertyOptional({ enum: NdcType })
  @IsOptional()
  @IsEnum(NdcType)
  ndcType?: NdcType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  baseYear?: number;

  // The emission value AT baseYear, collected here rather than looked
  // up from the separate Emission domain — see the entity comment.
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  baseYearEmission?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  ndcTarget?: number;

  @ApiPropertyOptional({ enum: CaMethod })
  @IsOptional()
  @IsEnum(CaMethod)
  caMethod?: CaMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caMethodDescription?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sectors?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  participationDemonstration?: any;

  @ApiPropertyOptional()
  @IsOptional()
  itmoMetrics?: any;

  @ApiPropertyOptional()
  @IsOptional()
  environmentalIntegrity?: any;
}
