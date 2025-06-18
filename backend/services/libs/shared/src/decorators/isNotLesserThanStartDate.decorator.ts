import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsNotLesserThanStartDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsNotLesserThanStartDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: number, args: ValidationArguments) {
          const obj = args.object as any;
          return typeof value === 'number' && typeof obj.startTime === 'number' && value > obj.startTime;      
        },
        defaultMessage(args: ValidationArguments) {
          return '$property is invalid';
        },
      },
    });
  };
}
