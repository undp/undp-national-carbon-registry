import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class ProgrammeAcceptedDto {

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    data: string;

    @IsOptional()
    @ApiProperty()
    txTime: number;

    @IsOptional()
    @IsString()
    @ApiProperty()
    status: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    externalId: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    type: string;

    @IsOptional()
    @ApiProperty()
    @IsNumber()
    creditEst: number;

    @IsOptional()
    @ApiPropertyOptional()
    @IsString()
    certifierTaxId: string;
}