import { reconcileChoiceSample } from '../domain/form-choice-sample';
import { FieldEdit } from '../../forms/domain/canonical-values';
import { indicesFor, replaceRow } from '../../forms/domain/row-values';
import { JsonObject } from '../../forms/domain/runtime-document';
import { parseDocument } from '../domain/authoring';
import { editSampleCollection } from '../domain/sample-collections';
import type { FormBuilderCommands } from './form-builder/form-builder-commands';
type SampleEditor = Pick<
  FormBuilderCommands,
  | 'runtime'
  | 'data'
  | 'preview'
  | 'documents'
  | 'sampleJson'
  | 'previewContextJson'
  | 'queuePreview'
  | 'error'
  | 'pending'
  | 'previewBusy'
>;

export function editFormSample(editor: SampleEditor, change: FieldEdit): void {
  if (change.error) {
    return;
  }
  try {
    const document = editor.runtime();
    const indices =
      change.rowKeys && document
        ? indicesFor(document, change.scope, change.rowKeys)
        : (change.indices ?? []);
    if (indices === null) {
      return;
    }
    editor.data.set(
      replaceRow(editor.data(), change.scope, indices, change.value),
    );
    editor.sampleJson = JSON.stringify(editor.data(), null, 2);
    editor.queuePreview();
  } catch {
    editor.error.set('Sample change is unavailable');
  }
}

export async function editFormSampleCollection(
  editor: SampleEditor,
  scope: string,
  path: string,
  operation: 'add' | 'remove' | 'reorder' | 'duplicate',
  key?: string,
  index?: number,
): Promise<void> {
  const document = editor.runtime();
  if (!document || editor.pending().length) {
    return;
  }
  try {
    const result = editSampleCollection(
      document,
      editor.data(),
      editor.documents()['data_schema'] as JsonObject,
      scope,
      path,
      operation,
      key,
      index,
    );
    editor.previewContextJson = JSON.stringify({
      ...parseDocument(editor.previewContextJson),
      item_identity: result.identity,
    });
    editor.data.set(result.data);
    editor.sampleJson = JSON.stringify(result.data, null, 2);
    editor.preview.set({
      status: 'ready',
      document: {
        ...document,
        canonical: result.data,
        rowIdentity: result.identity,
      },
    });
    editor.queuePreview();
  } catch {
    editor.error.set('Sample change is unavailable');
  }
}

export function reconcileChoiceAnswers(
  editor: SampleEditor,
  previous: JsonObject,
): void {
  const result = reconcileChoiceSample(
    previous,
    editor.documents(),
    editor.data(),
  );
  editor.data.set(result.data);
  editor.sampleJson = JSON.stringify(result.data);
  if (result.cleared) {
    editor.error.set(
      'Multiple sample selections were cleared. Choose one sample value.',
    );
  }
}
