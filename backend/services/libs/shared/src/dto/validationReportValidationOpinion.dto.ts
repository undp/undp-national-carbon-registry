import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsPhoneNumber,
  IsPositive,
  IsString,
  IsUrl,
} from "class-validator";

export class ValidationReportValidationOpinion {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  opinion: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  validator1Signature: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  validator1Name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  validator1Designation: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  validator1DateOfSign: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  validator2Signature: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  validator2Name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  validator2Designation: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  validator2DateOfSign: number;
}
