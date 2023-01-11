import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class CompanySuspendDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    remarks: string;
}