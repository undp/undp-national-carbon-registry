import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { DocType } from "../enum/document.type";
import { DocumentStatus } from "../enum/document.status";

export class DocumentAction {
    
    @IsNotEmpty()
    @IsNumber()
    @ApiProperty()
    id: number;

    @IsNotEmpty()
    @ApiProperty({ enum: DocumentStatus })
    @IsEnum(DocumentStatus, {
        message:
        "Invalid status. Supported following types:" + Object.values(DocumentStatus),
    })
    status: DocumentStatus;

    @IsOptional()
    @IsString()
    @ApiPropertyOptional()
    remark: string;
}