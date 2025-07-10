import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";
import { CreditCalculationProperties } from "./credit.calculation.properties";

export class StovesHousesInNamibiaProperties extends CreditCalculationProperties{
    
    @ApiProperty()
    @IsNotEmpty()
    @IsPositive()
    @IsNumber()
    numberOfDays: number;

    @ApiProperty()
    @IsNotEmpty()
    @IsPositive()
    @IsNumber()
    numberOfPeopleInHousehold: number;

}