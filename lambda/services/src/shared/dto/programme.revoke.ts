import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsPositive, IsNumber, IsString, Length, IsBoolean, IsOptional } from "class-validator";

export class ProgrammeCertify {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    programmeId: string;

    @ApiProperty()
    @IsString()
    @Length(0, 200)
    comment: string;
    
}