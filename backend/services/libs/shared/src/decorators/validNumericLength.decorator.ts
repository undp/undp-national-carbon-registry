import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, ValidationOptions, registerDecorator } from 'class-validator';

@ValidatorConstraint({ name: 'isNumericLength', async: false })
export class IsNumericLengthConstraint implements ValidatorConstraintInterface {
  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a numeric value with up to ${args.constraints[0]} digits before and ${args.constraints[1]} digits after the decimal point`;
  }

  validate(value: any, args: ValidationArguments): boolean {
    if (value === null || value === undefined) {
      return false; // Should not validate empty values to allow optional fields
    }
    const valueString = value.toString();
    const parts = valueString.split('.');
    const integerPart = parts[0].replace('-', '');
    const decimalPart = parts[1] || '';
    const maxIntegerDigits = args.constraints[0];
    const maxDecimalDigits = args.constraints[1];
    
    return integerPart.length <= maxIntegerDigits && decimalPart.length <= maxDecimalDigits;
  }
}

export function IsNumericLength(maxIntegerDigits: number, maxDecimalDigits: number, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [maxIntegerDigits, maxDecimalDigits],
      validator: IsNumericLengthConstraint
    });
  };
}