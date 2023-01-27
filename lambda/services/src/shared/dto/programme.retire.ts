import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Min } from "class-validator";
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
    @IsNumber({},{each: true})
    @Min(0, { each: true })
    @IsOptional()
    companyCredit: number[];

    // @ApiPropertyOptional()
    // @IsNotEmpty()
    // @IsNotEmpty()
    // @IsOptional()
    // toAccount: string;

    @ApiPropertyOptional()
    @IsNotEmpty()
    @IsNotEmpty()
    @IsOptional()
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
}