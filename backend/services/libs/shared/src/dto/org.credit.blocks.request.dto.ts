import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsPositive } from "class-validator";
import { QueryDto } from "./query.dto";

// Request body for POST /national/creditTransactionsManagement/orgCreditBlocks.
// Extends QueryDto (page/size/filterAnd/sort) so the per-org interactions table
// gets standard server-side pagination/sort, and adds the required
// organizationId whose interactions are being queried (a Project Developer is
// forced to their own company regardless of the value sent).
export class OrgCreditBlocksRequestDto extends QueryDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsPositive()
  @IsInt()
  @Type(() => Number)
  organizationId: number;
}
