import { ApiProperty } from "@nestjs/swagger";
import { DocumentStatus } from "../enum/document.status";
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";

export class DocumentActionRequestDto {
  @ApiProperty({ type: "string" })
  @IsString()
  @IsNotEmpty()
  remarks: string;

  @ApiProperty({ enum: DocumentStatus })
  @IsEnum(DocumentStatus)
  @IsNotEmpty()
  action: DocumentStatus;

  @IsOptional() //TODO need to remove later
  @IsObject()
  @ApiProperty({ type: "object" })
  data?: Record<string, any>;
}
