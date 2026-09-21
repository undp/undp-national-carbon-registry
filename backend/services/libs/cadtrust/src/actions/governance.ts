/**
 * Governance reads — in practice, picklists.
 *
 * The interfaces package types every picklist-governed field as `string` rather
 * than a hardcoded union, precisely because those values change over time via
 * CAD Trust's Technical Committee change-request process. This is the endpoint
 * that closes that loop: fetch current values once per sync run and validate
 * against them. Choosing what to do with a value that is not in the list is
 * adaptor business logic, not this package's.
 */

import { CadTrustContext } from '../config';
import { request } from '../http/request';
import type { PickListResponse } from '../interfaces/actions/governance';

export interface GovernanceClient {
  /** `GET /governance/meta/pickList` — the authoritative, live picklist values. */
  getPickList(): Promise<PickListResponse>;
}

export function createGovernanceClient(ctx: CadTrustContext): GovernanceClient {
  return {
    getPickList() {
      return request<PickListResponse>(ctx, { method: 'GET', path: '/governance/meta/pickList' });
    },
  };
}
