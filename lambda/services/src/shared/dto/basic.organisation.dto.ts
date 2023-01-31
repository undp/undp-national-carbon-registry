import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  isNotEmpty,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class BasicOrgInfo {
  @IsEmail()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @IsOptional()
  name: string;

  @IsNotEmpty()
  @IsString()
  @ApiPropertyOptional()
  @IsOptional()
  country: string;
}
