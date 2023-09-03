import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class OwnershipUpdateDto {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    externalId: string;
    
    @ApiProperty()
    @IsNotEmpty({ each: true })
    @IsArray()
    @IsString({ each: true })
    @ArrayMinSize(1)
    proponentTaxVatId: string[];

    @ApiProperty()
    @IsNotEmpty({ each: true })
    @IsArray()
    @IsPositive({ each: true })
    @ArrayMinSize(1)
    proponentPercentage: number[];

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    ownerTaxId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    investorTaxId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    shareFromOwner: number;


}