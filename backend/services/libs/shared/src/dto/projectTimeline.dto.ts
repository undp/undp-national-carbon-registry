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

export class ProjectTimelineDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  activity: string;

  @ApiProperty({ isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  period: number[];
}
