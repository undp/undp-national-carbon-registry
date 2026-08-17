import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { IsValidCountry } from "../decorators/validcountry.decorator";

export class CooperativeApproachCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  // The host party (this registry's own country) is derived server-side
  // from the `systemCountry` config and always unioned in — clients
  // supply only the other participating parties.
  @ApiProperty()
  @IsNotEmpty({ each: true })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @IsValidCountry({ each: true })
  participatingParties: string[];

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
