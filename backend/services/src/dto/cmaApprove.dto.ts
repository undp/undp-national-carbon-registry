import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsNotEmptyObject, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { SiteVisitChecklistContentDto } from "./siteVisitChecklistContent.dto";

export class CMAApproveDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  programmeId: string;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => SiteVisitChecklistContentDto)
  content: SiteVisitChecklistContentDto;
}
