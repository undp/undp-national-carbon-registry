import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsPhoneNumber,
  IsPositive,
  IsString,
  IsUrl,
  ValidateNested,
} from "class-validator";
import { ProjectProponent } from "./projectProponent.dto";

export class LocationOfProjectActivity {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  locationOfProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  province: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  district: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  dsDivision: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  community: string;

  @ApiProperty()
  @IsArray()
  geographicalLocationCoordinates: [];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  additionalDocuments: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectFundings: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  startDate: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  commissioningDate: number;
}
