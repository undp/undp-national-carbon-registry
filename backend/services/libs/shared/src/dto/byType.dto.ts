import { IsEnum, IsNotEmpty } from "class-validator";
import { CompanyRole } from "../enum/company.role.enum";
import { ApiProperty } from "@nestjs/swagger";

export class ByTypeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(CompanyRole, { message: "companyRole must be a valid enum value" })
  companyRole: CompanyRole;
}
