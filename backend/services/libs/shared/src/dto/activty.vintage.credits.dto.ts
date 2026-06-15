import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  isPositive,
  IsString,
  Matches,
} from "class-validator";

export class ActivityVintageCreditsDto {
  @IsString()
  @IsNotEmpty()
  // Dec 2/CMA.3 annex para 23(j) requires a vintage per ITMO. Constrain it to a
  // 4-digit calendar year so AEF/credit-block vintage columns can't be free text.
  @Matches(/^\d{4}$/, { message: "vintage must be a 4-digit year (YYYY)" })
  vintage: string;

  @IsInt()
  @IsNotEmpty()
  @IsPositive()
  creditAmount: number;
}
