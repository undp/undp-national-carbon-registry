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
  IsIn,
  ValidateNested,
} from "class-validator";

export class RegionalProjectIdDto {
  @IsString()
  @IsNotEmpty()
  programmeId: string;
}

export class RegionalDemoLoginDto {
  @IsString()
  @IsIn(["gov_demo", "enterprise_demo", "finance_demo"])
  account: string;
}

export class RegionalDemoSwitchRoleDto {
  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsString()
  @IsIn(["GOVERNMENT", "ENTERPRISE", "FINANCE", "OPERATOR"])
  role: string;
}

export class RegionalDemoTransferToTradingDto {
  @IsString()
  @IsNotEmpty()
  holdingId: string;

  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class RegionalDemoTradingListingDto {
  @IsString()
  @IsNotEmpty()
  tradingHoldingId: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  unitPrice: number;
}

export class RegionalDemoTradingDealDto {
  @IsString()
  @IsNotEmpty()
  listingId: string;

  @IsString()
  @IsNotEmpty()
  buyerOrganizationId: string;

  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class RegionalDemoFinanceValuationDto {
  @IsString()
  @IsNotEmpty()
  enterpriseId: string;

  @IsString()
  @IsNotEmpty()
  assetId: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  unitPrice: number;

  @IsNumber()
  @IsPositive()
  discountFactor: number;
}

export class RegionalDemoFinanceApplicationDto {
  @IsString()
  @IsNotEmpty()
  enterpriseId: string;

  @IsString()
  @IsNotEmpty()
  valuationId: string;

  @IsNumber()
  @IsPositive()
  requestedAmount: number;

  @IsString()
  @IsNotEmpty()
  purpose: string;
}

export class RegionalDemoFinanceReviewDto {
  @IsString()
  @IsIn(["APPROVED", "REJECTED"])
  result: string;

  @IsString()
  @IsOptional()
  reviewerNote?: string;
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
