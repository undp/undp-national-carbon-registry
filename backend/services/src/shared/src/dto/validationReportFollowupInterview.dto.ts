import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsPhoneNumber,
  IsPositive,
  IsString,
  IsUrl,
  ValidateNested,
} from "class-validator";

export class ValidationReportFollowupInterview {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  designation: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  organization: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  method: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  mainTopicsCovered: string;
}
