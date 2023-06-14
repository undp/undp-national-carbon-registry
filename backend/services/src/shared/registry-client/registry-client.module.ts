import { Logger, Module } from '@nestjs/common';
import { RegistryClientService } from './registry-client.service';
import { ConfigModule } from '@nestjs/config';
import configuration from '../configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`.env.${process.env.NODE_ENV}`, `.env`],
    }),
  ],
  providers: [RegistryClientService, Logger],
  exports: [RegistryClientService]
})
export class RegistryClientModule {}
