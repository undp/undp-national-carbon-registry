import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsString, ValidateIf } from "class-validator";

export class SLCFSignsDto {
  @ValidateIf((c) => c.ceoSign)
  @IsNotEmpty()
  @IsString()
  @ApiPropertyOptional()
  ceoSign: string;

  @ValidateIf((c) => c.chairmanSign)
  @IsNotEmpty()
  @IsString()
  @ApiPropertyOptional()
  chairmanSign: string;
}
