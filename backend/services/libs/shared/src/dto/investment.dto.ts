import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MIN,
  Min,
  ValidateIf,
} from 'class-validator';
import { Instrument } from '../enum/instrument.enum';
import { InvestmentType } from '../enum/investment.type';
import { InvestmentLevel } from '../enum/investment.level';
import { InvestmentStream } from '../enum/investment.stream';
import { ESGType } from '../enum/esg.type';
import { GuaranteePayback, InsurancePayback } from '../enum/investment.payback.enum';

export class InvestmentDto {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @ApiProperty()
  amount: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  nationalInvestmentId: number;

  @ApiPropertyOptional({ enum: Instrument, isArray: true })
  @ValidateIf(o=>(!o.nationalInvestmentId))
  @IsEnum(Instrument, {
    message:
      'Invalid instrument type. Supported following values:' +
      Object.values(Instrument),
    each: true,
  })
  @IsArray()
  instrument: Instrument[];

  @ApiPropertyOptional()
  @ValidateIf(o => (o.instrument && (o.instrument.indexOf(Instrument.LOAN) >= 0 || o.instrument.indexOf(Instrument.GUARANTEE)>= 0 || o.instrument.indexOf(Instrument.CONLOAN)>= 0 || o.instrument.indexOf(Instrument.NONCONLOAN)>= 0)))
  @IsNumber()
  @IsOptional()
  @IsNotEmpty()
  interestRate?: number;

  @ApiPropertyOptional()
  @ValidateIf(o => (o.instrument && o.instrument.indexOf(Instrument.RESULT_BASED) >= 0))

  @IsString()
  @IsNotEmpty()
  resultMetric?: string;

  @ApiPropertyOptional()
  @ValidateIf(o => (o.instrument && o.instrument.indexOf(Instrument.RESULT_BASED) >= 0))
  @IsNumber()
  @IsNotEmpty()
  paymentPerMetric?: number;

  @ApiPropertyOptional()
  @ValidateIf(o => (o.instrument && (o.instrument.indexOf(Instrument.CONLOAN) >= 0 || o.instrument.indexOf(Instrument.NONCONLOAN) >= 0)))
  @IsNumber()
  @IsNotEmpty()
  startOfPayback?: number;

  @ApiPropertyOptional({ enum: GuaranteePayback })
  @IsEnum(GuaranteePayback, {
      message: 'Invalid type. Supported following values:' + Object.values(GuaranteePayback)
  })
  @ValidateIf(o => (o.instrument && o.instrument.indexOf(Instrument.GUARANTEE) >= 0))
  @IsNotEmpty()
  guaranteePayback?: GuaranteePayback;

  @ApiPropertyOptional({ enum: InsurancePayback })
  @IsEnum(InsurancePayback, {
      message: 'Invalid type. Supported following values:' + Object.values(InsurancePayback)
  })
  @ValidateIf(o => (o.instrument && o.instrument.indexOf(Instrument.INSURANCE) >= 0))
  @IsNotEmpty()
  insurancePayback?: InsurancePayback;

  @ApiPropertyOptional({isArray:true})
  @ValidateIf(o => (o.instrument && (o.instrument.indexOf(Instrument.GUARANTEE) >= 0 || o.instrument.indexOf(Instrument.CONLOAN) >= 0 || o.instrument.indexOf(Instrument.NONCONLOAN) >= 0)))
  @IsArray()
  @IsInt({ each: true })
  period?:number[]


  @ApiPropertyOptional()
  @ValidateIf(
    (o) => o.instrument && o.instrument.indexOf(Instrument.OTHER) >= 0,
  )
  @IsString()
  @IsNotEmpty()
  comments?: string;

  @ApiPropertyOptional({ enum: InvestmentType })
  @IsEnum(InvestmentType, {
    message:
      'Invalid type. Supported following values:' +
      Object.values(InvestmentType),
  })
  @IsOptional()
  type: InvestmentType;

  @ApiPropertyOptional({ enum: InvestmentLevel })
  @IsEnum(InvestmentLevel, {
    message:
      'Invalid level. Supported following values:' +
      Object.values(InvestmentLevel),
  })
  @IsOptional()
  level: InvestmentLevel;

  @ApiPropertyOptional({ enum: InvestmentStream })
  @IsEnum(InvestmentStream, {
    message:
      'Invalid stream. Supported following values:' +
      Object.values(InvestmentStream),
  })
  @IsOptional()
  stream: InvestmentStream;

  @ApiPropertyOptional({ enum: ESGType })
  @IsEnum(ESGType, {
    message:
      'Invalid esg type. Supported following values:' + Object.values(ESGType),
  })
  @IsOptional()
  esgClassification: ESGType;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  toCompanyId: number;

}
