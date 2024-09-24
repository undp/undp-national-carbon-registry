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
import { SectoralScope } from "@undp/serial-number-gen";
import { CompanyState } from "../enum/company.state.enum";
import { GovDepartment } from "../enum/govDep.enum";
import { Ministry } from "../enum/ministry.enum";

export class OrganisationDto {
  companyId: number;

  @ValidateIf(
    (c) => ![CompanyRole.GOVERNMENT, CompanyRole.API, CompanyRole.MINISTRY].includes(c.companyRole)
  )
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  taxId: string;

  @ValidateIf(
    (c) => ![CompanyRole.GOVERNMENT, CompanyRole.API, CompanyRole.MINISTRY].includes(c.companyRole)
  )
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  paymentId: string;

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

  @ValidateIf((c) => c.companyRole === CompanyRole.MINISTRY)
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  nameOfMinister: string;

  @ValidateIf((c) => c.companyRole === CompanyRole.MINISTRY)
  @ApiProperty({ enum: GovDepartment })
  @IsNotEmpty()
  @IsEnum(GovDepartment, {
      message: 'Invalid Government Department. Supported following Departments:' + Object.values(GovDepartment)
  })
  govDep: GovDepartment;

  @ValidateIf((c) => c.companyRole === CompanyRole.MINISTRY)
  @ApiProperty({ enum: Ministry })
  @IsNotEmpty()
  @IsEnum(Ministry, {
      message: 'Invalid sector. Supported following sector:' + Object.values(Ministry)
  })
  ministry: Ministry;  

  @ValidateIf((c) => c.companyRole === CompanyRole.MINISTRY)
  @IsArray()
  @ArrayMinSize(1)
  @MaxLength(100, { each: true })
  @IsNotEmpty({ each: true })
  @IsEnum(SectoralScope, {
      each: true,
      message: 'Invalid sectoral scope. Supported following sectoral scope:' + Object.values(SectoralScope)
  })
  @ApiProperty({
    type: [String],
    enum: Object.values(SectoralScope),
  })
  sectoralScope: SectoralScope[];

  createdTime: number;

  geographicalLocationCordintes?: any;

  @IsOptional()
  @IsEnum(CompanyState, {
    message:
      "Invalid state. Supported following roles:" + Object.values(CompanyState),
  })
  state: CompanyState;
}
