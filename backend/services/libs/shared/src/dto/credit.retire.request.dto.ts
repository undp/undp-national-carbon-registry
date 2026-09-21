import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsPositive,
  IsEnum,
  IsString,
  IsNotEmpty,
  IsOptional,
} from "class-validator";
import { CreditTransactionSubTypesEnum } from "../enum/credit.transaction.sub.types.enum";

export class CreditRetireRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  blockId: string;

  @ApiProperty()
  @IsPositive()
  @IsInt()
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({ enum: CreditTransactionSubTypesEnum })
  @IsEnum(CreditTransactionSubTypesEnum)
  @IsNotEmpty()
  subType: CreditTransactionSubTypesEnum;

  // Destination counterparty country for an ITMO first-transfer
  // retirement (FIRST_TRANSFER_TOWARDS_NDC / FIRST_TRANSFER_FOR_OIMP).
  // Only required when the block's cooperative approach has more than
  // one counterparty party — the service resolves and validates it; a
  // single-counterparty CA is stamped automatically. Ignored for MO
  // blocks / other subtypes.
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  // Authorized entity the ITMOs are used for — required for
  // FIRST_TRANSFER_FOR_OIMP, validated against the block's cooperative
  // approach's Active authorized entities in the service.
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  authorizedEntityId?: string;
}
