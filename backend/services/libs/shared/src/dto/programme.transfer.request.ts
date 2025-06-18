import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Length, Min } from "class-validator";

export class ProgrammeTransferRequest {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    programmeId: string;

    @ApiPropertyOptional()
    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    fromCompanyIds: number[];

    @ApiPropertyOptional()
    @IsArray()
    @IsNumber({},{each: true})
    @Min(0, { each: true })
    @IsOptional()
    companyCredit: number[];

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    toCompanyId: number;

    @ApiPropertyOptional()
    @IsNotEmpty()
    @IsNotEmpty()
    @IsOptional()
    toAccount: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    comment: string;
}