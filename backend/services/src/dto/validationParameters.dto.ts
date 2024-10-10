import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsPositive, IsString } from "class-validator";

export class ValidationParameters {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  parameter: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  unit: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  source: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  purpose: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  valueApplied: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  justification: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  comments: string;
}
