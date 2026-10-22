import { JsonObject } from '../../forms/domain/runtime-document';
import { changeFormOutcome } from './form-outcomes';

describe('Declared form outcomes', () => {
  const documents: JsonObject = {
    data_schema: { type: 'object' },
    render_schema: {
      dialect: 'bpms.render/1',
      outcomes: ['next', 'unused'],
      root: {
        component: 'vertical',
        children: [{ component: 'action', node_key: 'go', outcome: 'next' }],
      },
    },
    localization: { catalogs: {} },
  };
  it('adds and removes declarations without changing actions or other documents', () => {
    const next = changeFormOutcome(documents, 'review');
    expect(next['render_schema']).toEqual({
      ...(documents['render_schema'] as JsonObject),
      outcomes: ['next', 'unused', 'review'],
    });
    expect(next['data_schema']).toBe(documents['data_schema']);
    expect(next['localization']).toBe(documents['localization']);
    expect(
      (changeFormOutcome(next, 'unused', true)['render_schema'] as JsonObject)[
        'outcomes'
      ],
    ).toEqual(['next', 'review']);
    expect((documents['render_schema'] as JsonObject)['outcomes']).toEqual([
      'next',
      'unused',
    ]);
  });
  it('refuses removal of a referenced outcome, duplicates, invalid values and over-limit lists', () => {
    expect(() => changeFormOutcome(documents, 'next', true)).toThrow(
      'used by an action',
    );
    for (const value of ['', ' ', 'next', 'a'.repeat(65)]) {
      expect(() => changeFormOutcome(documents, value)).toThrow();
    }
    const full = {
      ...documents,
      render_schema: {
        ...(documents['render_schema'] as JsonObject),
        outcomes: Array.from({ length: 32 }, (_, i) => String(i)),
      },
    };
    expect(() => changeFormOutcome(full, 'extra')).toThrow();
  });
});
