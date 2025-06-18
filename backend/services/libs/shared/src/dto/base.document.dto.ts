import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
} from "class-validator";
import { DocumentTypeEnum } from "../enum/document.type.enum";

export class BaseDocumentDto {
  // @ApiProperty({ type: Number })
  // @IsOptional()
  // @IsNumber()
  // id?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @ValidateIf(
    (dto) => dto.documentType != DocumentTypeEnum.INITIAL_NOTIFICATION_FORM
  )
  projectRefId: string;

  // @ApiProperty({
  //   type: "string",
  // })
  // @IsNotEmpty()
  // name: string;

  // @ApiProperty({
  //   type: Number,
  // })
  // @IsNumber()
  // @IsOptional()
  // version?: number;

  @ApiProperty({
    enum: DocumentTypeEnum,
  })
  @IsEnum(DocumentTypeEnum)
  @IsNotEmpty()
  documentType: DocumentTypeEnum;

  @IsOptional()
  @IsString()
  activityRefId?: string;

  @ApiProperty({
    type: Object,
  })
  @IsOptional()
  @IsObject()
  data?: any;
}
