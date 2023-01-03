import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsPositive, IsNumber, IsString, Length, IsOptional } from "class-validator";

export class ProgrammeApprove {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    programmeId: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    comment: string;
}