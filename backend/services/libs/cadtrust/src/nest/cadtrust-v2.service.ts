/**
 * Optional NestJS wrapper.
 *
 * The client itself is framework-free by design — this file exists only so that
 * code inside this repo can inject it the way it injects everything else, reading
 * the node URL and API key from `ConfigService` instead of threading them through
 * by hand. A non-Nest consumer should ignore this directory entirely and call
 * `createCadTrustClient` directly.
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CadTrustClient, createCadTrustClient } from '../client';

@Injectable()
export class CadTrustV2Service {
  private readonly client: CadTrustClient;
  /**
   * Mirrors the `CADT_V2_ENABLE` flag. This service does not gate calls on it —
   * silently no-op'ing a sync is how the v1 client hides failures. Callers should
   * check this and decide, so a disabled integration is visible in their code.
   */
  readonly enabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    this.enabled = this.configService.get<boolean>('cadTrustV2.enable') === true;

    this.client = createCadTrustClient({
      baseUrl: this.configService.get<string>('cadTrustV2.baseUrl'),
      apiKey: this.configService.get<string>('cadTrustV2.apiKey'),
      timeoutMs: this.configService.get<number>('cadTrustV2.timeoutMs'),
      logger: {
        log: (message, ...meta) => this.logger.debug(message, ...(meta as string[])),
        error: (message, ...meta) => this.logger.error(message, ...(meta as string[])),
      },
    });
  }

  /** The typed CAD Trust v2 client, pointed at the node this environment is configured for. */
  getClient(): CadTrustClient {
    return this.client;
  }
}
