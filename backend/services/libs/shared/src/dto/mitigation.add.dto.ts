import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsNotEmptyObject, IsString, ValidateNested } from "class-validator";
import { MitigationProperties } from "./mitigation.properties";

export class MitigationAddDto {

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    externalId: string;

    @ApiProperty()
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => MitigationProperties)
    mitigation: MitigationProperties;
}