import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from "class-validator";
import { Stat } from "./stat.dto";
import { SYSTEM_TYPE } from "../enum/system.names.enum";

export class StatList {
  @ApiProperty({ isArray: true, type: Stat })
  @ValidateNested({ each: true })
  @Type(() => Stat)
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

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  system: SYSTEM_TYPE
}
