import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { DocType } from "../enum/document.type";

export class ProgrammeDocumentDto {

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    data: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    programmeId: string;

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