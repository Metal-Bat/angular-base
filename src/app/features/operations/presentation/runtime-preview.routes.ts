import { Routes } from '@angular/router';
import { readRuntimeDocument } from '../../forms/infrastructure/runtime-document-adapter';
import { runtimeFixture } from '../../forms/testing/runtime-fixtures';
import { PREVIEW_DOCUMENT, RUNTIME_OPTIONS } from '../../forms/bindings';
import { RuntimeOptionsPort } from '../../forms/application/runtime-options-port';
import { OptionInput, OptionPage } from '../../forms/domain/option-coordinator';
import { RuntimeDocument } from '../../forms/domain/runtime-document';
const previewOptions: RuntimeOptionsPort = {
  query: async (
    _document: RuntimeDocument,
    _pointer: string,
    query: OptionInput,
    generation: number,
  ): Promise<OptionPage> => ({
    state: 'READY',
    generation,
    revision: 'fixture/1',
    fingerprint: 'fixture/1',
    locale: query.locale,
    page: 1,
    totalPages: 1,
    items: [
      { key: 'json:1', value: 'One' },
      { key: 'json:2', value: 'Two' },
    ],
  }),
};
export const runtimePreviewRoutes: Routes = [
  {
    path: 'runtime-preview',
    providers: [
      { provide: RUNTIME_OPTIONS, useValue: previewOptions },
      {
        provide: PREVIEW_DOCUMENT,
        useFactory: (): ReturnType<typeof readRuntimeDocument> =>
          readRuntimeDocument(runtimeFixture()),
      },
    ],
    data: { access: 'authenticated', requiredPermissions: ['requests.start'] },
    title: 'Runtime preview | Workflow workspace',
    loadComponent: () =>
      import('../../forms/presentation/runtime-preview/runtime-preview').then(
        (m) => m.RuntimePreview,
      ),
  },
];
