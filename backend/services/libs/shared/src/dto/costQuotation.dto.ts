import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsNotEmptyObject, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CMAContentDto } from "./cmaContent.dto";
import { CostQuotationContentDto } from "./costQuotationContent.dto";

export class CostQuotationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  programmeId: string;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => CostQuotationContentDto)
  content: CostQuotationContentDto;
}
