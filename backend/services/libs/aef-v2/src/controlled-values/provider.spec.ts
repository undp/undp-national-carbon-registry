import {
  ACTION_TYPES,
  DEFAULT_CONTROLLED_VALUES,
  NOMENCLATURE_DATE,
  SECTORS,
} from './nomenclature';
import { StaticControlledValueProvider, controlledValueProviderFrom } from './provider';

describe('controlled values', () => {
  it('records the nomenclature it was taken from', () => {
    expect(NOMENCLATURE_DATE).toBe('2026-02-17');
  });

  it('serves the nomenclature defaults', () => {
    const provider = new StaticControlledValueProvider();
    expect(provider.get('sectors')).toEqual(SECTORS);
    expect(provider.get('actionType')).toEqual(ACTION_TYPES);
  });

  /**
   * Cooperative approaches are agreed continuously and held in the registry's
   * own table, so shipping a list here would be stale on arrival and wrong for
   * any other registry.
   */
  it('ships no default cooperative-approach list', () => {
    expect(DEFAULT_CONTROLLED_VALUES.cooperativeApproachId).toBeUndefined();
    expect(new StaticControlledValueProvider().get('cooperativeApproachId')).toBeUndefined();
  });

  it('takes cooperative approaches from an override', () => {
    const provider = new StaticControlledValueProvider({
      cooperativeApproachId: ['CA0004', 'CA0041'],
    });
    expect(provider.get('cooperativeApproachId')).toEqual(['CA0004', 'CA0041']);
  });

  it('lets an override win over a default', () => {
    const provider = new StaticControlledValueProvider({ sectors: ['Energy generation'] });
    expect(provider.get('sectors')).toEqual(['Energy generation']);
    // Untouched keys still fall through to the nomenclature.
    expect(provider.get('actionType')).toEqual(ACTION_TYPES);
  });

  it('adapts a plain lookup function', () => {
    const provider = controlledValueProviderFrom((key) =>
      key === 'cooperativeApproachId' ? ['CA0004'] : undefined,
    );
    expect(provider.get('cooperativeApproachId')).toEqual(['CA0004']);
    expect(provider.get('sectors')).toBeUndefined();
  });

  it('preserves the source typo in the activity list', () => {
    // `C02 usage` uses a digit zero. The value list must match what CARP
    // accepts, so correcting it here would be the bug.
    expect(DEFAULT_CONTROLLED_VALUES.activityType).toContain('C02 usage');
  });

  it('keeps the two identically-described action types distinct', () => {
    expect(ACTION_TYPES).toContain('First transfer');
    expect(ACTION_TYPES).toContain('Transfer');
    expect(ACTION_TYPES).toContain('Cancellation');
    expect(ACTION_TYPES).toContain('Voluntary Cancellation');
  });
});
