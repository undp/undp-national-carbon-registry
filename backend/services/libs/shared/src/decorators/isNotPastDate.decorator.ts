import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsNotPastDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsNotPastDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const incomingTime = value * 1000;//convert epoch time to ms

          const today = new Date();
          const startOfValidationTime = today.getTime() - 24 * 60 * 60 * 1000;

          if (incomingTime >= startOfValidationTime) {
            return true;
          }
          return false;
        },
        defaultMessage(args: ValidationArguments) {
          return '$property is not a valid date';
        },
      },
    });
  };
}
