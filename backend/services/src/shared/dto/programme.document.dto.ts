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
    externalId: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    type: string;

    @IsOptional()
    @ApiPropertyOptional()
    @IsString()
    actionId: string;
}