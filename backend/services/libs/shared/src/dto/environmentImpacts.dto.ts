import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsPositive, IsString } from "class-validator";

export class EnvironmentImpacts {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  analysis: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  assessment: string;
}
