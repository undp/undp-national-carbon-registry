import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsPositive, IsNumber, IsString, Length, IsBoolean, IsOptional } from "class-validator";

export class ProgrammeCertify {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    programmeId: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    comment: string; 

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    certifierId: number; 
}