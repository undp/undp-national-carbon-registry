/**
 * The client factory.
 *
 * `createCadTrustClient` is the only entry point a consumer needs. Everything it
 * returns is a plain object of typed functions — no framework, no DI container,
 * no global state — so an adaptor for any registry can construct one per CADT
 * node and be done.
 */

import { CadTrustClientConfig, CadTrustContext, resolveConfig } from './config';
import { GovernanceClient, createGovernanceClient } from './actions/governance';
import { OfferClient, createOfferClient } from './actions/offer';
import { OrganizationsClient, createOrganizationsClient } from './actions/organizations';
import { ProjectActionsClient, createProjectActionsClient } from './actions/project';
import { StagingClient, createStagingClient } from './actions/staging';
import { SystemClient, createSystemClient } from './actions/system';
import { UnitActionsClient, createUnitActionsClient } from './actions/unit';
import { CadTrustResources, createResources } from './resources/entities';

export interface CadTrustClient extends CadTrustResources {
  /** The resolved configuration this client is using. Useful for logging which node it talks to. */
  readonly context: CadTrustContext;

  /**
   * Staging and commit. Every mutation elsewhere on this client only stages;
   * `staging.commit()` is what publishes.
   */
  staging: StagingClient;
  /** Organization onboarding and management. */
  organizations: OrganizationsClient;
  /** Project transfer, CSV batch upload, XLSX import/export. */
  projectActions: ProjectActionsClient;
  /** Unit split, CSV batch upload, XLSX import/export. */
  unitActions: UnitActionsClient;
  /** Cross-registry ownership transfer via Chia offer files. */
  offer: OfferClient;
  /** Live picklist values. */
  governance: GovernanceClient;
  /** Health and diagnostics. */
  system: SystemClient;
}

/**
 * Builds a client for one CADT v2 node.
 *
 * ```ts
 * const client = createCadTrustClient({
 *   baseUrl: process.env.CADT_V2_BASE_URL,
 *   apiKey: process.env.CADT_V2_API_KEY,
 * });
 *
 * const staged = await client.project.stageCreate(input);  // private to this node
 * await client.staging.commit({ author: 'my-registry' });  // now public
 * ```
 */
export function createCadTrustClient(config: CadTrustClientConfig = {}): CadTrustClient {
  const ctx = resolveConfig(config);

  return {
    context: ctx,
    ...createResources(ctx),
    staging: createStagingClient(ctx),
    organizations: createOrganizationsClient(ctx),
    projectActions: createProjectActionsClient(ctx),
    unitActions: createUnitActionsClient(ctx),
    offer: createOfferClient(ctx),
    governance: createGovernanceClient(ctx),
    system: createSystemClient(ctx),
  };
}
