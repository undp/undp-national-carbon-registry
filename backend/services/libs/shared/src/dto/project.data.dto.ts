import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
export class ProjectDataDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  data: string;
}
