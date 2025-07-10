import { ValidationError } from '@nestjs/common';

export class ValidationException {
	constructor(public errors: ValidationError[]) {}
}