import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsPositive,
  IsString,
  ValidateNested,
} from "class-validator";
import { ProjectBoundary } from "./projectBoundary.dto";

export class ApplicationOfMethodology {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  titleAndReference: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  applicability: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  baselineScenario: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  additionality: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  methodologyDeviations: string;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ProjectBoundary)
  projectBoundary: ProjectBoundary;
}
