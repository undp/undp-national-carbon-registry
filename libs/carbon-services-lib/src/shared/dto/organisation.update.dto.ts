import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from "class-validator";
import { CompanyRole } from "../enum/company.role.enum";

export class OrganisationUpdateDto {
  @IsNotEmpty()
  @ApiProperty()
  companyId: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  name: string;

  @ValidateIf(
    (c) => ![CompanyRole.GOVERNMENT, CompanyRole.API].includes(c.companyRole)
  )
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  taxId: string;

  @ValidateIf(
    (c) => ![CompanyRole.GOVERNMENT, CompanyRole.API].includes(c.companyRole)
  )
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;

  @ValidateIf(
    (c) => ![CompanyRole.GOVERNMENT, CompanyRole.API].includes(c.companyRole)
  )
  @IsUrl()
  @IsOptional()
  @ApiPropertyOptional()
  website: string;

  @ValidateIf(
    (c) => c.logo
  )
  @ApiPropertyOptional()
  @MaxLength(1048576, { message: "Logo cannot exceed 1MB" })
  logo: string;

  @ValidateIf(
    (c) => ![CompanyRole.GOVERNMENT, CompanyRole.API].includes(c.companyRole)
  )
  @IsString()
  @ApiPropertyOptional()
  phoneNo: string;

  @ValidateIf(
    (c) => ![CompanyRole.GOVERNMENT, CompanyRole.API].includes(c.companyRole)
  )
  @IsString()
  @ApiPropertyOptional()
  address: string;

  @IsNotEmpty()
  @ApiProperty({ enum: CompanyRole })
  @IsEnum(CompanyRole, {
    message:
      "Invalid role. Supported following roles:" + Object.values(CompanyRole),
  })
  companyRole: CompanyRole;
}
