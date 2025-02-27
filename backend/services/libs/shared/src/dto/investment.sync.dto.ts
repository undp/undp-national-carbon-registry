import { ApiProperty } from "@nestjs/swagger"
import { IsInt, IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator"

export class InvestmentSyncDto{
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    investorTaxId:string

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    amount:number

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    @IsInt()
    @IsPositive()
    requestId:number

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    txRef:string
}