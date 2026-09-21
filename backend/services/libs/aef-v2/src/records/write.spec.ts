import { fixedClock } from '../clock';
import { InMemoryAefStore } from '../testing/in-memory-store';
import { AefT2AuthorizationsCreateInput } from '../tables/aefT2Authorizations';
import { AefT3ActionsCreateInput } from '../tables/aefT3Actions';
import { AefT5AuthorizedEntitiesCreateInput } from '../tables/aefT5AuthorizedEntities';
import { AefSubmissionDefaults } from '../submission/bootstrap';
import {
  InvalidRecordDateError,
  linkAuthorizationToEntity,
  recordAction,
  recordActions,
  recordAuthorization,
  recordAuthorizedEntity,
} from './write';

const defaults: AefSubmissionDefaults = {
  aefT1SubmissionParty: 'VUT',
  aefT1SubmissionNdcFirstYear: 2021,
  aefT1SubmissionNdcLastYear: 2030,
};

const clock = fixedClock(new Date('2026-03-01T12:00:00.000Z'));
const newStore = () => new InMemoryAefStore(undefined, clock);

function action(overrides: Partial<AefT3ActionsCreateInput> = {}): AefT3ActionsCreateInput {
  return {
    aefT3ActionsDate: '2025-06-15T10:00:00.000Z',
    aefT3ActionsType: 'Authorization',
    aefT3ActionsCooperativeApproachId: 'CA0004',
    aefT3ActionsAuthorizationId: 'VUT0001',
    aefT3ActionsFirstTransferringPartyId: 'VUT',
    aefT3ActionsPartyItmoRegistryId: 'VUT01',
    aefT3ActionsItmoFirstId: 1,
    aefT3ActionsItmoLastId: 100,
    aefT3ActionsMetric: 'GHG',
    aefT3ActionsQuantityTCo2: 100,
    aefT3ActionsMitigationType: 'Emission reductions',
    aefT3ActionsVintageYear: 2024,
    ...overrides,
  };
}

function authorization(overrides: Partial<AefT2AuthorizationsCreateInput> = {}): AefT2AuthorizationsCreateInput {
  return {
    aefT2AuthorizationsId: 'VUT0001',
    aefT2AuthorizationsDate: '15/06/2025',
    aefT2AuthorizationsCooperativeApproachId: 'CA0004',
    aefT2AuthorizationsVersion: 1,
    aefT2AuthorizationsMetric: 'GHG',
    aefT2AuthorizationsSector: 'Energy generation',
    aefT2AuthorizationsPurposesForAuthorization: 'NDC',
    ...overrides,
  };
}

function authorizedEntity(
  overrides: Partial<AefT5AuthorizedEntitiesCreateInput> = {},
): AefT5AuthorizedEntitiesCreateInput {
  return {
    aefT5AuthorizedEntitiesAuthorizationDate: '15/06/2025',
    aefT5AuthorizedEntitiesName: 'Alpine Carbon Markets',
    aefT5AuthorizedEntitiesIncorporationCountry: 'VUT',
    aefT5AuthorizedEntitiesId: 'ENT-001',
    aefT5AuthorizedEntitiesCooperativeApproachId: 'CA0004',
    ...overrides,
  };
}

describe('recordAction', () => {
  it('creates the year’s submission on first write and links to it', async () => {
    const store = newStore();
    const record = await recordAction(store, defaults, action());

    const submissions = store.all('t1Submission');
    expect(submissions).toHaveLength(1);
    expect(submissions[0].aefT1SubmissionReportYear).toBe(2025);
    expect(record.aefT1SubmissionId).toBe(submissions[0].id);
  });

  it('reuses the existing submission on a second write for the same year', async () => {
    const store = newStore();
    await recordAction(store, defaults, action());
    await recordAction(store, defaults, action({ aefT3ActionsAuthorizationId: 'VUT0002' }));

    expect(store.all('t1Submission')).toHaveLength(1);
    expect(store.all('t3Actions')).toHaveLength(2);
  });

  it('skips the year lookup entirely when given an explicit submissionId', async () => {
    const store = newStore();
    const submission = await store.create('t1Submission', {
      aefT1SubmissionParty: 'VUT',
      aefT1SubmissionVersion: '1.0',
      aefT1SubmissionReportYear: 2025,
    });

    // No aefT3ActionsDate at all — would throw if the date were consulted.
    const record = await recordAction(
      store,
      defaults,
      action({ aefT3ActionsDate: undefined }),
      { submissionId: submission.id },
    );

    expect(record.aefT1SubmissionId).toBe(submission.id);
  });

  it('throws when the date is missing and no submissionId is given', async () => {
    const store = newStore();
    await expect(
      recordAction(store, defaults, action({ aefT3ActionsDate: undefined })),
    ).rejects.toThrow(InvalidRecordDateError);
  });

  it('throws on a malformed date', async () => {
    const store = newStore();
    await expect(
      recordAction(store, defaults, action({ aefT3ActionsDate: '15/06/2025' })),
    ).rejects.toThrow(InvalidRecordDateError);
  });
});

describe('recordActions', () => {
  it('resolves one submission per distinct year across a batch', async () => {
    const store = newStore();
    const rows = await recordActions(store, defaults, [
      action({ aefT3ActionsDate: '2024-01-01T00:00:00.000Z' }),
      action({ aefT3ActionsDate: '2024-06-01T00:00:00.000Z' }),
      action({ aefT3ActionsDate: '2025-01-01T00:00:00.000Z' }),
    ]);

    const submissions = store.all('t1Submission');
    expect(submissions).toHaveLength(2);
    expect(rows).toHaveLength(3);
    expect(rows[0].aefT1SubmissionId).toBe(rows[1].aefT1SubmissionId);
    expect(rows[0].aefT1SubmissionId).not.toBe(rows[2].aefT1SubmissionId);
  });
});

describe('recordAuthorization', () => {
  it('derives the year from dd/mm/yyyy and links to the submission', async () => {
    const store = newStore();
    const record = await recordAuthorization(store, defaults, authorization());

    const submissions = store.all('t1Submission');
    expect(submissions[0].aefT1SubmissionReportYear).toBe(2025);
    expect(record.aefT1SubmissionId).toBe(submissions[0].id);
  });
});

describe('recordAuthorizedEntity', () => {
  it('derives the year from its own authorization date', async () => {
    const store = newStore();
    const record = await recordAuthorizedEntity(store, defaults, authorizedEntity());

    const submissions = store.all('t1Submission');
    expect(submissions[0].aefT1SubmissionReportYear).toBe(2025);
    expect(record.aefT1SubmissionId).toBe(submissions[0].id);
  });
});

describe('linkAuthorizationToEntity', () => {
  it('resolves the circular T2 <-> T5 link with a write-then-update on both sides', async () => {
    const store = newStore();
    const auth = await recordAuthorization(store, defaults, authorization());
    const entity = await recordAuthorizedEntity(store, defaults, authorizedEntity());

    const { authorization: linkedAuth, entity: linkedEntity } = await linkAuthorizationToEntity(
      store,
      auth.id,
      entity.id,
    );

    expect(linkedAuth.aefT5AuthorizedEntitiesId).toBe(entity.id);
    expect(linkedEntity.aefT2AuthorizationsId).toBe(auth.id);
  });
});
