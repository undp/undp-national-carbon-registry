import {
	ExceptionFilter,
	Catch,
	ArgumentsHost,
	BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationException } from './validation.exception';

@Catch(ValidationException)
export class ValidationExceptionFilter implements ExceptionFilter {

	catch(exception: ValidationException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const baseException = new BadRequestException();

		let message = "Bad request";

		console.log(JSON.stringify(exception))
		// Custom exception handling, to provide rich error message
		if (exception.errors.length == 2 && exception.errors[0].constraints && exception.errors[1].constraints && exception.errors.filter(e => !!e.constraints['isNotEmpty']).length == 2) {
			message = exception.errors.map(e => e.property).join(' and ') + ' should not be empty'
		}
		else if (exception.errors.length > 0 && exception.errors[0].constraints) {
			const erList = Object.values(exception.errors[0].constraints)
			if (erList.length > 0) {
				message = erList[0]
			}
		}

		response.status(baseException.getStatus()).json({
			statusCode: baseException.getStatus(),
			message: message,
			errors: exception.errors.map((error) => {
				let resp = {};
				if (error.constraints) {
					resp = {
						[error.property]: Object.values(error.constraints),
					}
				}
				if (error.children) {
					error.children.forEach((er_child) => {
						if (er_child.constraints) {
							resp[error.property + '.' + er_child.property] = Object.values(er_child.constraints);
						}
					});
				}
				return resp
			}),
		});
	}
}