import { Type } from "class-transformer";
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from "class-validator";

export class RegionalProjectIdDto {
  @IsString()
  @IsNotEmpty()
  programmeId: string;
}

export class RegionalIssueCreditsDto {
  @IsObject()
  activity: Record<string, any>;

  @IsArray()
  creditVerified: any[];

  @IsNumber()
  @IsPositive()
  companyId: number;

  @IsObject()
  document: Record<string, any>;

  @IsString()
  @IsNotEmpty()
  txRef: string;
}

export class RegionalOtcTradeTransferDto {
  @IsNumber()
  @IsPositive()
  senderId: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  receiverId?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  recieverId?: number;

  @IsString()
  @IsNotEmpty()
  projectRefId: string;

  @IsString()
  @IsNotEmpty()
  creditBlockId: string;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsNumber()
  @IsPositive()
  amount: number;
}

export class RegionalOtcTradeMarketDto {
  @IsNumber()
  @IsPositive()
  unitPrice: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  totalPrice?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  tradeTime?: Date;
}

export class RegionalOtcTradeExecuteDto {
  @ValidateNested()
  @Type(() => RegionalOtcTradeTransferDto)
  transfer: RegionalOtcTradeTransferDto;

  @ValidateNested()
  @Type(() => RegionalOtcTradeMarketDto)
  market: RegionalOtcTradeMarketDto;
}
