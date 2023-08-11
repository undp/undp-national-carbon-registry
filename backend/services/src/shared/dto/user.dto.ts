import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { Role } from "carbon-services-lib";
import { OrganisationDto } from "./organisation.dto";
import MutuallyExclusive from "carbon-services-lib/shared/util/mutualexclusive.decorator";

export class UserDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsNotEmpty()
  @ApiProperty({ enum: Role })
  @IsEnum(Role, {
    message: "Invalid role. Supported following roles:" + Object.values(Role),
  })
  role: Role;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsOptional()
  phoneNo: string;

  @IsNotEmptyObject()
  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => OrganisationDto)
  @MutuallyExclusive("company")
  company: OrganisationDto;

  @IsNumber()
  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsOptional()
  @MutuallyExclusive("company")
  companyId: number;

  password: string;

  apiKey?: string;
}
