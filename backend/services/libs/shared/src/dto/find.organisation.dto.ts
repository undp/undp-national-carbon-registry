import {
    ApiProperty,
  } from "@nestjs/swagger";
  import {
      IsArray,
    IsInt,
  } from "class-validator";
  
  export class FindOrganisationQueryDto {
    @ApiProperty()
    @IsArray()
    @IsInt({ each: true })
    companyIds: number[];
  }
  