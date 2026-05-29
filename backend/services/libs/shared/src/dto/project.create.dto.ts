import { ApiProperty } from "@nestjs/swagger";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
} from "class-validator";
import { InfSectorEnum } from "../enum/inf.sector.enum";
import { InfSectoralScopeEnum } from "../enum/inf.sectoral.scope.enum";

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

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(InfSectoralScopeEnum)
  sectoralScope: InfSectoralScopeEnum;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(InfSectorEnum)
  sector: InfSectorEnum;

  additionalDocuments?: any[];
}
