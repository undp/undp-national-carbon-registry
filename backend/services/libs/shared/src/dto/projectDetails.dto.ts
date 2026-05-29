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

export class ProjectDetails {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  dateOfIssue: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectProponent: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  preparedBy: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  physicalAddress: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber()
  telephone: string;

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

  reportID: string;
}
