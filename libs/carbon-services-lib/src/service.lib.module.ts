import { Module } from '@nestjs/common';
import { ServiceLibService } from './service.lib.service';

@Module({
  imports: [],
  controllers: [],
  providers: [ServiceLibService],
})
export class ServiceLibModule {}
