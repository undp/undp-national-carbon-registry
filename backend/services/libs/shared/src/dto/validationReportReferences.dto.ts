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

export class ValidationReportReferences {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  references: string;
}
