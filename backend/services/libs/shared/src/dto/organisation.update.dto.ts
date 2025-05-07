import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from "class-validator";
import { CompanyRole } from "../enum/company.role.enum";
import { GovDepartment } from "../enum/govDep.enum";
import { Ministry } from "../enum/ministry.enum";
import { IsValidProvince } from "../decorators/validProvince.decorator";

export class OrganisationUpdateDto {
  @IsNotEmpty()
  @ApiProperty()
  companyId: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  name: string;

  @ValidateIf(
    (c) =>
      ![
        CompanyRole.DESIGNATED_NATIONAL_AUTHORITY,
        CompanyRole.API,
        CompanyRole.MINISTRY,
      ].includes(c.companyRole)
  )
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  taxId: string;

  @ValidateIf(
    (c) =>
      ![CompanyRole.DESIGNATED_NATIONAL_AUTHORITY, CompanyRole.API].includes(
        c.companyRole
      )
  )
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;

  @ValidateIf(
    (c) =>
      ![
        CompanyRole.DESIGNATED_NATIONAL_AUTHORITY,
        CompanyRole.API,
        CompanyRole.MINISTRY,
      ].includes(c.companyRole)
  )
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  paymentId: string;

  @ValidateIf(
    (c) =>
      ![CompanyRole.DESIGNATED_NATIONAL_AUTHORITY, CompanyRole.API].includes(
        c.companyRole
      )
  )
  @IsUrl()
  @IsOptional()
  @ApiPropertyOptional()
  website: string;

  @ValidateIf((c) => c.logo)
  @ApiPropertyOptional()
  @MaxLength(1048576, { message: "Logo cannot exceed 1MB" })
  logo: string;

  @ValidateIf(
    (c) =>
      ![CompanyRole.DESIGNATED_NATIONAL_AUTHORITY, CompanyRole.API].includes(
        c.companyRole
      )
  )
  @IsString()
  @ApiPropertyOptional()
  @IsPhoneNumber(null)
  phoneNo: string;

  @IsString()
  @ApiPropertyOptional()
  @IsOptional()
  @IsPhoneNumber(null)
  faxNo: string;

  @ValidateIf(
    (c) =>
      ![CompanyRole.DESIGNATED_NATIONAL_AUTHORITY, CompanyRole.API].includes(
        c.companyRole
      )
  )
  @IsString()
  @ApiProperty()
  address: string;

  @ValidateIf((c) => [CompanyRole.MINISTRY].includes(c.companyRole))
  @ApiProperty({ enum: GovDepartment })
  @IsNotEmpty()
  @IsEnum(GovDepartment, {
    message:
      "Invalid Government Department. Supported following Departments:" +
      Object.values(GovDepartment),
  })
  govDep: GovDepartment;

  @ValidateIf((c) => [CompanyRole.MINISTRY].includes(c.companyRole))
  @ApiProperty({ enum: Ministry })
  @IsNotEmpty()
  @IsEnum(Ministry, {
    message:
      "Invalid ministry. Supported following ministry:" +
      Object.values(Ministry),
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

  @ApiPropertyOptional()
  @IsArray()
  @MaxLength(100, { each: true })
  @IsValidProvince()
  @IsNotEmpty({ each: true })
  @IsOptional()
  provinces: string[];

  geographicalLocationCordintes?: any;

  // @ValidateIf((c) => CompanyRole.DESIGNATED_NATIONAL_AUTHORITY == c.companyRole)
  // @IsNotEmpty()
  // @IsNumber()
  // @IsInt()
  // @Min(0)
  // @Max(99)
  // @ApiProperty()
  omgePercentage: number;

  // @ValidateIf((c) => CompanyRole.DESIGNATED_NATIONAL_AUTHORITY == c.companyRole)
  // @IsNotEmpty()
  // @IsNumber()
  // @IsInt()
  // @Min(0)
  // @Max(99)
  // @ApiProperty()
  nationalSopValue: number;
}
