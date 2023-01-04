import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Length } from "class-validator";

export class ProgrammeTransferRequest {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    programmeId: string;

    @ApiProperty()
    @IsPositive()
    @IsNumber()
    creditAmount: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    comment: string;
}