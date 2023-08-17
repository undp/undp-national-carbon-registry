import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  ArrayMinSize,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from "class-validator";
import { Role } from "../casl/role.enum";
import { CompanyRole } from "../enum/company.role.enum";
import { IsValidCountry } from "../util/validcountry.decorator";

export class OrganisationDto {
  companyId: number;

  @ValidateIf(
    (c) => ![CompanyRole.GOVERNMENT, CompanyRole.API].includes(c.companyRole)
  )
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  taxId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  name: string;

  @ValidateIf(
    (c) => ![CompanyRole.GOVERNMENT, CompanyRole.API].includes(c.companyRole)
  )
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  @IsArray()
  @ArrayMinSize(1)
  @MaxLength(100, { each: true })
  @IsNotEmpty({ each: true })
  @IsOptional()
  regions: string[];
  
  @ValidateIf(
    (c) => ![CompanyRole.GOVERNMENT, CompanyRole.API].includes(c.companyRole)
  )
  @IsNotEmpty()
  @IsString()
  @ApiPropertyOptional()
  phoneNo: string;

  @ValidateIf(
    (c) => ![CompanyRole.GOVERNMENT, CompanyRole.API].includes(c.companyRole)
  )
  @IsNotEmpty()
  @IsUrl()
  @IsOptional()
  @ApiPropertyOptional()
  website: string;

  @ValidateIf(
    (c) => ![CompanyRole.GOVERNMENT, CompanyRole.API].includes(c.companyRole)
  )
  @IsNotEmpty()
  @IsString()
  @ApiPropertyOptional()
  address: string;

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @MaxLength(1048576, { message: "Logo cannot exceed 1MB" })
  logo: string;

  @IsValidCountry()
  @IsOptional()
  @ApiPropertyOptional()
  country: string;

  @IsNotEmpty()
  @ApiProperty({ enum: CompanyRole })
  @IsEnum(CompanyRole, {
    message:
      "Invalid role. Supported following roles:" + Object.values(CompanyRole),
  })
  companyRole: CompanyRole;

  createdTime: number;

  geographicalLocationCordintes?: any
}
