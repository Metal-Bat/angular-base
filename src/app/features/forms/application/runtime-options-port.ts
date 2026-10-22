import { RuntimeDocument } from '../domain/runtime-document';
import { OptionInput, OptionPage } from '../domain/option-coordinator';
export type RuntimeOptionsPort = {
  /** Authoring may explicitly replace its immutable local definition; runtime ports omit this. */
  definitionIdentity?(): object;
  query(
    document: RuntimeDocument,
    pointer: string,
    input: OptionInput,
    generation: number,
    signal: AbortSignal,
  ): Promise<OptionPage>;
};
