import { ApiProperty } from "@nestjs/swagger";
import { DocumentStatus } from "../enum/document.status";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
} from "class-validator";

export class DocumentActionRequestDto {
  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  @IsPositive()
  refId: number;

  @ApiProperty({ type: "string" })
  @IsString()
  @IsNotEmpty()
  remarks: string;

  @ApiProperty({ enum: DocumentStatus })
  @IsEnum(DocumentStatus)
  @IsNotEmpty()
  action: DocumentStatus;
}
