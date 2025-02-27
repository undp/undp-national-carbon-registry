import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsNotEmptyObject, IsNumber, IsOptional, IsPositive, IsString, Length, Max, Min, ValidateIf, ValidateNested } from "class-validator";
import { RetireType } from "../enum/retire.type.enum";
import { BasicOrgInfo } from "./basic.organisation.dto";

export class ProgrammeRetire {

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    programmeId: string;

    @ApiPropertyOptional()
    @IsArray()
    @IsInt({ each: true })
    @IsOptional()
    fromCompanyIds: number[];

    @ApiPropertyOptional()
    @IsArray()
    @Min(0, { each: true })
    @IsOptional()
    companyCredit: number[];

    // @ApiPropertyOptional()
    // @IsNotEmpty()
    // @IsNotEmpty()
    // @IsOptional()
    // toAccount: string;

    @ApiPropertyOptional()
    @ValidateIf(o => o.type === RetireType.CROSS_BORDER)
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => BasicOrgInfo)
    toCompanyMeta: BasicOrgInfo;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    comment: string;

    @ApiProperty({ enum: RetireType })
    @IsNotEmpty()
    @IsEnum(RetireType, {
        message: 'Invalid retire type. Supported following sector:' + Object.values(RetireType)
    })
    type: RetireType;

    @ApiPropertyOptional()
    @ValidateIf(o => o.type === RetireType.CROSS_BORDER)
    @IsNotEmpty()
    @IsNumber()
    @IsInt()
    @Min(0)
    @Max(99)
    omgePercentage: number;
}