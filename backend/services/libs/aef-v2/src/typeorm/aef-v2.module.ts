import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

import { AEF_STORE } from '../store/aef-store.port';
import { AefTypeOrmStore } from './aef-typeorm.store';
import { AEF_V2_ENTITIES } from './entities';

/**
 * Optional NestJS wrapper.
 *
 * The rest of this library is framework-free; this module exists only so a Nest
 * host can inject the store the way it injects everything else. A non-Nest
 * consumer ignores this file and constructs {@link AefTypeOrmStore} directly.
 *
 * **Deliberately not registered in any global module.** Nothing consumes the AEF
 * store yet, and adding it to the application module graph before there is a
 * caller would be dead DI. Import it where it is needed.
 */
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature(AEF_V2_ENTITIES)],
  providers: [
    {
      provide: AEF_STORE,
      useFactory: (manager: EntityManager) => new AefTypeOrmStore(manager),
      inject: [EntityManager],
    },
  ],
  exports: [AEF_STORE, TypeOrmModule],
})
export class AefV2Module {}
