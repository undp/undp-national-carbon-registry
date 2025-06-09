import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  max,
} from "class-validator";
import { CompanyRole } from "../enum/company.role.enum";
import { GovDepartment } from "../enum/govDep.enum";
import { Ministry } from "../enum/ministry.enum";

export class OrganisationUpdateDto {
  @IsNotEmpty()
  @ApiProperty()
  companyId: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  name: string;

  @ValidateIf(
    (c) => ![CompanyRole.GOVERNMENT, CompanyRole.API, CompanyRole.MINISTRY].includes(c.companyRole)
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

  @ValidateIf((c) => [CompanyRole.GOVERNMENT, CompanyRole.MINISTRY].includes(c.companyRole))
  @ApiProperty({ enum: GovDepartment })
  @IsNotEmpty()
  @IsEnum(GovDepartment, {
      message: 'Invalid Government Department. Supported following Departments:' + Object.values(GovDepartment)
  })
  govDep: GovDepartment;
  
  @ValidateIf((c) => [CompanyRole.GOVERNMENT, CompanyRole.MINISTRY].includes(c.companyRole))
  @ApiProperty({ enum: Ministry })
  @IsNotEmpty()
  @IsEnum(Ministry, {
      message: 'Invalid sector. Supported following sector:' + Object.values(Ministry)
  })
  ministry: Ministry;  

  @IsNotEmpty()
  @ApiProperty({ enum: CompanyRole })
  @IsEnum(CompanyRole, {
    message:
      "Invalid role. Supported following roles:" + Object.values(CompanyRole),
  })
  companyRole: CompanyRole;

  @ApiPropertyOptional()
  @IsArray()
  @ArrayMinSize(1)
  @MaxLength(100, { each: true })
  @IsNotEmpty({ each: true })
  @IsOptional()
  regions: string[];

  geographicalLocationCordintes?: any

  @ValidateIf(
    (c) => CompanyRole.GOVERNMENT==c.companyRole
  )
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  @Min(0)
  @Max(99)
  @ApiProperty()
  omgePercentage: number;

  @ValidateIf(
    (c) => CompanyRole.GOVERNMENT==c.companyRole
  )
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  @Min(0)
  @Max(99)
  @ApiProperty()
  nationalSopValue: number;
}
