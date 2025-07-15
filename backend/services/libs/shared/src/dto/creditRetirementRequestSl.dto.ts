import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Length, Min } from "class-validator";
import { CreditType } from "../enum/creditType.enum";

export class CreditRetirementRequestSlDto {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    programmeId: string;

    @IsNotEmpty()
    @ApiProperty({ enum: CreditType })
    @IsEnum(CreditType, {
      message:
        "Invalid Credit Type. Supported following types:" + Object.values(CreditType),
    })
    creditType: CreditType;

    @ApiPropertyOptional()
    @IsNotEmpty()
    @IsNumber()
    fromCompanyId: number;

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    toCompanyId: number;

    @ApiProperty()
    @IsNotEmpty()
    @Min(0)
    @IsNumber()
    creditAmount: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    comment: string;
}