import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsNotEmptyObject, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ProjectProposalContentDto } from "./projectProposalContent.dto";

export class ProjectProposalDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  programmeId: string;

  @ApiProperty()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ProjectProposalContentDto)
  content: ProjectProposalContentDto;
}
