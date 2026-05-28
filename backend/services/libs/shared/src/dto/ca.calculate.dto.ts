import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { NdcType } from "../enum/ndc.type.enum";
import { CaMethod } from "../enum/ca.method.enum";

export class CaCalculateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  year: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cooperativeApproachId?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(NdcType)
  ndcType: NdcType;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(CaMethod)
  caMethod: CaMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  ndcTarget?: number;
}
