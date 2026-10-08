import { RecordDefinition } from '../domain/records';
import contracts from './record-contracts.json';
export const recordDefinitions = contracts as unknown as Readonly<
  Record<string, RecordDefinition>
>;
