import { Module } from '@nestjs/common';
import { AsyncOperationsInterface } from './async-operations.interface';
import { SqsAsyncOperationsService } from './sqs-async-queue.service';

@Module({
    providers: [{
        provide: AsyncOperationsInterface,
        useClass: SqsAsyncOperationsService
    }],
    exports: [AsyncOperationsInterface],
    imports: []
})
export class AsyncQueueModule {}
