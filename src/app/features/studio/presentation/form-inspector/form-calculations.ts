import { JsonObject } from '../../../forms/domain/runtime-document';
import type { FormInspector } from './form-inspector';
import {
  calculationSource,
  calculationType,
} from '../../domain/form-calculation';

type CalculationEditor = Pick<
  FormInspector,
  | 'disabled'
  | 'fields'
  | 'documents'
  | 'scope'
  | 'calculationScopes'
  | 'calculationFunction'
  | 'draft'
  | 'patch'
  | 'expressionAvailable'
  | 'expression'
  | 'error'
>;

export function calculationScope(
  view: CalculationEditor,
  scope: string,
  checked: boolean,
): void {
  if (
    view.disabled() ||
    !view.fields().some((field) => field.scope === scope)
  ) {
    return;
  }
  view.calculationScopes = checked
    ? [...new Set([...view.calculationScopes, scope])].slice(0, 16)
    : view.calculationScopes.filter((item) => item !== scope);
}

export function setFunction(view: CalculationEditor): void {
  if (
    view.disabled() ||
    !['sum', 'concat', 'count'].includes(view.calculationFunction) ||
    !view.calculationScopes.length ||
    view.calculationScopes.some(
      (scope) => !view.fields().some((field) => field.scope === scope),
    )
  ) {
    return;
  }
  const source = calculationSource(view.draft()['calculation'], {
    function: view.calculationFunction,
    scopes: [...view.calculationScopes],
  });
  try {
    calculationType(view.documents(), view.scope() ?? '', source);
    view.patch('calculation', source);
    view.error.set('');
  } catch {
    view.error.set('Choose compatible calculation source fields.');
  }
}

export function setExpression(view: CalculationEditor): void {
  if (!view.expressionAvailable()) {
    return;
  }
  if (!view.expression.trim() || view.expression.length > 1024) {
    view.error.set('Invalid expression');
    return;
  }
  view.patch(
    'calculation',
    calculationSource(view.draft()['calculation'], {
      expression: view.expression,
    }),
  );
}

export function calculationResult(
  view: Pick<FormInspector, 'documents' | 'scope' | 'draft' | 'constraints'>,
): string {
  try {
    return (
      calculationType(
        view.documents(),
        view.scope() ?? '',
        (view.draft()['calculation'] ?? {}) as JsonObject,
      ) ?? String(view.constraints()['type'])
    );
  } catch {
    return String(view.constraints()['type']);
  }
}
