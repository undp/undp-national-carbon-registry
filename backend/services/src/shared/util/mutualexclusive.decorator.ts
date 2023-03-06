import {registerDecorator, ValidationOptions, ValidationArguments} from "class-validator";

const META_KEY = (tag) => `custom:__@rst/validator_mutually_exclusive_${tag}__`;

export default function MutuallyExclusive(tag: string = 'default', validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        const key = META_KEY(tag);
        const existing = Reflect.getMetadata(key, object) || [];

        Reflect.defineMetadata(key, [...existing, propertyName], object);

        registerDecorator({
            name: "MutuallyExclusive",
            target: object.constructor,
            propertyName: propertyName,
            constraints: [tag],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const mutuallyExclusiveProps: Array<string> = Reflect.getMetadata(key, args.object);
                    return mutuallyExclusiveProps.reduce((p, c) => args.object[c] !== undefined ? ++p : p, 0) === 1;
                },
                defaultMessage(validationArguments?: ValidationArguments) {
                    const mutuallyExclusiveProps: Array<string> = Reflect.getMetadata(key, validationArguments.object);
                    return `Following properties are mutually exclusive: ${mutuallyExclusiveProps.join(', ')}`;
                }
            }
        });
    };
}