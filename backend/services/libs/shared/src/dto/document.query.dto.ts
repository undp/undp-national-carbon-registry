import { ApiProperty } from "@nestjs/swagger";
import { DocumentTypeEnum } from "../enum/document.type.enum";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsSemVer,
  IsString,
} from "class-validator";

export class DocumentQueryDto {
  @ApiProperty()
  @IsNumber()
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  refId: number;

  @ApiProperty({
    enum: DocumentTypeEnum,
  })
  @IsEnum(DocumentTypeEnum)
  @IsNotEmpty()
  documentType: DocumentTypeEnum;
}
