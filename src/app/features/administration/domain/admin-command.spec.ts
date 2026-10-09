import { redactAdmin } from './admin-command';
describe('Budget diagnostics', () => {
  it('preserves public token counts while redacting bearer and refresh credentials', () => {
    expect(
      redactAdmin({
        used: { input_tokens: 0, output_tokens: 2, total_tokens: 2 },
        reserved: { total_tokens: 10 },
        access_token: 'secret',
        refresh_token: 'secret',
      }),
    ).toEqual({
      used: { input_tokens: 0, output_tokens: 2, total_tokens: 2 },
      reserved: { total_tokens: 10 },
      access_token: '[redacted]',
      refresh_token: '[redacted]',
    });
  });
});

it('does not use the public count exception for strings or malformed counts', () => {
  expect(
    redactAdmin({
      input_tokens: 'private-secret',
      output_tokens: -1,
      total_tokens: 1.5,
    }),
  ).toEqual({
    input_tokens: '[redacted]',
    output_tokens: '[redacted]',
    total_tokens: '[redacted]',
  });
});
