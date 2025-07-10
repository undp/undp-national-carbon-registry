import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsPositive,
  IsString,
  ValidateNested,
} from "class-validator";
import { GHGSource } from "./ghgSource.dto";

export class ProjectBoundary {
  @ApiProperty()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => GHGSource)
  baseline: GHGSource[];

  @ApiProperty()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => GHGSource)
  project: GHGSource[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;
}
