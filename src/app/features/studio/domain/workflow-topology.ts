// Read-only control topology; bindings/configuration and authoring layout are separate.
// No Angular, canvas-library types, or backend DTO names cross this boundary.
export type WorkflowTopology = {
  readonly steps: readonly {
    readonly key: string;
    readonly typeCode: string;
    readonly typeVersionReference: string | null;
  }[];
  readonly transitions: readonly {
    readonly source: string;
    readonly target: string;
    readonly outcome: string;
    readonly condition: string | null;
    readonly isDefault: boolean;
    readonly priority: number;
  }[];
};
