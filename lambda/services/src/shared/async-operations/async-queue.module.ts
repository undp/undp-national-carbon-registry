import { Module } from '@nestjs/common';
import { ASYNC_QUEUE_SERVICE } from './async-operations.interface';
import { SqsAsyncOperationsService } from './sqs-async-queue.service';

@Module({
    providers: [{
        useClass: SqsAsyncOperationsService,
        provide: ASYNC_QUEUE_SERVICE
    }],
    exports: [],
    imports: []
})
export class AsyncQueueModule {}
