import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  isNotEmpty,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { IsValidCountry } from "carbon-services-lib";

export class BasicOrgInfo {
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  @IsValidCountry()
  country: string;
}
