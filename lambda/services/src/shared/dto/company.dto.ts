import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsEnum, isNotEmpty, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, ValidateIf } from "class-validator";
import { Role } from "../casl/role.enum";
import { CompanyRole } from "../enum/company.role.enum";
import { IsValidCountry } from "../util/validcountry.decorator";

export class CompanyDto {

    @ValidateIf( c => ![CompanyRole.GOVERNMENT, CompanyRole.MRV].includes(c.companyRole))
    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    taxId: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    name: string;

    @ValidateIf( c => ![CompanyRole.GOVERNMENT, CompanyRole.MRV].includes(c.companyRole))
    @IsNotEmpty()
    @IsEmail()
    @ApiProperty()
    email: string;

    @ValidateIf( c => ![CompanyRole.GOVERNMENT, CompanyRole.MRV].includes(c.companyRole))
    @IsString()
    @ApiPropertyOptional()
    phoneNo: string;

    @ValidateIf( c => ![CompanyRole.GOVERNMENT, CompanyRole.MRV].includes(c.companyRole))
    @IsUrl()
    @IsOptional()
    @ApiPropertyOptional()
    website: string;

    @ValidateIf( c => ![CompanyRole.GOVERNMENT, CompanyRole.MRV].includes(c.companyRole))
    @IsString()
    @ApiPropertyOptional()
    address: string;

    @IsString()
    @ApiPropertyOptional()
    logo: string;

    @IsValidCountry()
    @ApiPropertyOptional()
    country: string;

    @IsNotEmpty()
    @ApiProperty({ enum: CompanyRole })
    @IsEnum(CompanyRole, {
        message: 'Invalid role. Supported following roles:' + Object.values(CompanyRole)
    })
    companyRole: CompanyRole;
}