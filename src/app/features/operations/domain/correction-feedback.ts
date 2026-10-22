import { RuntimeDocument } from '../../forms/domain/runtime-document';
import { valueLabels } from '../../forms/domain/value-labels';
import { rowPointer, scopePath } from '../../forms/domain/row-values';
import {
  formPages,
  pageRender,
  visibleScopes,
} from '../../forms/domain/form-pages';
export type CorrectionInput = {
  readonly scope: string;
  readonly item_key: string | null;
  readonly message: string;
};
export type CorrectionTarget = {
  readonly key: string;
  readonly scope: string;
  readonly item_key: string | null;
  readonly label: string;
  readonly row: string;
  readonly pointer: string;
};
export function correctionTargetKey(
  row: Pick<CorrectionInput, 'scope' | 'item_key'>,
): string {
  return JSON.stringify([row.scope, row.item_key]);
}
/** Only the current authorized runtime fields and stable row identities are offered. */
export function correctionTargets(
  document: RuntimeDocument,
  only?: ReadonlySet<string>,
): CorrectionTarget[] {
  const permitted = new Set([
    ...document.policy.readable,
    ...document.policy.writable,
  ]);
  const labels = valueLabels(document.render);
  return document.fields
    .filter(
      (field) => permitted.has(field.scope) && (!only || only.has(field.scope)),
    )
    .flatMap<CorrectionTarget>((field) => {
      const base = {
        scope: field.scope,
        label: labels[field.scope] || 'Form field',
      };
      const parts = scopePath(field.scope);
      if (!parts.includes(null)) {
        const target = { ...base, item_key: null, row: '' };
        return [
          {
            ...target,
            pointer: rowPointer(field.scope),
            key: correctionTargetKey(target),
          },
        ];
      }
      const array = parts.slice(0, parts.lastIndexOf(null));
      return Object.entries(document.rowIdentity).flatMap(([path, keys]) => {
        const actual = path
          .split('/')
          .slice(1)
          .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'));
        if (
          array.length !== actual.length ||
          !array.every((part, index) => part === null || part === actual[index])
        ) {
          return [];
        }
        return keys.map((item_key, index) => {
          const target = {
            ...base,
            item_key,
            pointer: rowPointer(field.scope, [
              ...actual
                .filter((_, position) => array[position] === null)
                .map(Number),
              index,
            ]),
            row: [
              ...actual
                .filter((_, position) => array[position] === null)
                .map((value) => String(Number(value) + 1)),
              String(index + 1),
            ].join('.'),
          };
          return { ...target, key: correctionTargetKey(target) };
        });
      });
    });
}
/** Navigation only offers fields present in the actor's current rendered pages. */
export function correctionLocations(
  document: RuntimeDocument,
  only?: ReadonlySet<string>,
): readonly CorrectionTarget[] {
  const pages = document.purpose === 'print' ? [] : formPages(document);
  const roots = pages.length
    ? pages.map((page) => pageRender(document.render, page.scopes))
    : [document.render];
  const visible = new Set(roots.flatMap(visibleScopes));
  return correctionTargets(document, only).filter((target) =>
    visible.has(target.scope),
  );
}
export function validCorrectionFeedback(
  document: RuntimeDocument,
  rows: readonly CorrectionInput[],
): boolean {
  const targets = new Set(
    correctionTargets(document).map((target) => target.key),
  );
  return (
    rows.length > 0 &&
    rows.length <= 64 &&
    rows.every(
      (row) =>
        targets.has(correctionTargetKey(row)) &&
        row.message.trim().length > 0 &&
        row.message.length <= 4000,
    )
  );
}
