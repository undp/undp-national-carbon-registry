import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
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
  @IsString()
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fax: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roleInProject: string;
}
