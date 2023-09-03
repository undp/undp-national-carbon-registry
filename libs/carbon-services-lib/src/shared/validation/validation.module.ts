import { Module } from '@nestjs/common';
import { TrimPipe } from './trim-pipe.transform';

@Module({
  providers: [TrimPipe],
  exports: [TrimPipe]
})
export class ValidationModule {}
