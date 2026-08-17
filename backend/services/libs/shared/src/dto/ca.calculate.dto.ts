import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { NdcType } from "../enum/ndc.type.enum";
import { CaMethod } from "../enum/ca.method.enum";

// ndcTarget is intentionally not a field here — it's resolved
// server-side from the NdcTarget entity (year + registry country),
// never hand-typed. ndcType is still selected by the caller and
// cross-validated against NdcTarget's own stored type, as a safety
// check rather than the source of truth.
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
}
