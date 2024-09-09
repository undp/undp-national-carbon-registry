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
          const date = value * 1000;//Date.parse(value);
          const today = new Date();
          // Set the time to midnight (00:00:00)
          today.setHours(0, 0, 0, 0);
          // Get the timestamp for the start of today
          const startOfToday = today.getTime();

          console.log("startOfToday and incomingDate", startOfToday, date);

          if (date >= startOfToday) {
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
