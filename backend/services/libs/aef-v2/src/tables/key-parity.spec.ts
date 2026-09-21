import { AEF_FIELD_SPECS } from '../spec/field-spec';
import { AEF_TABLE_NAMES } from './index';
import { CADTRUST_AEF_KEYS } from './cadtrust-keys.snapshot';

/**
 * Keeps this library's field keys aligned with CAD Trust's.
 *
 * Using CAD Trust keys verbatim is what removes the need for a mapping layer —
 * but it also means nothing absorbs a divergence. If one side renames a field,
 * values silently stop crossing the boundary. This is the guard.
 */
describe('CAD Trust key parity', () => {
  it.each(AEF_TABLE_NAMES)('%s uses exactly CAD Trust\'s keys', (table) => {
    const ours = AEF_FIELD_SPECS[table].map((spec) => spec.key).sort();
    const theirs = [...CADTRUST_AEF_KEYS[table]].sort();

    // Order differs — CAD Trust's guide lists fields in its own order, and this
    // library follows the CMA.6 CSV — so only membership is compared.
    expect(ours).toEqual(theirs);
  });

  it('keeps the CAD Trust misspelling rather than quietly fixing it', () => {
    // Correcting `Authozied` here would reintroduce exactly the rename mapping
    // that using CAD Trust keys exists to avoid.
    expect(CADTRUST_AEF_KEYS.t2Authorizations).toContain('aefT2AuthorizationsAuthoziedEntityId');
    expect(AEF_FIELD_SPECS.t2Authorizations.map((spec) => spec.key)).toContain(
      'aefT2AuthorizationsAuthoziedEntityId',
    );
  });

  it('covers every table', () => {
    expect(Object.keys(CADTRUST_AEF_KEYS).sort()).toEqual([...AEF_TABLE_NAMES].sort());
  });
});
