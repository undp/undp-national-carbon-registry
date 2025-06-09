import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  isPositive,
  IsString,
} from "class-validator";

export class ActivityVintageCreditsDto {
  @IsString()
  @IsNotEmpty()
  vintage: string;

  @IsInt()
  @IsNotEmpty()
  @IsPositive()
  creditAmount: number;
}
