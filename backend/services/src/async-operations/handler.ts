import { NestFactory } from '@nestjs/core';
import { Handler, Context } from 'aws-lambda';
import { getLogger } from 'src/shared/server';
import { AsyncOperationsInterface } from './async-operations-interface.service';
import { AsyncOperationsModule } from './async-operations.module';

export const handler:Handler =async (event: any, context: Context) => {
    const app = await NestFactory.createApplicationContext(AsyncOperationsModule, {
        logger: getLogger(AsyncOperationsModule)
    });
    console.log('d1 call sendemail');
    await app.get(AsyncOperationsInterface).sendEmail(event);
}