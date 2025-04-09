import { IsInt, IsNotEmpty, IsPositive } from "class-validator";

export class PositiveIntegerValidationDto {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  positiveInteger: number;
}
