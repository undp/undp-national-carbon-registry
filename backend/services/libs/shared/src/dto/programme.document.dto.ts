import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { DocType } from "../enum/document.type";

export class ProgrammeDocumentDto {

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    data: string;

    @IsOptional()
    @IsString()
    @ApiPropertyOptional()
    programmeId: string;

    @IsOptional()
    @ApiProperty()
    txTime: number;

    @IsOptional()
    @IsString()
    @ApiProperty()
    status: string;

    @IsOptional()
    @IsString()
    @ApiPropertyOptional()
    externalId: string;

    @IsNotEmpty()
    @ApiProperty({ enum: DocType })
    @IsEnum(DocType, {
        message:
        "Invalid doc type. Supported following types:" + Object.values(DocType),
    })
    type: DocType;

    @IsOptional()
    @ApiPropertyOptional()
    @IsString()
    actionId: string;

    @IsOptional()
    @ApiPropertyOptional()
    @IsString()
    certifierTaxId: string;

}