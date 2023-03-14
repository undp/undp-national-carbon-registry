import { Module } from '@nestjs/common';
import { AsyncOperationsInterface } from './async-operations.interface';
import { AsyncOperationsQueueService } from './async-operations-queue.service';
 
@Module({
    providers: [{
        provide: AsyncOperationsInterface,
        useClass: AsyncOperationsQueueService
    }],
    exports: [AsyncOperationsInterface],
    imports: []
})
export class AsyncOperationsModule {}
