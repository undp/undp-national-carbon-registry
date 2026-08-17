import {
  ControlledValueProvider,
  defaultControlledValueProvider,
} from '../controlled-values/provider';
import { ACTION_SUBTYPES_BY_TYPE } from '../controlled-values/nomenclature';
import { AefFieldSpec, fieldSpecsFor } from '../spec/field-spec';
import { isProvided } from '../spec/conditions';
import { AefTableName } from '../tables';
import { AefValidationIssue, issue } from './issues';

export interface ValidateOptions {
  controlledValues?: ControlledValueProvider;
  /**
   * Skip `required` and `conditional-required`, keeping only correctness checks
   * (type, format, controlled value, CARP). Use while a record is still being
   * filled in — a draft should not shout about fields nobody has reached yet.
   */
  draft?: boolean;
}

function typeIssue(spec: AefFieldSpec, value: unknown, table: AefTableName): string | undefined {
  switch (spec.type) {
    case 'integer':
      if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
        return `${spec.aefLabel} must be an integer`;
      }
      return undefined;
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return `${spec.aefLabel} must be a number`;
      }
      return undefined;
    case 'string':
    case 'date':
    case 'datetime':
      if (typeof value !== 'string') {
        return `${spec.aefLabel} must be a string`;
      }
      return undefined;
    default:
      // Exhaustive today; keeps a future member from failing silently.
      return `${spec.aefLabel} has an unrecognised spec type for table ${table}`;
  }
}

/**
 * Field-level validation of one record, driven entirely by `AEF_FIELD_SPECS`.
 *
 * Never throws and never mutates. An empty array means the record is complete
 * and well-formed as far as this table alone can tell — cross-record rules live
 * in {@link validateSubmission}.
 */
export function validateRecord(
  table: AefTableName,
  record: Readonly<Record<string, unknown>>,
  options: ValidateOptions = {},
): AefValidationIssue[] {
  const controlled = options.controlledValues ?? defaultControlledValueProvider;
  const recordId = typeof record.id === 'string' ? record.id : undefined;
  const issues: AefValidationIssue[] = [];
  const add = (code: Parameters<typeof issue>[0], message: string, key?: string) =>
    issues.push(issue(code, table, message, { key, recordId }));

  for (const spec of fieldSpecsFor(table)) {
    const value = record[spec.key];
    const provided = isProvided(value);

    if (spec.carpPopulated) {
      if (provided) {
        add(
          'carp-populated',
          `${spec.aefLabel} is populated by CARP and must be left empty on submission`,
          spec.key,
        );
      }
      // Nothing else to check: the registry should not be writing it at all.
      continue;
    }

    const applicable = spec.appliesWhen ? spec.appliesWhen.applies(record) : true;

    if (!provided) {
      if (options.draft) {
        continue;
      }
      if (spec.required && applicable) {
        add('required', `${spec.aefLabel} is required`, spec.key);
      } else if (spec.appliesWhen && applicable && spec.required) {
        add(
          'conditional-required',
          `${spec.aefLabel} is required ${spec.appliesWhen.description}`,
          spec.key,
        );
      }
      continue;
    }

    if (spec.appliesWhen && !applicable) {
      add(
        'not-applicable',
        `${spec.aefLabel} is ${spec.appliesWhen.description}; report "NA" or leave it blank`,
        spec.key,
      );
      continue;
    }

    const typeProblem = typeIssue(spec, value, table);
    if (typeProblem) {
      add('wrong-type', typeProblem, spec.key);
      continue;
    }

    if (typeof value === 'string') {
      if (spec.pattern && !spec.pattern.test(value)) {
        add(
          'format',
          `${spec.aefLabel} must match ${spec.format ?? String(spec.pattern)}`,
          spec.key,
        );
        continue;
      }

      if (spec.controlledValues) {
        const allowed = controlled.get(spec.controlledValues);
        // No list known is not evidence the value is wrong — cooperative
        // approach IDs, for instance, live in the registry's own table and may
        // not have been supplied. Format checks above still applied.
        if (allowed && !allowed.includes(value)) {
          add(
            'unknown-controlled-value',
            `${spec.aefLabel} value "${value}" is not in the ${spec.controlledValues} list`,
            spec.key,
          );
        }
      }
    }
  }

  issues.push(...validateActionSubtype(table, record, recordId));

  return issues;
}

/**
 * Table 26(b): a subtype only belongs to certain action types. Checked here
 * rather than as a plain controlled list, because the valid set depends on
 * another field's value.
 */
function validateActionSubtype(
  table: AefTableName,
  record: Readonly<Record<string, unknown>>,
  recordId: string | undefined,
): AefValidationIssue[] {
  if (table !== 't3Actions') {
    return [];
  }

  const actionType = record.aefT3ActionsType;
  const subtype = record.aefT3ActionsSubtype;
  if (typeof actionType !== 'string' || typeof subtype !== 'string' || !isProvided(subtype)) {
    return [];
  }

  const allowed = ACTION_SUBTYPES_BY_TYPE[actionType];
  if (!allowed || allowed.includes(subtype)) {
    return [];
  }

  return [
    issue(
      'not-applicable',
      table,
      `Action subtype "${subtype}" is not valid for action type "${actionType}"`,
      { key: 'aefT3ActionsSubtype', recordId },
    ),
  ];
}

/** One reporting year's five tables, as submitted together. */
export interface AefSubmissionBundle {
  submission?: Readonly<Record<string, unknown>>;
  authorizations?: readonly Readonly<Record<string, unknown>>[];
  actions?: readonly Readonly<Record<string, unknown>>[];
  holdings?: readonly Readonly<Record<string, unknown>>[];
  authorizedEntities?: readonly Readonly<Record<string, unknown>>[];
}

/** Action types that permanently remove ITMOs from the reporting Party's books. */
const CONSUMING_ACTION_TYPES = ['Use', 'Cancellation', 'Voluntary Cancellation'];

/** Block attributes that must not change over a block's lifetime. */
const BLOCK_INVARIANTS: readonly { action: string; holding: string; label: string }[] = [
  {
    action: 'aefT3ActionsCooperativeApproachId',
    holding: 'aefT4HoldingsCooperativeApproachId',
    label: 'cooperative approach',
  },
  {
    action: 'aefT3ActionsFirstTransferringPartyId',
    holding: 'aefT4HoldingsFirstTransferringPartyId',
    label: 'first transferring Party',
  },
  { action: 'aefT3ActionsMetric', holding: 'aefT4HoldingsMetric', label: 'metric' },
  {
    action: 'aefT3ActionsMitigationType',
    holding: 'aefT4HoldingsMitigationType',
    label: 'mitigation type',
  },
  { action: 'aefT3ActionsVintageYear', holding: 'aefT4HoldingsVintageYear', label: 'vintage' },
];

interface BlockRange {
  first: number;
  last: number;
  registry: string;
  authorization: string;
  recordId?: string;
}

function readRange(
  record: Readonly<Record<string, unknown>>,
  firstKey: string,
  lastKey: string,
  registryKey: string,
  authorizationKey: string,
): BlockRange | undefined {
  const first = record[firstKey];
  const last = record[lastKey];
  if (typeof first !== 'number' || typeof last !== 'number') {
    return undefined;
  }
  return {
    first,
    last,
    registry: typeof record[registryKey] === 'string' ? (record[registryKey] as string) : '',
    authorization:
      typeof record[authorizationKey] === 'string' ? (record[authorizationKey] as string) : '',
    recordId: typeof record.id === 'string' ? record.id : undefined,
  };
}

function overlaps(a: BlockRange, b: BlockRange): boolean {
  return a.registry === b.registry && a.first <= b.last && b.first <= a.last;
}

/**
 * Cross-record rules that no single row can catch.
 *
 * Runs `validateRecord` over everything first, then the relationships between
 * tables. Never throws: a caller wants the full list of what is wrong, not the
 * first problem.
 */
export function validateSubmission(
  bundle: AefSubmissionBundle,
  options: ValidateOptions = {},
): AefValidationIssue[] {
  const authorizations = bundle.authorizations ?? [];
  const actions = bundle.actions ?? [];
  const holdings = bundle.holdings ?? [];
  const authorizedEntities = bundle.authorizedEntities ?? [];

  const issues: AefValidationIssue[] = [];

  if (bundle.submission) {
    issues.push(...validateRecord('t1Submission', bundle.submission, options));
  }
  for (const record of authorizations) {
    issues.push(...validateRecord('t2Authorizations', record, options));
  }
  for (const record of actions) {
    issues.push(...validateRecord('t3Actions', record, options));
  }
  for (const record of holdings) {
    issues.push(...validateRecord('t4Holdings', record, options));
  }
  for (const record of authorizedEntities) {
    issues.push(...validateRecord('t5AuthorizedEntities', record, options));
  }

  // -- Every Action and Holding must reference a known Authorization ---------
  const knownAuthorizations = new Set(
    authorizations
      .map((record) => record.aefT2AuthorizationsId)
      .filter((value): value is string => typeof value === 'string'),
  );

  const checkAuthorizationRef = (
    table: 't3Actions' | 't4Holdings',
    key: string,
    records: readonly Readonly<Record<string, unknown>>[],
  ) => {
    for (const record of records) {
      const id = record[key];
      if (typeof id !== 'string' || id.length === 0) {
        continue; // absence is already reported as `required`
      }
      if (!knownAuthorizations.has(id)) {
        issues.push(
          issue(
            'missing-authorization',
            table,
            `Authorization "${id}" is referenced but is not present in Table 2`,
            { key, recordId: typeof record.id === 'string' ? record.id : undefined },
          ),
        );
      }
    }
  };

  checkAuthorizationRef('t3Actions', 'aefT3ActionsAuthorizationId', actions);
  checkAuthorizationRef('t4Holdings', 'aefT4HoldingsAuthorizationId', holdings);

  // -- Every Action's Authorized entity reference must resolve in Table 5 ---
  //
  // Deliberately scoped to t3Actions only. Table 2's own entity-identifier
  // field (aefT2AuthorizationsAuthoziedEntityId) is a static descriptive
  // label, not a real reference — checking it here would always
  // false-positive.
  const knownEntities = new Set(
    authorizedEntities
      .map((record) => record.aefT5AuthorizedEntitiesId)
      .filter((value): value is string => typeof value === 'string'),
  );

  for (const record of actions) {
    const id = record.aefT3ActionsUsingAuthorizedEntityId;
    if (typeof id !== 'string' || id.length === 0) {
      continue; // absence is already reported as `required`/`conditional-required`
    }
    if (!knownEntities.has(id)) {
      issues.push(
        issue(
          'missing-entity',
          't3Actions',
          `Authorized entity "${id}" is referenced but is not present in Table 5`,
          {
            key: 'aefT3ActionsUsingAuthorizedEntityId',
            recordId: typeof record.id === 'string' ? record.id : undefined,
          },
        ),
      );
    }
  }

  // -- Block ranges ---------------------------------------------------------
  const actionRanges = actions
    .map((record) =>
      readRange(
        record,
        'aefT3ActionsItmoFirstId',
        'aefT3ActionsItmoLastId',
        'aefT3ActionsPartyItmoRegistryId',
        'aefT3ActionsAuthorizationId',
      ),
    )
    .filter((range): range is BlockRange => range !== undefined);

  const holdingRanges = holdings
    .map((record) =>
      readRange(
        record,
        'aefT4HoldingsItmoFirstId',
        'aefT4HoldingsItmoLastId',
        'aefT4HoldingsPartyItmoRegistryId',
        'aefT4HoldingsAuthorizationId',
      ),
    )
    .filter((range): range is BlockRange => range !== undefined);

  for (const [table, ranges] of [
    ['t3Actions', actionRanges],
    ['t4Holdings', holdingRanges],
  ] as const) {
    for (const range of ranges) {
      if (range.first > range.last) {
        issues.push(
          issue(
            'invalid-block-range',
            table,
            `Block ${range.first}–${range.last} has a first ID greater than its last ID`,
            { recordId: range.recordId },
          ),
        );
      }
    }
  }

  // Holdings are a snapshot, so two rows from one registry must not overlap.
  for (let i = 0; i < holdingRanges.length; i += 1) {
    for (let j = i + 1; j < holdingRanges.length; j += 1) {
      if (overlaps(holdingRanges[i], holdingRanges[j])) {
        issues.push(
          issue(
            'overlapping-block',
            't4Holdings',
            `Holding blocks ${holdingRanges[i].first}–${holdingRanges[i].last} and ` +
              `${holdingRanges[j].first}–${holdingRanges[j].last} overlap in registry ` +
              `"${holdingRanges[i].registry}"`,
            { recordId: holdingRanges[j].recordId },
          ),
        );
      }
    }
  }

  // -- Consumed ITMOs must not still be held at 31 December -----------------
  for (const action of actions) {
    const type = action.aefT3ActionsType;
    if (typeof type !== 'string' || !CONSUMING_ACTION_TYPES.includes(type)) {
      continue;
    }
    const consumed = readRange(
      action,
      'aefT3ActionsItmoFirstId',
      'aefT3ActionsItmoLastId',
      'aefT3ActionsPartyItmoRegistryId',
      'aefT3ActionsAuthorizationId',
    );
    if (!consumed) {
      continue;
    }
    for (const held of holdingRanges) {
      if (overlaps(consumed, held)) {
        issues.push(
          issue(
            'inconsistent-block',
            't4Holdings',
            `Block ${held.first}–${held.last} is reported as held, but ITMOs ` +
              `${consumed.first}–${consumed.last} were subject to a "${type}" action`,
            { recordId: held.recordId },
          ),
        );
      }
    }
  }

  // -- Immutable block attributes across Actions and Holdings ---------------
  for (const action of actions) {
    const actionRange = readRange(
      action,
      'aefT3ActionsItmoFirstId',
      'aefT3ActionsItmoLastId',
      'aefT3ActionsPartyItmoRegistryId',
      'aefT3ActionsAuthorizationId',
    );
    if (!actionRange) {
      continue;
    }
    for (const holding of holdings) {
      const holdingRange = readRange(
        holding,
        'aefT4HoldingsItmoFirstId',
        'aefT4HoldingsItmoLastId',
        'aefT4HoldingsPartyItmoRegistryId',
        'aefT4HoldingsAuthorizationId',
      );
      if (!holdingRange || !overlaps(actionRange, holdingRange)) {
        continue;
      }
      for (const invariant of BLOCK_INVARIANTS) {
        const left = action[invariant.action];
        const right = holding[invariant.holding];
        if (isProvided(left) && isProvided(right) && left !== right) {
          issues.push(
            issue(
              'inconsistent-block',
              't4Holdings',
              `Block ${holdingRange.first}–${holdingRange.last} reports ${invariant.label} ` +
                `"${String(right)}" but the overlapping action reports "${String(left)}"`,
              { key: invariant.holding, recordId: holdingRange.recordId },
            ),
          );
        }
      }
    }
  }

  return issues;
}
