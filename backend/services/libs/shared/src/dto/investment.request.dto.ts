import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateIf } from "class-validator";
import { InvestmentDto } from "./investment.dto";

export class InvestmentRequestDto extends InvestmentDto{
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  programmeId: string;
  
  @ApiPropertyOptional()
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  fromCompanyIds: number[];

  @ApiProperty()
  @IsArray()
  @IsNumber({},{each: true})
  @Min(0, { each: true })
  percentage: number[];

}
