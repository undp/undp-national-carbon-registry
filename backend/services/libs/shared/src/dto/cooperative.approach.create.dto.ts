import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { CooperativeApproachStatus } from "../enum/cooperative.approach.status.enum";

export class CooperativeApproachCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty({ each: true })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  participatingParties: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  hostParty: string;

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
  @IsString()
  authorizationDocumentUrl?: string;
}
