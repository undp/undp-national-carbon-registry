import { ApiProperty } from "@nestjs/swagger";
import { DocumentStatus } from "../enum/document.status";
import { IsEnum, IsNotEmpty, IsObject, IsString } from "class-validator";

export class DocumentActionRequestDto {
  @ApiProperty({ type: "string" })
  @IsString()
  @IsNotEmpty()
  remarks: string;

  @ApiProperty({ enum: DocumentStatus })
  @IsEnum(DocumentStatus)
  @IsNotEmpty()
  action: DocumentStatus;

  @IsNotEmpty()
  @IsObject()
  @ApiProperty({ type: "object" })
  data?: Record<string, any>;
}
