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

export class ValidationReportIntroduction {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  objective: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  scopeAndCriteria: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  titleOfProjectActivity: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectParticipant: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  hostParty: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  consultant: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  summary: string;
}
