import { ApiProperty } from "@nestjs/swagger";
import { DocumentTypeEnum } from "../enum/document.type.enum";
import { IsEnum, IsNotEmpty, IsSemVer, IsString } from "class-validator";

export class DocumentQueryDto {
  @ApiProperty({ type: "string" })
  @IsString()
  @IsNotEmpty()
  projectRefId: string;

  @ApiProperty({
    enum: DocumentTypeEnum,
  })
  @IsEnum(DocumentTypeEnum)
  @IsNotEmpty()
  documentType: DocumentTypeEnum;
}
