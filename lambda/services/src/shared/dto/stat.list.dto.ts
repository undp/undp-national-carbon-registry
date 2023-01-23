import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsNotEmptyObject,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  ValidateNested,
} from "class-validator";
import { Stat } from "./stat.dto";

export class StatList {
  @ApiProperty({ isArray: true, type: Stat })
  @ValidateNested()
  stats: Stat[];

  @ApiProperty()
  category: string;

  @IsPositive()
  @IsNumber()
  @ApiPropertyOptional()
  @IsOptional()
  startTime: number;

  @IsPositive()
  @IsNumber()
  @ApiPropertyOptional()
  @IsOptional()
  endTime: number;
}
