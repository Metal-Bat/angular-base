import { Provider } from '@angular/core';
import { FORM_COLLECTIONS, RUNTIME_OPTIONS } from '../../forms/bindings';
import { FormCollectionEditor } from '../../forms/application/form-resources';
import { RuntimeOptionsPort } from '../../forms/application/runtime-options-port';
import { editFormSampleCollection } from './form-preview-sample';
import type { FormBuilderCommands } from './form-builder/form-builder-commands';

/** Authoring-only adapters: actual preview reads and local sample rows, no case/file commands. */
export function formPreviewProviders(
  editor: () => FormBuilderCommands,
): Provider[] {
  return [
    {
      provide: RUNTIME_OPTIONS,
      useFactory: (): RuntimeOptionsPort => {
        const view = editor();
        return {
          definitionIdentity: () => view.documents(),
          query: (_document, pointer, input, generation, abortSignal) =>
            view.api.options(
              view.documents(),
              pointer,
              input,
              generation,
              abortSignal,
            ),
        };
      },
    },
    {
      provide: FORM_COLLECTIONS,
      useFactory: (): FormCollectionEditor => {
        const view = editor();
        return {
          busy: () =>
            view.previewFreshness() !== 'ready' || view.pending().length > 0,
          collection: (scope, path, operation, key, index) =>
            editFormSampleCollection(view, scope, path, operation, key, index),
        };
      },
    },
  ];
}
