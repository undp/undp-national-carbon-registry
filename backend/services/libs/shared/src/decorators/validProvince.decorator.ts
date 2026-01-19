import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";
import { Injectable } from "@nestjs/common";
import { ProvinceService } from "../util/province.service";

@ValidatorConstraint({ name: "IsValidProvince", async: true })
@Injectable()
export class IsValidProvinceConstraint implements ValidatorConstraintInterface {
  constructor(protected readonly provinceService: ProvinceService) {}

  validate(provinces: any, args: ValidationArguments) {
    return this.provinceService.isValidProvince(provinces);
  }

  defaultMessage(): string {
    return `Each province must be valid`;
  }
}

export function IsValidProvince(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidProvinceConstraint,
    });
  };
}
