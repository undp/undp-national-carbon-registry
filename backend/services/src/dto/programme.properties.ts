import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  IsPositive,
  IsInt,
  IsNumber,
  IsEnum,
  MaxLength,
  IsOptional,
  ArrayMinSize,
  IsArray,
  IsUrl,
  IsBoolean,
  ValidateIf,
} from "class-validator";
import { GHGs } from "../enum/ghgs.enum";
import { SourceOfFunding } from "../enum/sourceoffinding.enum";
import { IsValidCountry } from "../util/validcountry.decorator";

export class ProgrammeProperties {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  maxInternationalTransferAmount?: string;

  @ApiPropertyOptional()
  @IsPositive()
  @IsInt()
  @IsOptional()
  @IsNotEmpty()
  creditingPeriodInYears?: number;

  @ApiProperty()
  @IsPositive()
  @IsInt()
  @IsNotEmpty()
  estimatedProgrammeCostUSD?: number;

  @ApiPropertyOptional({ enum: SourceOfFunding })
  @IsEnum(SourceOfFunding, {
    message:
      "Invalid source of funding. Supported following values:" +
      Object.values(SourceOfFunding),
  })
  @IsNotEmpty()
  @IsOptional()
  sourceOfFunding?: SourceOfFunding;

  @ApiPropertyOptional()
  @IsPositive()
  @IsNumber()
  @IsOptional()
  grantEquivalentAmount?: number;

  @ApiPropertyOptional()
  @IsPositive()
  @ValidateIf(o => o.article6trade === true)
  @IsNumber()
  @IsOptional()
  carbonPriceUSDPerTon?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsValidCountry()
  @IsOptional()
  buyerCountryEligibility?: string;

  @ApiProperty()
  @IsArray()
  @ArrayMinSize(1)
  @MaxLength(100, { each: true })
  @IsNotEmpty({ each: true })
  @IsString({ each: true })
  geographicalLocation: string[];

  @ApiProperty({ enum: GHGs, isArray: true })
  @IsEnum(GHGs, {
    message:
      "Invalid green house gas. Supported following values:" +
      Object.values(GHGs),
    each: true,
  })
  @IsNotEmpty()
  greenHouseGasses: GHGs[];

  creditYear?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @IsNotEmpty()
  ndcScope?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @IsNotEmpty()
  includedInNDC?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  @IsNotEmpty()
  includedInNap?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  programmeMaterials?: any[];

  // @ApiPropertyOptional()
  // @IsOptional()
  // @IsNotEmpty()
  // projectMaterial?: any[];
}
