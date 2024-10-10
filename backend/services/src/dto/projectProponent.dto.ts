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

export class ProjectProponent {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  organizationName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  email: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  contactPerson: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber()
  telephone: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber()
  fax: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  address: string;
}
