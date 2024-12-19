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

export class ValidationReportProjectDetails {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  client: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  dateOfIssue: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber()
  telephone: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsUrl()
  website: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  summary: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectTitle: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  reportNo: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  workCarriedOutBy: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  workApprovedBy: string;
}
