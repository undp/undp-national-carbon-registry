import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { DocumentTypeEnum } from "src/shared/src/enum/document.type.enum";

export class GetDocDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  programmeId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  verificationRequestId?: number;

  @ApiProperty({ enum: DocumentTypeEnum })
  @IsNotEmpty()
  @IsEnum(DocumentTypeEnum, {
    message:
      "Invalid doc type. Supported following doc type:" +
      Object.values(DocumentTypeEnum),
  })
  docType: DocumentTypeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  version?: number;
}
