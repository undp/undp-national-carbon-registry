export enum CounterType {
  USER = 0,
  PROGRAMME = 1,
  ITMO = 2,
  COMPANY = 3,
  REPLICATE_SEQ = 4,
  REPLICATE_SEQ_COMP = 5,
  ASYNC_OPERATIONS = 6,
  NDC_ACTION = 7,
  ITMO_SYSTEM = 8,
  PROGRAMME_SL = 9,
  REPLICATE_SEQ_PROGRAMME_SL = 10,
  RETIREMENT_REQUEST_SL = 11,
  PROJECT = 12,
  PROJECT_REPLICATE_SEQ = 13,
  CREDIT_BLOCKS = 14,
  CREDIT_BLOCKS_REPLICATE_SEQ = 15,
  CREDIT_TRANSACTIONS = 16,
  COOPERATIVE_APPROACH = 17,
  CORRESPONDING_ADJUSTMENT = 18,
  INITIAL_REPORT = 19,
  CA_REFERENCE = 20,
  // The CAD Trust-only async-operations cursor — see
  // src/async-operations-handler/cadtrust-async-operations-handler.service.ts. Independent of
  // ASYNC_OPERATIONS (6) so a slow/retrying CAD Trust action never shares a cursor, a poll
  // cadence or a backoff timer with email/registry-sync actions.
  CADTRUST_ASYNC_OPERATIONS = 21,
}
