import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { CooperativeApproachStatus } from "../enum/cooperative.approach.status.enum";

export class CooperativeApproachUpdateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  cooperativeApproachId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participatingParties?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  startDate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  endDate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expectedMitigationOutcomes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  environmentalIntegrityAssessment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ndcLink?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(CooperativeApproachStatus)
  status?: CooperativeApproachStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  authorizationDocumentUrl?: string;
}
