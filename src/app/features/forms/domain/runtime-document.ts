export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };
export type JsonObject = { readonly [key: string]: JsonValue };
export const primitiveKinds = [
  'action',
  'attachment_collection',
  'boolean',
  'calculated',
  'choice',
  'date',
  'datetime',
  'display',
  'grid',
  'group',
  'horizontal',
  'integer',
  'media',
  'number',
  'repeater',
  'table',
  'text',
  'textarea',
  'user',
  'vertical',
] as const;
export type PrimitiveKind = (typeof primitiveKinds)[number];
export type RenderNode = {
  readonly component: PrimitiveKind;
  readonly key: string | null;
  readonly scope: string | null;
  readonly label: string | null;
  readonly renderer: 'default' | 'compact';
  readonly display: JsonObject;
  readonly children: readonly RenderNode[];
};
export type RuntimeAction = {
  readonly key: string;
  readonly kind: 'complete' | 'reject' | 'return';
  readonly outcome: string;
  readonly title: string;
  readonly confirmation: string | null;
  readonly requiredScopes: readonly string[];
  readonly requireComment: boolean;
  readonly validation: 'complete' | 'partial';
};
export type RuntimeDocument = {
  readonly dialect: 'bpms.runtime/1';
  readonly identity: {
    readonly resourceKind: 'REQUEST' | 'WORK_ITEM';
    readonly resource: string;
    readonly formVersion: string;
    readonly versionNumber: number;
    readonly submission: string;
    readonly design: string;
    readonly view: string;
  };
  readonly purpose: 'edit' | 'summary' | 'print' | 'observer' | 'correction';
  readonly locale: {
    readonly language: 'en' | 'fa';
    readonly direction: 'ltr' | 'rtl';
  };
  readonly canonical: JsonObject;
  readonly before: JsonObject | null;
  readonly beforeRowIdentity?: Readonly<
    Record<string, readonly string[]>
  > | null;
  readonly rowIdentity: Readonly<Record<string, readonly string[]>>;
  readonly render: RenderNode;
  readonly page: JsonObject;
  readonly policy: {
    readonly readable: readonly string[];
    readonly writable: readonly string[];
    readonly required: readonly string[];
  };
  readonly fields: readonly {
    readonly scope: string;
    readonly schema: JsonObject;
    readonly writable: boolean;
    readonly required: boolean;
  }[];
  readonly actions: readonly RuntimeAction[];
  readonly behavior: {
    readonly provenance: JsonObject;
    readonly issues: readonly {
      readonly pointer: string;
      readonly code: string;
    }[];
  };
};
export type RuntimeCompatibility =
  | { readonly status: 'ready'; readonly document: RuntimeDocument }
  | {
      readonly status: 'unsupported';
      readonly reason: 'dialect' | 'primitive' | 'capability';
    }
  | { readonly status: 'invalid'; readonly reason: 'shape' | 'policy' | 'pin' };
export { implementedRendererCapabilities as rendererCapabilities } from '../../../contracts/renderer-capabilities';
