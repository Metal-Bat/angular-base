import { JsonObject } from '../../forms/domain/runtime-document';
import { messageRevision } from './form-localization';
import { summarizeMessages } from './form-message-summary';

describe('Translation status', () => {
  it('distinguishes missing, stale, current and structured messages without changing catalogs', async () => {
    const revision = await messageRevision('Name');
    const documents: JsonObject = {
      localization: {
        default_locale: 'en',
        catalogs: {
          en: {
            name: { text: 'Name' },
            count: {
              text: { one: 'One', other: 'Many' },
              parameters: { count: 'integer' },
            },
          },
          fa: {
            name: { text: 'نام', source_revision: revision },
            count: { text: 'تعداد', parameters: { count: 'integer' } },
          },
          ar: { name: { text: 'الاسم', source_revision: '0'.repeat(64) } },
        },
      },
    };
    const before = structuredClone(documents);
    const rows = await summarizeMessages(documents);
    expect(rows[0].cells.map((cell) => cell.status)).toEqual([
      'Current translation',
      'Current translation',
      'Stale translation',
    ]);
    expect(rows[1].cells.map((cell) => cell.status)).toEqual([
      'Contract editor required',
      'Contract editor required',
      'Missing translation',
    ]);
    expect(documents).toEqual(before);
  });
  it('uses the declared Persian source and detects missing English text', async () => {
    const documents: JsonObject = {
      localization: {
        default_locale: 'fa',
        catalogs: {
          fa: { title: { text: 'عنوان' } },
          ar: {
            title: {
              text: 'العنوان',
              source_revision: await messageRevision('عنوان'),
            },
          },
        },
      },
    };
    expect(
      (await summarizeMessages(documents))[0].cells.map((cell) => cell.status),
    ).toEqual([
      'Missing translation',
      'Current translation',
      'Current translation',
    ]);
  });
});
