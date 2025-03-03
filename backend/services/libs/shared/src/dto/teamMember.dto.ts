import { ApiProperty } from "@nestjs/swagger";
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsString,
  ValidateNested,
} from "class-validator";

export class TeamMemberDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  consultant: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  role: string;
}
