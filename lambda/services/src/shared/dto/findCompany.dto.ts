import {
    ApiProperty,
  } from "@nestjs/swagger";
  import {
      IsArray,
    IsInt,
  } from "class-validator";
  
  export class FindCompanyQueryDto {
    @ApiProperty()
    @IsArray()
    @IsInt({ each: true })
    companyIds: number[];
  }
  