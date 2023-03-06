import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  isNotEmpty,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { IsValidCountry } from "../util/validcountry.decorator";

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
