import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from "class-validator";

export class ValidationAgreementAppendix {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  additionalComments: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  document: string;
}
