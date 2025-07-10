import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, ValidationOptions, registerDecorator } from "class-validator";

@ValidatorConstraint({ name: 'isTwoDecimalPoints', async: false })
export class IsTwoDecimalPointsConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        // Check if the value is a number and has no more than two decimal points
        if (typeof value !== 'number') {
            return false;
        }
        const decimalPart = value.toString().split('.')[1];
        return !decimalPart || decimalPart.length <= 2;
    }

    defaultMessage(args: ValidationArguments) {
        return `${args.property} must be a number with at most two decimal points`;
    }
}

export function IsTwoDecimalPoints(validationOptions?: ValidationOptions) {
    return function (object: any, propertyName: string) {
        registerDecorator({
            name: 'isTwoDecimalPoints',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: IsTwoDecimalPointsConstraint,
        });
    };
}