import {
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from "@nestjs/swagger";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { SectoralScope } from "@undp/serial-number-gen";
import { TypeOfMitigation } from "../enum/typeofmitigation.enum";
import { AgricultureProperties } from "./agriculture.properties";
import { SolarProperties } from "./solar.properties";
import { ProgrammeProperties } from "./programme.properties";
import { Sector } from "../enum/sector.enum";
import { Type } from "class-transformer";
import { MitigationProperties } from "./mitigation.properties";
import { NDCActionDto } from "./ndc.action.dto";
import { IsNumericLength } from "../decorators/validNumericLength.decorator";
import { IsNotPastDate } from "../decorators/isNotPastDate.decorator";
import { IsNotLesserThanStartDate } from "../decorators/isNotLesserThanStartDate.decorator";
import { ProjectCategory } from "../enum/projectCategory.enum";
import { ProjectGeography } from "../enum/projectGeography.enum";
import { ProjectStatus } from "../enum/projectStatus.enum";
import { ProjectProposalStage } from "../enum/projectProposalStage.enum";
import { CreditType } from "../enum/creditType.enum";
import { IsTwoDecimalPoints } from "../decorators/twoDecimalPointNumber.decorator";

export class ProgrammeSlDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ enum: ProjectCategory })
  @IsNotEmpty()
  @IsEnum(ProjectCategory, {
    message:
      "Invalid project category. Supported following project category:" +
      Object.values(ProjectCategory),
  })
  projectCategory: ProjectCategory;

  @ApiPropertyOptional()
  @ValidateIf((o) => o.projectCategory === ProjectCategory.OTHER)
  @IsNotEmpty()
  @IsString()
  otherProjectCategory?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  province: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  district: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  postalCode: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  streetName: string;

  @ApiProperty()
  @IsArray()
  geographicalLocationCoordinates: [];

  @ApiProperty({ enum: ProjectGeography })
  @IsNotEmpty()
  @IsEnum(ProjectGeography, {
    message:
      "Invalid project geography. Supported following project geography:" +
      Object.values(ProjectGeography),
  })
  projectGeography: ProjectGeography;

  @ApiPropertyOptional()
  @ValidateIf(
    (o) =>
      o.projectCategory === ProjectCategory.AFFORESTATION ||
      o.projectCategory === ProjectCategory.REFORESTATION
  )
  @IsArray()
  @IsNotEmpty({ each: true })
  @IsTwoDecimalPoints({ each: true })
  landExtent?: number[];

  @ApiPropertyOptional()
  @ValidateIf((o) => o.projectCategory === ProjectCategory.RENEWABLE_ENERGY)
  @IsString()
  proposedProjectCapacity?: string;

  @ApiPropertyOptional()
  @ValidateIf(
    (o) =>
      o.projectCategory === ProjectCategory.AFFORESTATION ||
      o.projectCategory === ProjectCategory.REFORESTATION
  )
  @IsString()
  speciesPlanted?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectDescription: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  additionalDocuments: [];

  @ApiProperty({ enum: ProjectStatus })
  @IsNotEmpty()
  @IsEnum(ProjectStatus, {
    message:
      "Invalid project status. Supported following project status:" +
      Object.values(ProjectStatus),
  })
  projectStatus: ProjectStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectStatusDescription?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  @IsNotPastDate()
  startDate: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  independantCertifierId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectParticipant: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  telephone: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  fax: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  website: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  contactPerson: string;
}
