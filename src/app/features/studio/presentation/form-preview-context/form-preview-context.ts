import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { SchemaInput } from '../../../../shared/ui/schema-input/schema-input';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { parseDocument } from '../../domain/authoring';
import type { FormBuilder } from '../form-builder/form-builder';

@Component({
  selector: 'app-form-preview-context',
  imports: [
    FormsModule,
    ButtonDirective,
    CheckboxModule,
    SchemaInput,
    LocalizePipe,
  ],
  templateUrl: './form-preview-context.html',
  styleUrl: './form-preview-context.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormPreviewContext {
  readonly view =
    input.required<
      Pick<
        FormBuilder,
        | 'previewContextJson'
        | 'documents'
        | 'outline'
        | 'data'
        | 'runtime'
        | 'queuePreview'
        | 'contextEpoch'
        | 'previewFreshness'
      >
    >();
  readonly permissions = ['read', 'write', 'required', 'hidden'] as const;
  readonly permissionLabels: Readonly<Record<string, string>> = {
    read: 'Readable',
    write: 'Writable',
    required: 'Required',
    hidden: 'Hidden',
  };
  readonly fields = computed(() =>
    this.view()
      .outline()
      .filter(
        (field, index, fields) =>
          field.scope &&
          fields.findIndex((candidate) => candidate.scope === field.scope) ===
            index,
      ),
  );
  context(): JsonObject {
    return this.view().previewContextJson
      ? parseDocument(this.view().previewContextJson)
      : {};
  }
  set(value: JsonObject): void {
    this.view().previewContextJson = JSON.stringify({
      ...this.context(),
      ...value,
    });
    this.view().queuePreview();
  }
  simulate(enabled: boolean): void {
    const scopes = this.fields().map((field) => field.scope!);
    this.set({
      policy: enabled
        ? { read: scopes, write: scopes, required: [], hidden: [] }
        : null,
    });
  }
  allowed(permission: string, scope: string): boolean {
    const policy = this.context()['policy'] as JsonObject | null;
    return (
      Array.isArray(policy?.[permission]) && policy[permission].includes(scope)
    );
  }
  permission(permission: string, scope: string, enabled: boolean): void {
    const policy = this.context()['policy'] as JsonObject;
    const values = (policy[permission] ?? []) as string[];
    this.set({
      policy: {
        ...policy,
        [permission]: enabled
          ? [...new Set([...values, scope])]
          : values.filter((value) => value !== scope),
      },
    });
  }
  capture(): void {
    if (this.view().previewFreshness() !== 'ready') {
      return;
    }
    this.set({
      before_data: structuredClone(this.view().data()),
      before_item_identity: structuredClone(
        this.view().runtime()?.rowIdentity ?? {},
      ),
    });
  }
}
