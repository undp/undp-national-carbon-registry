import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class OrganisationDuplicateCheckDto {
    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    taxId?: string;
  
    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    paymentId?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    email?: string;
}