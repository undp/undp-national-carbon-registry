import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { CooperativeApproachStatus } from "../enum/cooperative.approach.status.enum";
import { IsValidCountry } from "../decorators/validcountry.decorator";

export class CooperativeApproachUpdateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  cooperativeApproachId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  // Host party stays in the set (unioned back in server-side) even if
  // omitted here — see CooperativeApproachService.update().
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsValidCountry({ each: true })
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
