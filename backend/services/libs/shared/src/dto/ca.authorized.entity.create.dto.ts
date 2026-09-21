import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { IsValidCountry } from "../decorators/validcountry.decorator";

// Field set shared by the two ways an authorized entity is created:
// nested inside CooperativeApproachCreateDto, and standalone through
// POST /cooperativeApproach/authorizedEntity/add. The nested form has
// no cooperativeApproachId — the approach is the one being created.
export class CaAuthorizedEntityDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  entityName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityIdentifier?: string;

  // Country the authorized entity is incorporated in — must be one of
  // the cooperative approach's participatingParties (validated in the
  // service, which knows the specific CA). authorizingParty is not
  // client-supplied; it's derived server-side from the host party.
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsValidCountry()
  countryOfIncorporation: string;

  // Mandatory: this is the AEF Table 5 authorization date (see
  // aef-authorized-entity.mapper.ts). Not-future-dated is enforced in
  // buildAuthorizedEntity, which knows "now" — a decorator can't.
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  authorizationDate: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  authorizationReference?: string;
}

export class CaAuthorizedEntityCreateDto extends CaAuthorizedEntityDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  cooperativeApproachId: string;
}
