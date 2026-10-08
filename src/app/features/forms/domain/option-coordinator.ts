import { JsonObject } from './runtime-document';
export type Option = { readonly key: string; readonly value: string };
export type OptionPage = {
  readonly state: 'READY' | 'EMPTY' | 'BLOCKED' | 'CLIENT_FETCH';
  readonly generation: number;
  readonly fingerprint: string;
  readonly revision: string;
  readonly locale: string;
  readonly items: readonly Option[];
  readonly page: number;
  readonly totalPages: number;
};
export type OptionInput = {
  readonly data: JsonObject;
  readonly indices?: readonly number[];
  readonly locale: string;
  readonly page: number;
  readonly search: string;
  readonly selected: readonly string[];
};
export class OptionCoordinator {
  private generation = 0;
  private controller = new AbortController();
  private identity = '';
  private sourceRevision: string | null = null;
  private dependencyFingerprint: string | null = null;
  constructor(
    private readonly request: (
      input: OptionInput,
      generation: number,
      signal: AbortSignal,
    ) => Promise<OptionPage>,
  ) {}
  async load(input: OptionInput): Promise<OptionPage | null> {
    this.controller.abort();
    this.controller = new AbortController();
    const generation = ++this.generation;
    const identity = JSON.stringify([
      input.data,
      input.locale,
      input.search,
      input.selected,
      input.indices,
    ]);
    if (identity !== this.identity) {
      this.sourceRevision = null;
      this.dependencyFingerprint = null;
      this.identity = identity;
    }
    const result = await this.request(
      structuredClone(input),
      generation,
      this.controller.signal,
    );
    if (generation !== this.generation || this.controller.signal.aborted) {
      return null;
    }
    if (result.generation !== generation || result.locale !== input.locale) {
      throw new Error('Stale option response.');
    }
    if (
      (this.sourceRevision !== null &&
        result.revision !== this.sourceRevision) ||
      (this.dependencyFingerprint !== null &&
        result.fingerprint !== this.dependencyFingerprint)
    ) {
      throw new Error('Option source changed. Reload required.');
    }
    this.sourceRevision = result.revision;
    this.dependencyFingerprint = result.fingerprint;
    return result;
  }
  reset(): void {
    this.sourceRevision = null;
    this.dependencyFingerprint = null;
    this.close();
  }
  close(): void {
    this.generation++;
    this.controller.abort();
  }
}
