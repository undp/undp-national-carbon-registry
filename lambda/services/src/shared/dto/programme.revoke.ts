import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsPositive, IsNumber, IsString, Length, IsBoolean, IsOptional } from "class-validator";

export class ProgrammeRevoke {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    programmeId: string;

    @ApiProperty()
    @IsString()
    @Length(0, 200)
    comment: string;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    certifierId: number; 
    
}