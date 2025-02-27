import { ApiProperty } from "@nestjs/swagger";
import {
  ArrayNotEmpty,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsPhoneNumber,
  IsPositive,
  IsString,
  ValidateNested,
} from "class-validator";
export class StakeholderInterviewDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  stakeholderName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  stakeholderDesignation: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber()
  stakeholderContactNo: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  subjectCovered: string;
}
