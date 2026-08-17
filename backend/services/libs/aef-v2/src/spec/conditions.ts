/**
 * Conditional applicability rules.
 *
 * Several AEF columns apply only for certain action types or metrics — the spec
 * says to report `NA` or leave them blank otherwise. Encoding those rules here
 * rather than in comments is what lets `validateRecord` catch both a missing
 * conditionally-required value and a value supplied where it does not belong.
 */
export interface FieldCondition {
  /** Human-readable, used verbatim in validation messages. */
  readonly description: string;
  /** Field keys this condition reads, so callers can show what drove a result. */
  readonly dependsOn: readonly string[];
  /** True when the field is applicable to this record. */
  applies(record: Readonly<Record<string, unknown>>): boolean;
}

function textOf(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Applicable when `field` holds one of `values`. */
export function whenFieldIn(
  field: string,
  values: readonly string[],
  description: string,
): FieldCondition {
  return {
    description,
    dependsOn: [field],
    applies: (record) => values.includes(textOf(record[field])),
  };
}

/**
 * Applicable when the row is denominated in a non-GHG metric.
 *
 * Treats an unset metric as "not applicable yet" rather than applicable, so a
 * blank draft does not accumulate spurious non-GHG issues.
 */
export function whenMetricIsNonGhg(metricField: string): FieldCondition {
  return {
    description: 'only when the metric is non-GHG',
    dependsOn: [metricField],
    applies: (record) => textOf(record[metricField]).toLowerCase() === 'non-ghg',
  };
}

/** Applicable when the authorization purpose covers OIMP, IMP or OP. */
export function whenPurposeCoversOimp(purposeField: string): FieldCondition {
  return {
    description: 'only when the authorization purpose includes OIMP, IMP or OP',
    dependsOn: [purposeField],
    applies: (record) => {
      const purpose = textOf(record[purposeField]);
      return purpose.includes('OIMP') || purpose.includes('IMP') || purpose.includes('OP');
    },
  };
}

/**
 * Whether a value counts as supplied.
 *
 * `NA` is how the spec says to fill an inapplicable column, so it reads as
 * absent — otherwise every correctly-filled `NA` would register as a value
 * present where it does not belong.
 */
export function isProvided(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 && trimmed.toUpperCase() !== 'NA';
  }
  return true;
}
