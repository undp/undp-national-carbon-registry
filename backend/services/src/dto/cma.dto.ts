import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsNotEmptyObject, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CMAContentDto } from "./cmaContent.dto";

export class CMADto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  programmeId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  companyId: number;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => CMAContentDto)
  content: CMAContentDto;
}
