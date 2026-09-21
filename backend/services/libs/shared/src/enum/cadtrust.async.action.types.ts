import { AsyncActionType } from "./async.action.type.enum";

/**
 * Every `AsyncActionType` that belongs to CAD Trust v2 sync
 * (`libs/shared/src/cadtrust-sync/`) — the single source of truth for "is this a CAD Trust
 * action?" wherever that question needs answering:
 *
 * - The `AddAction` gate in both async-operations producers
 *   (`async-operations-database.service.ts` / `async-operations-queue.service.ts`), which used
 *   to each hard-code this same six-item list separately — a real drift risk (the two lists had
 *   already diverged on an unrelated action type before this constant existed).
 * - `CadTrustAsyncOperationsHandlerService`'s query filter (its own dedicated consumer lane —
 *   see the class doc for why CAD Trust actions get an independent cursor).
 * - `AsyncOperationsDatabaseHandlerService`'s exclusion filter, so the two consumer lanes
 *   partition `async_action_entity` with no overlap.
 *
 * Append-only, same as `AsyncActionType` itself — see that enum's doc comment.
 */
export const CADTRUST_V2_ACTION_TYPES: readonly AsyncActionType[] = [
  AsyncActionType.CADTV2ProjectCreate,
  AsyncActionType.CADTV2ProjectUpdate,
  AsyncActionType.CADTV2Commit,
  AsyncActionType.CADTV2Bootstrap,
  AsyncActionType.CADTV2ValidationCreate,
  AsyncActionType.CADTV2Reconcile,
  AsyncActionType.CADTV2VerificationCreate,
  AsyncActionType.CADTV2CreditIssuance,
  AsyncActionType.CADTV2UnitUpdate,
];
