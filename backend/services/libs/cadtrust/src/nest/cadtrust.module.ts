import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CadTrustV2Service } from './cadtrust-v2.service';

/**
 * Import this module where a CAD Trust v2 client is needed.
 *
 * Deliberately NOT registered in `SharedModule`: nothing in this repo consumes
 * the v2 client yet, and adding it to the global module graph would be dead DI.
 * The future per-registry adaptor imports it directly.
 *
 * Unrelated to `CadtModule` (`libs/shared/src/cadt/`), which is the legacy v1
 * integration and is left untouched.
 */
@Module({
  imports: [ConfigModule],
  providers: [Logger, CadTrustV2Service],
  exports: [CadTrustV2Service],
})
export class CadTrustModule {}
