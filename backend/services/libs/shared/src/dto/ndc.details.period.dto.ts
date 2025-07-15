
import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class NdcDetailsPeriodDto {

    @IsNotEmpty()
    @IsNumber()
    @ApiProperty()
    startYear: number;

    @IsNotEmpty()
    @IsNumber()
    @ApiProperty()
    endYear: number;

    @ApiPropertyOptional()
    @IsOptional()
    finalized: boolean
}
