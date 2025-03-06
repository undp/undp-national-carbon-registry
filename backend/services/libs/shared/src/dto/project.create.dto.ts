import { ApiProperty } from "@nestjs/swagger";
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
} from "class-validator";

export class ProjectCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty({ each: true })
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(1)
  independentCertifiers: number[];

  additionalDocuments?: any[];
}
