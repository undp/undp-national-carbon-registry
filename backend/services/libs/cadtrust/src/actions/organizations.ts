/**
 * Organization onboarding and management.
 *
 * "Organization" here is the CADT node's own identity on the network (its
 * `org_uid`), not a company record in the climate data model. Creating it is a
 * one-time prerequisite: none of the CRUD resources will accept a write until a
 * home organization exists.
 *
 * Every endpoint in the guide's `organizations` section has a concrete request
 * and response example, so all of them are implemented here — nothing was
 * skipped for lack of documentation.
 */

import { CadTrustContext } from '../config';
import { CadTrustOrgCreationFailedError, CadTrustTimeoutError } from '../http/errors';
import { FileUpload } from '../http/multipart';
import { request } from '../http/request';
import type { ApiResult } from '../interfaces/common';
import type {
  OrganizationAddMetadataInput,
  OrganizationCreateAcceptedResponse,
  OrganizationCreateInput,
  OrganizationCreationStatusResponse,
  OrganizationDeleteResponse,
  OrganizationEditInput,
  OrganizationImportInput,
  OrganizationListResponse,
  OrganizationMetadataResponse,
  OrganizationMirrorInput,
  OrganizationReclaimHomeInput,
  OrganizationResyncInput,
  OrganizationStatusResponse,
  OrganizationSubscribeInput,
  OrganizationUnsubscribeInput,
  OrganizationUpgradeInput,
} from '../interfaces/actions/organizations';

/** Options for {@link OrganizationsClient.waitForCreation}. */
export interface WaitForCreationOptions {
  /**
   * Give up after this long. Defaults to 35 minutes — the API's own message says
   * creation "can take up to 30 mins", so anything shorter will routinely time
   * out on a healthy node.
   */
  timeoutMs?: number;
  /** Defaults to 10s. Creation is measured in minutes; polling faster gains nothing. */
  pollIntervalMs?: number;
  /** Cancel the poll from outside. */
  signal?: AbortSignal;
  /** Called with every status snapshot, for progress reporting. */
  onProgress?: (status: OrganizationCreationStatusResponse) => void;
}

const DEFAULT_CREATION_TIMEOUT_MS = 35 * 60 * 1000;
const DEFAULT_CREATION_POLL_MS = 10_000;

export interface OrganizationsClient {
  /** `GET /organizations` — NOTE: returns a map keyed by org_uid, not an array. */
  list(): Promise<OrganizationListResponse>;
  /** `GET /organizations/status?orgUid=` */
  getStatus(orgUid: string): Promise<OrganizationStatusResponse>;
  /** `GET /organizations/creation-status` — also reports V1 -> V2 upgrade progress. */
  getCreationStatus(): Promise<OrganizationCreationStatusResponse>;
  /** `GET /organizations/metadata?orgUid=` */
  getMetadata(orgUid: string): Promise<OrganizationMetadataResponse>;

  /**
   * `POST /organizations` (JSON body) — returns as soon as the work is queued;
   * the organization is built in the background. Follow with {@link waitForCreation}.
   */
  create(input: OrganizationCreateInput): Promise<OrganizationCreateAcceptedResponse>;
  /** `POST /organizations` (multipart, field `file`) — the file-upload variant of create. */
  createFromFile(file: FileUpload): Promise<OrganizationCreateAcceptedResponse>;
  /** `POST /organizations/upgrade` — V1 -> V2. Body is optional; the node auto-detects the V1 home org. */
  upgrade(input?: OrganizationUpgradeInput): Promise<ApiResult>;
  /** `POST /organizations/metadata` */
  addMetadata(input: OrganizationAddMetadataInput): Promise<ApiResult>;
  /** `POST /organizations/sync` — no body. */
  sync(): Promise<ApiResult>;
  /** `POST /organizations/mirror` */
  addMirror(input: OrganizationMirrorInput): Promise<ApiResult>;
  /** `POST /organizations/remove-mirror` */
  removeMirror(input: OrganizationMirrorInput): Promise<ApiResult>;
  /**
   * `POST /organizations/reclaim-home` — promotes an existing non-home org to home.
   * A repair operation; the node runs exhaustive ownership checks before agreeing.
   */
  reclaimHome(input: OrganizationReclaimHomeInput): Promise<ApiResult>;

  /** `PUT /organizations/edit` (JSON body). */
  edit(input: OrganizationEditInput): Promise<ApiResult>;
  /** `PUT /organizations/edit` (multipart, field `file`). */
  editFromFile(file: FileUpload): Promise<ApiResult>;
  /** `PUT /organizations` — import/mirror another registry's organization from datalayer. */
  importOrganization(input: OrganizationImportInput): Promise<ApiResult>;
  /** `PUT /organizations/subscribe` */
  subscribe(input: OrganizationSubscribeInput): Promise<ApiResult>;
  /** `PUT /organizations/unsubscribe` */
  unsubscribe(input: OrganizationUnsubscribeInput): Promise<ApiResult>;
  /** `PUT /organizations/resync` */
  resync(input: OrganizationResyncInput): Promise<ApiResult>;

  /** `DELETE /organizations/{orgUid}` — local records + datalayer subscription only. */
  remove(orgUid: string): Promise<OrganizationDeleteResponse>;

  /**
   * Polls `creation-status` until creation (or a V1 -> V2 upgrade) settles.
   *
   * Resolves on state COMPLETE, or once the node reports nothing in progress.
   * Rejects with {@link CadTrustOrgCreationFailedError} on state FAILED and
   * {@link CadTrustTimeoutError} when `timeoutMs` elapses.
   */
  waitForCreation(options?: WaitForCreationOptions): Promise<OrganizationCreationStatusResponse>;
}

export function createOrganizationsClient(ctx: CadTrustContext): OrganizationsClient {
  const getCreationStatus = () =>
    request<OrganizationCreationStatusResponse>(ctx, {
      method: 'GET',
      path: '/organizations/creation-status',
    });

  return {
    list() {
      return request<OrganizationListResponse>(ctx, { method: 'GET', path: '/organizations' });
    },

    getStatus(orgUid) {
      return request<OrganizationStatusResponse>(ctx, {
        method: 'GET',
        path: '/organizations/status',
        query: { orgUid },
      });
    },

    getCreationStatus,

    getMetadata(orgUid) {
      return request<OrganizationMetadataResponse>(ctx, {
        method: 'GET',
        path: '/organizations/metadata',
        query: { orgUid },
      });
    },

    create(input) {
      return request<OrganizationCreateAcceptedResponse>(ctx, {
        method: 'POST',
        path: '/organizations',
        body: input,
      });
    },

    createFromFile(file) {
      return request<OrganizationCreateAcceptedResponse>(ctx, {
        method: 'POST',
        path: '/organizations',
        multipart: { field: 'file', file },
      });
    },

    upgrade(input = {}) {
      return request<ApiResult>(ctx, { method: 'POST', path: '/organizations/upgrade', body: input });
    },

    addMetadata(input) {
      return request<ApiResult>(ctx, { method: 'POST', path: '/organizations/metadata', body: input });
    },

    sync() {
      return request<ApiResult>(ctx, { method: 'POST', path: '/organizations/sync' });
    },

    addMirror(input) {
      return request<ApiResult>(ctx, { method: 'POST', path: '/organizations/mirror', body: input });
    },

    removeMirror(input) {
      return request<ApiResult>(ctx, {
        method: 'POST',
        path: '/organizations/remove-mirror',
        body: input,
      });
    },

    reclaimHome(input) {
      // The API guide files this example under its "DELETE Examples" heading, but
      // the curl it gives is a POST. Following the working example.
      return request<ApiResult>(ctx, {
        method: 'POST',
        path: '/organizations/reclaim-home',
        body: input,
      });
    },

    edit(input) {
      return request<ApiResult>(ctx, { method: 'PUT', path: '/organizations/edit', body: input });
    },

    editFromFile(file) {
      return request<ApiResult>(ctx, {
        method: 'PUT',
        path: '/organizations/edit',
        multipart: { field: 'file', file },
      });
    },

    importOrganization(input) {
      return request<ApiResult>(ctx, { method: 'PUT', path: '/organizations', body: input });
    },

    subscribe(input) {
      return request<ApiResult>(ctx, { method: 'PUT', path: '/organizations/subscribe', body: input });
    },

    unsubscribe(input) {
      return request<ApiResult>(ctx, {
        method: 'PUT',
        path: '/organizations/unsubscribe',
        body: input,
      });
    },

    resync(input) {
      return request<ApiResult>(ctx, { method: 'PUT', path: '/organizations/resync', body: input });
    },

    remove(orgUid) {
      return request<OrganizationDeleteResponse>(ctx, {
        method: 'DELETE',
        path: `/organizations/${encodeURIComponent(orgUid)}`,
      });
    },

    async waitForCreation(options = {}) {
      const timeoutMs = options.timeoutMs ?? DEFAULT_CREATION_TIMEOUT_MS;
      const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_CREATION_POLL_MS;
      const deadline = Date.now() + timeoutMs;

      // A poll that starts before the node has registered the operation would see
      // inProgress:false and resolve immediately, so an idle first reading is only
      // treated as "finished" once something in-progress has actually been seen.
      let sawInProgress = false;

      for (;;) {
        if (options.signal?.aborted) {
          throw new CadTrustTimeoutError('Waiting for CAD Trust organization creation was aborted.', {
            method: 'GET',
            url: `${ctx.baseUrl}/organizations/creation-status`,
          });
        }

        const status = await getCreationStatus();
        options.onProgress?.(status);

        if (status.inProgress) {
          sawInProgress = true;
          if (status.state === 'FAILED') {
            throw new CadTrustOrgCreationFailedError(
              status.message || 'CAD Trust organization creation failed.',
              {
                method: 'GET',
                url: `${ctx.baseUrl}/organizations/creation-status`,
                body: status,
              },
            );
          }
          if (status.state === 'COMPLETE') {
            return status;
          }
        } else if (sawInProgress) {
          // The operation ran and the node no longer reports it — creation settled.
          return status;
        }

        if (Date.now() + pollIntervalMs > deadline) {
          throw new CadTrustTimeoutError(
            `CAD Trust organization creation did not settle within ${timeoutMs}ms (last state: ${
              status.inProgress ? status.state ?? 'upgrade in progress' : 'idle'
            }).`,
            {
              method: 'GET',
              url: `${ctx.baseUrl}/organizations/creation-status`,
              body: status,
            },
          );
        }

        await ctx.sleep(pollIntervalMs);
      }
    },
  };
}
