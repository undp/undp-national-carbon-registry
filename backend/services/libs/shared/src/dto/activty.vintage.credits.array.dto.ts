import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { ActivityVintageCreditsDto } from "./activty.vintage.credits.dto";
import { Type } from "class-transformer";

export class ActivityVintageCreditsArrayDto {
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ActivityVintageCreditsDto)
  vintageCreditArray: ActivityVintageCreditsDto[];
}
