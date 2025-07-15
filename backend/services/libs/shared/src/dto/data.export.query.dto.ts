import {
    ApiPropertyOptional,
    getSchemaPath,
  } from "@nestjs/swagger";
  import { Type } from "class-transformer";
  import {
    IsOptional,
    ValidateNested,
  } from "class-validator";
  import { FilterEntry } from "./filter.entry";
  import { SortEntry } from "./sort.entry";
  import { FilterBy } from "./filter.by";
  
  export class DataExportQueryDto {
  
    @ApiPropertyOptional({
      type: "array",
      example: [{ key: "age", operation: "gt", value: 25 }],
      items: {
        $ref: getSchemaPath(FilterEntry),
      },
    })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => FilterEntry)
    filterAnd: FilterEntry[];
  
    @ApiPropertyOptional({
      type: "array",
      example: [{ key: "age", operation: "gt", value: 25 }],
      items: {
        $ref: getSchemaPath(FilterEntry),
      },
    })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => FilterEntry)
    filterOr: FilterEntry[];
  
    @ApiPropertyOptional({
      type: "object",
      example: { key: "name", order: "asc" },
      items: {
        $ref: getSchemaPath(SortEntry),
      },
    })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => SortEntry)
    sort: SortEntry;
  
    @ApiPropertyOptional({
      type: "object",
      example: { key: "ministryLevel", values: ['1', '2'] },
      items: {
        $ref: getSchemaPath(FilterBy),
      },
    })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => FilterBy)
    filterBy: FilterBy;
  }
  