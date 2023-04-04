import { Injectable } from "@nestjs/common";
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from "class-validator";
import { CountryService } from "./country.service";

@ValidatorConstraint({ name: "isValidCountry", async: true })
@Injectable()
export class IsValidCountryConstraint implements ValidatorConstraintInterface {
  defaultMessage(): string {
    return "Country is invalid";
  }
  constructor(protected readonly countryService: CountryService) {}

  validate(alpha2Code: any, args: ValidationArguments) {
    return this.countryService.isValidCountry(alpha2Code);
  }
}

export function IsValidCountry(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidCountryConstraint,
    });
  };
}
