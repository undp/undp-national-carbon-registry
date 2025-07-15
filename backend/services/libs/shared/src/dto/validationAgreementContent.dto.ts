import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from "class-validator";

export class ValidationAgreementContentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  dateOfIssue: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  climateFundDescription: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectParticipantDescription: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  definitions: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  whereasConditions: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  settlementFee: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  climateFundSignature: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectParticipantName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectParticipantSignature: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectParticipantSignatory: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  climateFundWitnessSignature: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  climateFundWitnessName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  climateFundWitnessDesignation: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectParticipantWitnessSignature: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectParticipantWitnessName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  projectParticipantWitnessDesignation: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  annexureAComment: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  annexureADoc: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  annexureBComment: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  annexureBDoc: string;
}
