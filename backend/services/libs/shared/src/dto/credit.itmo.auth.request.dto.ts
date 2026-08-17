import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from "class-validator";
import { AuthorizationPurpose } from "../enum/authorization.purpose.enum";

// Request to authorize (a portion of) a mitigation-outcome credit
// block as ITMOs. The cooperative approach / purpose fields are
// provisional — the concrete ITMO authorization data structure will be
// finalized in a later step (see ItmoAuthorizationData).
export class CreditItmoAuthRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  blockId: string;

  @ApiProperty()
  @IsPositive()
  @IsInt()
  @IsNotEmpty()
  amount: number;

  // The cooperative approach the ITMOs are authorized under — must be
  // an Active CA (validated in the service).
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  cooperativeApproachId: string;

  // Mandatory: AEF Table 2's PurposeForAuthorization is a required field
  // (aefT2AuthorizationsPurposesForAuthorization), so this can no longer be
  // left for the service to silently default to NDC — see
  // createItmoAuthRequest, which used to do exactly that.
  @ApiProperty({ enum: AuthorizationPurpose })
  @IsNotEmpty()
  @IsEnum(AuthorizationPurpose)
  authorizationPurpose: AuthorizationPurpose;

  // Feeds aefT2AuthorizationsAuthorizedTimeframe ("dddd - dddd"). Optional —
  // left blank when either is missing, same as every other optional AEF
  // field. Cross-field ordering (start <= end) is checked in the service.
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  authorizedTimeframeStartYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  authorizedTimeframeEndYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}
