import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsString,
  ValidateNested,
} from "class-validator";
import { DocumentTypeEnum } from "src/enum/document.type.enum";

export class GetDocDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  programmeId: string;

  @ApiProperty({ enum: DocumentTypeEnum })
  @IsNotEmpty()
  @IsEnum(DocumentTypeEnum, {
    message: "Invalid doc type. Supported following doc type:" + Object.values(DocumentTypeEnum),
  })
  docType: DocumentTypeEnum;
}
