import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsPositive, IsNumber, IsString, Length, IsOptional, Min } from "class-validator";

export class ProgrammeApprove {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    programmeId: string;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    @Min(0)
    issueAmount: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    comment: string;
}