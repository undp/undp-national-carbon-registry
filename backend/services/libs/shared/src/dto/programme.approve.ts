import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsPositive, IsNumber, IsString, Length, IsOptional, Min, IsEnum } from "class-validator";
import { AuthorizationPurpose } from "../enum/authorization.purpose.enum";

export class ProgrammeApprove {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    programmeId: string;

    @ApiPropertyOptional()
    @IsNumber()
    @IsOptional()
    @Min(0)
    issueAmount: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    comment: string;

    // F4 (Dec 2/CMA.3 para 1, 23(d); 6/CMA.4 Annex "Purposes for
    // authorization"): the purpose for which ITMOs are authorized must be
    // recorded at authorization so it can be emitted in the AEF. Optional
    // here for backwards compatibility with non-Article-6 programmes.
    @ApiPropertyOptional({ enum: AuthorizationPurpose })
    @IsEnum(AuthorizationPurpose)
    @IsOptional()
    authorizationPurpose?: AuthorizationPurpose;
}