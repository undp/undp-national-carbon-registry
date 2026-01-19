import { ApiProperty } from "@nestjs/swagger";
import { CompanyRole } from "../enum/company.role.enum";

export class GetOrganizationsRequest {
  @ApiProperty({ enum: CompanyRole })
  type: CompanyRole;
  @ApiProperty({ type: Boolean })
  filterOwn: boolean;
}
