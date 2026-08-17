import { StaticControlledValueProvider } from '../controlled-values/provider';
import { AefIssueCode } from './issues';
import { validateRecord, validateSubmission } from './validate';

const codes = (issues: { code: AefIssueCode; key?: string }[]) => issues.map((i) => i.code);
const keys = (issues: { code: AefIssueCode; key?: string }[], code: AefIssueCode) =>
  issues.filter((i) => i.code === code).map((i) => i.key);

/** A complete, well-formed Action row. Individual tests break one thing at a time. */
const validAction = {
  aefT3ActionsDate: '2025-06-01T10:30:00.000Z',
  aefT3ActionsType: 'First transfer',
  aefT3ActionsSubtype: 'First transfer to another Party',
  aefT3ActionsCooperativeApproachId: 'CA0004',
  aefT3ActionsAuthorizationId: 'VUT0001',
  aefT3ActionsFirstTransferringPartyId: 'VUT',
  aefT3ActionsPartyItmoRegistryId: 'VUT01',
  aefT3ActionsItmoFirstId: 1,
  aefT3ActionsItmoLastId: 400,
  aefT3ActionsMetric: 'GHG',
  aefT3ActionsQuantityTCo2: 400,
  aefT3ActionsMitigationType: 'Emission reductions',
  aefT3ActionsVintageYear: 2024,
  aefT3ActionsAcquiringPartyId: 'CHE',
};

describe('validateRecord', () => {
  it('passes a complete record', () => {
    expect(validateRecord('t3Actions', validAction)).toEqual([]);
  });

  it('reports a missing required field', () => {
    const { aefT3ActionsMetric, ...withoutMetric } = validAction;
    const issues = validateRecord('t3Actions', withoutMetric);
    expect(codes(issues)).toContain('required');
    expect(keys(issues, 'required')).toContain('aefT3ActionsMetric');
  });

  it('treats "NA" as absent, since that is how the spec fills a blank column', () => {
    const issues = validateRecord('t3Actions', { ...validAction, aefT3ActionsMetric: 'NA' });
    expect(keys(issues, 'required')).toContain('aefT3ActionsMetric');
  });

  it('reports a wrong type', () => {
    const issues = validateRecord('t3Actions', {
      ...validAction,
      aefT3ActionsItmoFirstId: '1',
    });
    expect(codes(issues)).toContain('wrong-type');
  });

  it('reports a bad format', () => {
    const issues = validateRecord('t3Actions', {
      ...validAction,
      aefT3ActionsFirstTransferringPartyId: 'VU',
    });
    expect(keys(issues, 'format')).toContain('aefT3ActionsFirstTransferringPartyId');
  });

  it('reports a value outside a controlled list', () => {
    const issues = validateRecord('t3Actions', { ...validAction, aefT3ActionsMetric: 'tCO2e' });
    expect(codes(issues)).toContain('unknown-controlled-value');
  });

  /**
   * No list known is not evidence a value is wrong — cooperative approach IDs
   * come from the registry's own table and may not have been supplied.
   */
  it('accepts a cooperative approach when no list is configured', () => {
    expect(validateRecord('t3Actions', validAction)).toEqual([]);
  });

  it('rejects a cooperative approach once a list is configured', () => {
    const issues = validateRecord('t3Actions', validAction, {
      controlledValues: new StaticControlledValueProvider({
        cooperativeApproachId: ['CA0001'],
      }),
    });
    expect(keys(issues, 'unknown-controlled-value')).toContain('aefT3ActionsCooperativeApproachId');
  });

  it('still enforces the CANNNN format with no list configured', () => {
    const issues = validateRecord('t3Actions', {
      ...validAction,
      aefT3ActionsCooperativeApproachId: 'CA4',
    });
    expect(keys(issues, 'format')).toContain('aefT3ActionsCooperativeApproachId');
  });

  describe('conditional applicability', () => {
    it('rejects an acquiring Party on an acquisition', () => {
      const issues = validateRecord('t3Actions', {
        ...validAction,
        aefT3ActionsType: 'Acquisition',
        aefT3ActionsSubtype: undefined,
        aefT3ActionsTransferringPartyId: 'VUT',
      });
      expect(keys(issues, 'not-applicable')).toContain('aefT3ActionsAcquiringPartyId');
    });

    it('rejects a transferring Party on a first transfer', () => {
      const issues = validateRecord('t3Actions', {
        ...validAction,
        aefT3ActionsTransferringPartyId: 'VUT',
      });
      expect(keys(issues, 'not-applicable')).toContain('aefT3ActionsTransferringPartyId');
    });

    it('rejects an NDC-use year on a transfer', () => {
      const issues = validateRecord('t3Actions', {
        ...validAction,
        aefT3ActionsItmoUsedYear: 2025,
      });
      expect(keys(issues, 'not-applicable')).toContain('aefT3ActionsItmoUsedYear');
    });

    it('rejects non-GHG fields on a GHG row', () => {
      const issues = validateRecord('t3Actions', {
        ...validAction,
        aefT3ActionsQuantityNonGhg: '1200 MWh',
      });
      expect(keys(issues, 'not-applicable')).toContain('aefT3ActionsQuantityNonGhg');
    });

    it('accepts non-GHG fields on a non-GHG row', () => {
      const issues = validateRecord('t3Actions', {
        ...validAction,
        aefT3ActionsMetric: 'non-GHG',
        aefT3ActionsApplicableNonGhgMetric: 'MWh of renewable generation',
        aefT3ActionsQuantityNonGhg: '1200 MWh',
      });
      expect(codes(issues)).not.toContain('not-applicable');
    });
  });

  describe('action subtype', () => {
    it('accepts a subtype belonging to its action type', () => {
      expect(
        validateRecord('t3Actions', {
          ...validAction,
          aefT3ActionsType: 'Transfer',
          aefT3ActionsSubtype: 'Voluntary transfer to the Adaptation Fund (A6.4 ERs)',
        }),
      ).toEqual([]);
    });

    it('rejects a subtype belonging to a different action type', () => {
      const issues = validateRecord('t3Actions', {
        ...validAction,
        aefT3ActionsType: 'Transfer',
        aefT3ActionsSubtype: 'First transfer to another Party',
      });
      expect(keys(issues, 'not-applicable')).toContain('aefT3ActionsSubtype');
    });

    it('allows the open "Not yet defined" subtype anywhere', () => {
      expect(
        validateRecord('t3Actions', {
          ...validAction,
          aefT3ActionsType: 'Transfer',
          aefT3ActionsSubtype: 'Not yet defined',
        }),
      ).toEqual([]);
    });
  });

  describe('CARP-populated fields', () => {
    it('rejects a value the registry should not have written', () => {
      const issues = validateRecord('t3Actions', {
        ...validAction,
        aefT3ActionsConsistencyCheckResult: 'Passed',
      });
      expect(keys(issues, 'carp-populated')).toContain('aefT3ActionsConsistencyCheckResult');
    });

    it('accepts them empty', () => {
      expect(validateRecord('t1Submission', {
        aefT1SubmissionParty: 'VUT',
        aefT1SubmissionVersion: '1.0',
        aefT1SubmissionReportYear: 2025,
        aefT1SubmissionSubmissionDate: '14/04/2026',
        aefT1SubmissionNdcFirstYear: 2021,
        aefT1SubmissionNdcLastYear: 2030,
      })).toEqual([]);
    });
  });

  describe('draft mode', () => {
    it('never throws on a half-filled record', () => {
      expect(() => validateRecord('t3Actions', { aefT3ActionsType: 'Use' })).not.toThrow();
    });

    it('suppresses required issues but keeps correctness ones', () => {
      const issues = validateRecord(
        't3Actions',
        { aefT3ActionsType: 'Use', aefT3ActionsMetric: 'tCO2e' },
        { draft: true },
      );
      expect(codes(issues)).not.toContain('required');
      expect(codes(issues)).toContain('unknown-controlled-value');
    });
  });
});

describe('validateSubmission', () => {
  const authorization = {
    id: 'auth-row',
    aefT2AuthorizationsId: 'VUT0001',
    aefT2AuthorizationsDate: '15/01/2025',
    aefT2AuthorizationsCooperativeApproachId: 'CA0004',
    aefT2AuthorizationsVersion: 1,
    aefT2AuthorizationsMetric: 'GHG',
    aefT2AuthorizationsSector: 'Energy generation',
    aefT2AuthorizationsPurposesForAuthorization: 'NDC',
  };

  const holding = {
    id: 'holding-row',
    aefT4HoldingsCooperativeApproachId: 'CA0004',
    aefT4HoldingsAuthorizationId: 'VUT0001',
    aefT4HoldingsFirstTransferringPartyId: 'VUT',
    aefT4HoldingsPartyItmoRegistryId: 'VUT01',
    aefT4HoldingsItmoFirstId: 401,
    aefT4HoldingsItmoLastId: 600,
    aefT4HoldingsMetric: 'GHG',
    aefT4HoldingsQuantityTCo2: 200,
    aefT4HoldingsMitigationType: 'Emission reductions',
    aefT4HoldingsVintageYear: 2024,
  };

  it('passes a reconciling bundle', () => {
    expect(
      validateSubmission({
        authorizations: [authorization],
        actions: [{ ...validAction, id: 'action-row' }],
        holdings: [holding],
      }),
    ).toEqual([]);
  });

  it('reports an action referencing an unknown authorization', () => {
    const issues = validateSubmission({
      authorizations: [authorization],
      actions: [{ ...validAction, aefT3ActionsAuthorizationId: 'VUT9999' }],
    });
    expect(codes(issues)).toContain('missing-authorization');
  });

  const authorizedEntity = {
    id: 'entity-row',
    aefT5AuthorizedEntitiesId: 'ENT-001',
    aefT5AuthorizedEntitiesAuthorizationDate: '01/03/2024',
    aefT5AuthorizedEntitiesName: 'Alpine Carbon Markets',
    aefT5AuthorizedEntitiesIncorporationCountry: 'CHE',
    aefT5AuthorizedEntitiesCooperativeApproachId: 'CA0004',
  };

  it('reports an action referencing an unknown authorized entity', () => {
    const issues = validateSubmission({
      authorizations: [authorization],
      actions: [{ ...validAction, aefT3ActionsUsingAuthorizedEntityId: 'ENT-999' }],
      authorizedEntities: [authorizedEntity],
    });
    expect(codes(issues)).toContain('missing-entity');
  });

  it('does not report an action referencing a known authorized entity', () => {
    const issues = validateSubmission({
      authorizations: [authorization],
      actions: [{ ...validAction, aefT3ActionsUsingAuthorizedEntityId: 'ENT-001' }],
      authorizedEntities: [authorizedEntity],
    });
    expect(codes(issues)).not.toContain('missing-entity');
  });

  it('does not check Table 2’s own entity-identifier field against Table 5', () => {
    const issues = validateSubmission({
      authorizations: [{ ...authorization, aefT2AuthorizationsAuthoziedEntityId: 'Cooperative Approach Entities' }],
      actions: [{ ...validAction, id: 'action-row' }],
    });
    expect(codes(issues)).not.toContain('missing-entity');
  });

  it('reports an inverted block range', () => {
    const issues = validateSubmission({
      authorizations: [authorization],
      actions: [{ ...validAction, aefT3ActionsItmoFirstId: 400, aefT3ActionsItmoLastId: 1 }],
    });
    expect(codes(issues)).toContain('invalid-block-range');
  });

  it('reports two overlapping holding blocks in one registry', () => {
    const issues = validateSubmission({
      authorizations: [authorization],
      holdings: [holding, { ...holding, id: 'holding-2', aefT4HoldingsItmoFirstId: 500 }],
    });
    expect(codes(issues)).toContain('overlapping-block');
  });

  /**
   * The rule that catches a HoldingsProvider returning live balances where
   * year-end ones were wanted.
   */
  it('reports ITMOs still held after being used', () => {
    const issues = validateSubmission({
      authorizations: [authorization],
      actions: [
        {
          ...validAction,
          aefT3ActionsType: 'Use',
          aefT3ActionsSubtype: undefined,
          aefT3ActionsAcquiringPartyId: undefined,
          aefT3ActionsItmoFirstId: 401,
          aefT3ActionsItmoLastId: 500,
        },
      ],
      holdings: [holding],
    });
    expect(codes(issues)).toContain('inconsistent-block');
  });

  it('reports a block attribute that changes across its lifecycle', () => {
    const issues = validateSubmission({
      authorizations: [authorization],
      actions: [{ ...validAction, aefT3ActionsItmoFirstId: 401, aefT3ActionsItmoLastId: 600 }],
      holdings: [{ ...holding, aefT4HoldingsVintageYear: 2023 }],
    });
    expect(codes(issues)).toContain('inconsistent-block');
  });

  it('returns every problem rather than the first', () => {
    const issues = validateSubmission({
      actions: [{ aefT3ActionsAuthorizationId: 'NOPE' }],
    });
    expect(issues.length).toBeGreaterThan(1);
  });
});
