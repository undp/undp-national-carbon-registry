import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ProgrammeDocumentDto {

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    data: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    programmeId: string;

    @IsOptional()
    @ApiPropertyOptional()
    @IsString()
    actionId: string;
}