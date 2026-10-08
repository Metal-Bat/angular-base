import { WorkflowTopology } from './workflow-topology';

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Invalid workflow topology.');
  }
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('Invalid workflow topology.');
  }
  return value;
}

function optionalText(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new Error('Invalid workflow topology.');
  }
  return value;
}

// Read-only projection of GraphSnapshot/GraphStep/GraphTransition from the supplied OpenAPI.
// Never use this projection to write a snapshot: omitted config/bindings/targets must be preserved.
export function readWorkflowTopology(snapshot: unknown): WorkflowTopology {
  const dto = record(snapshot);
  const steps: unknown = dto['steps'] === undefined ? [] : dto['steps'];
  const transitions: unknown =
    dto['transitions'] === undefined ? [] : dto['transitions'];
  if (
    !Array.isArray(steps) ||
    steps.length > 256 ||
    !Array.isArray(transitions) ||
    transitions.length > 2048
  ) {
    throw new Error('Invalid workflow topology.');
  }
  return {
    steps: steps.map((value: unknown) => {
      const step = record(value);
      return {
        key: text(step['key']),
        typeCode: text(step['type_code']),
        typeVersionReference: optionalText(step['type_version_ref']),
      };
    }),
    transitions: transitions.map((value: unknown) => {
      const transition = record(value);
      const priority: unknown = transition['priority'] ?? 0;
      const isDefault: unknown = transition['is_default'] ?? false;
      if (
        typeof priority !== 'number' ||
        !Number.isSafeInteger(priority) ||
        priority < 0 ||
        typeof isDefault !== 'boolean'
      ) {
        throw new Error('Invalid workflow topology.');
      }
      return {
        source: text(transition['source']),
        target: text(transition['target']),
        outcome: text(transition['outcome']),
        condition: optionalText(transition['condition']),
        isDefault,
        priority,
      };
    }),
  };
}
