import { RuntimeDocument } from '../domain/runtime-document';
import { OptionInput, OptionPage } from '../domain/option-coordinator';
export type RuntimeOptionsPort = {
  query(
    document: RuntimeDocument,
    pointer: string,
    input: OptionInput,
    generation: number,
    signal: AbortSignal,
  ): Promise<OptionPage>;
};
