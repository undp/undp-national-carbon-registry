import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class OrganisationSuspendDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    remarks: string;
}