import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { KgLinkerService } from './kg-linker.service';
import { KgLinkerController } from './kg-linker.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [KgLinkerController],
  providers: [KgLinkerService],
  exports: [KgLinkerService],
})
export class AtlasKgModule {}
