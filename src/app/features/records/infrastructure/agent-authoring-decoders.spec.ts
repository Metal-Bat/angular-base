import { choicePreview } from './agent-authoring-decoders';
describe('Agent authoring response boundaries', () => {
  const preview = {
    sample_state: 'VALID',
    options_input_key: 'routes',
    options: [
      {
        key: 'finance',
        labels: { en: 'Finance' },
        description: 'Invoice handling',
      },
    ],
    issue_codes: [],
    provider_called: false,
  };
  it('requires the non-executing producer guarantee', () => {
    expect(choicePreview(preview).options[0].labels['en']).toBe('Finance');
    expect(() =>
      choicePreview({ ...preview, provider_called: true }),
    ).toThrow();
  });
  it('rejects a nullable description that violates the fixed AIChoice contract', () => {
    expect(() =>
      choicePreview({
        ...preview,
        options: [{ ...preview.options[0], description: null }],
      }),
    ).toThrow();
  });
});
