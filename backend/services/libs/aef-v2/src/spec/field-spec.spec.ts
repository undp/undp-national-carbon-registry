import { AEF_TABLE_NAMES, AefTableName } from '../tables';
import { AEF_FIELD_COUNTS, AEF_FIELD_SPECS, carpPopulatedFields } from './field-spec';

/**
 * Conformance between the spec table and the source documents.
 *
 * This is the test that matters most: `AEF_FIELD_SPECS` drives validation *and*
 * the export column layout, so an error here is an error in the submitted file.
 */
describe('AEF_FIELD_SPECS', () => {
  it('has a spec for every table', () => {
    expect(Object.keys(AEF_FIELD_SPECS).sort()).toEqual([...AEF_TABLE_NAMES].sort());
  });

  it.each(AEF_TABLE_NAMES)('%s has the field count printed in the CMA.6 table', (table) => {
    expect(AEF_FIELD_SPECS[table]).toHaveLength(AEF_FIELD_COUNTS[table]);
  });

  it.each(AEF_TABLE_NAMES)('%s has no duplicate keys', (table) => {
    const keys = AEF_FIELD_SPECS[table].map((spec) => spec.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it.each(AEF_TABLE_NAMES)('%s labels are unique, so export headers are unambiguous', (table) => {
    const labels = AEF_FIELD_SPECS[table].map((spec) => spec.aefLabel);
    expect(new Set(labels).size).toBe(labels.length);
  });

  /**
   * Column order is part of the contract — it is what the exported CSV/XLSX
   * layout comes from, so a reordering is a silent change to the filed file.
   */
  it('Table 1 is in CMA.6 order', () => {
    expect(AEF_FIELD_SPECS.t1Submission.map((spec) => spec.aefLabel)).toEqual([
      'Party',
      'Version',
      'Reported year',
      'Date of submission',
      'Review status of the initial report',
      'Result of the consistency check of this AEF submission',
      'First year of the NDC implementation period',
      'Last year of the NDC implementation period',
      'Reference to the Article 6 technical expert review report of the initial report',
    ]);
  });

  it('Table 3 starts and ends where the CMA.6 table does', () => {
    const labels = AEF_FIELD_SPECS.t3Actions.map((spec) => spec.aefLabel);
    expect(labels.slice(0, 5)).toEqual([
      'Action date',
      'Action type',
      'Action subtype',
      'Cooperative approach ID',
      'Authorization ID',
    ]);
    expect(labels.slice(-2)).toEqual([
      'Result of the consistency checks',
      'Additional explanatory information',
    ]);
  });

  it('Table 4 is in CMA.6 order', () => {
    expect(AEF_FIELD_SPECS.t4Holdings.map((spec) => spec.aefLabel)).toEqual([
      'Cooperative approach ID',
      'Authorization ID',
      'First transferring participating Party ID',
      'Party ITMO registry ID',
      'First ID',
      'Last ID',
      'Underlying unit registry ID',
      'First unit ID',
      'Last unit ID',
      'Metric',
      'Applicable GWP value(s)',
      'Applicable non-GHG metric',
      'Quantity (t CO2 eq)',
      'Quantity (in non-GHG metric)',
      'Mitigation type',
      'Vintage',
    ]);
  });

  it('flags exactly the CARP-populated fields', () => {
    const carp = (table: AefTableName) => carpPopulatedFields(table).map((spec) => spec.key);

    expect(carp('t1Submission')).toEqual([
      'aefT1SubmissionReviewStatus',
      'aefT1SubmissionResultCheck',
      'aefT1SubmissionReferenceReviewReport',
    ]);
    expect(carp('t2Authorizations')).toEqual([
      'aefT2AuthorizationsAuthorizationDocumentation',
    ]);
    expect(carp('t3Actions')).toEqual(['aefT3ActionsConsistencyCheckResult']);
    expect(carp('t4Holdings')).toEqual([]);
    expect(carp('t5AuthorizedEntities')).toEqual([]);
  });

  it('never marks a CARP-populated field required', () => {
    for (const table of AEF_TABLE_NAMES) {
      for (const spec of carpPopulatedFields(table)) {
        // The registry must leave these empty, so requiring one would make every
        // submission unsubmittable.
        expect(spec.required).toBe(false);
      }
    }
  });

  it('applies the UNFCCC requiredness where CAD Trust disagrees', () => {
    const required = (table: AefTableName, key: string) =>
      AEF_FIELD_SPECS[table].find((spec) => spec.key === key)?.required;

    // CAD Trust marks all of these optional; the Common Nomenclature requires them.
    expect(required('t2Authorizations', 'aefT2AuthorizationsSector')).toBe(true);
    expect(required('t2Authorizations', 'aefT2AuthorizationsMetric')).toBe(true);
    expect(required('t2Authorizations', 'aefT2AuthorizationsPurposesForAuthorization')).toBe(true);
    expect(required('t2Authorizations', 'aefT2AuthorizationsVersion')).toBe(true);
    expect(required('t3Actions', 'aefT3ActionsType')).toBe(true);
    expect(required('t3Actions', 'aefT3ActionsMitigationType')).toBe(true);
    expect(required('t5AuthorizedEntities', 'aefT5AuthorizedEntitiesIncorporationCountry')).toBe(true);

    // CAD Trust requires these; the spec makes them conditional or optional.
    expect(required('t3Actions', 'aefT3ActionsUnitRegistryId')).toBe(false);
    expect(required('t3Actions', 'aefT3ActionsUnitFirstId')).toBe(false);
    expect(required('t3Actions', 'aefT3ActionsTransferringPartyId')).toBe(false);
    expect(required('t3Actions', 'aefT3ActionsAcquiringPartyId')).toBe(false);
    expect(required('t2Authorizations', 'aefT2AuthorizationsAuthorizedPartyId')).toBe(false);
  });

  it('types the ITMO block bounds as integers, not strings', () => {
    const typeOf = (table: AefTableName, key: string) =>
      AEF_FIELD_SPECS[table].find((spec) => spec.key === key)?.type;

    // CAD Trust types these as strings; the nomenclature says integer, and the
    // range checks in validateSubmission depend on it.
    expect(typeOf('t3Actions', 'aefT3ActionsItmoFirstId')).toBe('integer');
    expect(typeOf('t3Actions', 'aefT3ActionsItmoLastId')).toBe('integer');
    expect(typeOf('t4Holdings', 'aefT4HoldingsItmoFirstId')).toBe('integer');
    expect(typeOf('t4Holdings', 'aefT4HoldingsItmoLastId')).toBe('integer');
  });

  it('preserves the CAD Trust key spelling, typo included', () => {
    const keys = AEF_FIELD_SPECS.t2Authorizations.map((spec) => spec.key);
    // Renaming this to "Authorized" would reintroduce the mapping layer that
    // using CAD Trust keys verbatim exists to avoid.
    expect(keys).toContain('aefT2AuthorizationsAuthoziedEntityId');
  });

  it('records the ActivityType spec conflict rather than silently resolving it', () => {
    const activityType = AEF_FIELD_SPECS.t2Authorizations.find(
      (spec) => spec.key === 'aefT2AuthorizationsActivityType',
    );
    expect(activityType?.specConflict).toBeTruthy();
  });

  it('gives every conditional field a description usable in a message', () => {
    for (const table of AEF_TABLE_NAMES) {
      for (const spec of AEF_FIELD_SPECS[table]) {
        if (spec.appliesWhen) {
          expect(spec.appliesWhen.description.length).toBeGreaterThan(0);
          expect(spec.appliesWhen.dependsOn.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
