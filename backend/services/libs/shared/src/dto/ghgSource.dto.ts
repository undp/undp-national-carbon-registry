import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsNotEmpty, IsPositive, IsString } from "class-validator";

export class GHGSource {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  source: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isCO2Included: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  co2Justification: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isCH4Included: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  ch4Justification: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isN2OIncluded: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  n2oJustification: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isOtherIncluded: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  otherJustification: string;
}
