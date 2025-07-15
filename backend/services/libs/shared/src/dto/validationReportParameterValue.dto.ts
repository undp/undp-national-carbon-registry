import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsPhoneNumber,
  IsPositive,
  IsString,
  IsUrl,
  ValidateNested,
} from "class-validator";
import { ProjectProponent } from "./projectProponent.dto";

export class ValidationReportParameterValue {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  parameter: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  value: string;
}
