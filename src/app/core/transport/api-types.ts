import type { operations } from './generated/schema';
import type { endpoints } from './generated/operations';

export type OperationId = keyof operations;
export type ApiOperationId = {
  [K in OperationId]: (typeof endpoints)[K]['scope'] extends 'api' ? K : never;
}[OperationId];
export type Domain = (typeof endpoints)[ApiOperationId]['area'];
export type DomainOperation<D extends Domain> = {
  [K in ApiOperationId]: (typeof endpoints)[K]['area'] extends D ? K : never;
}[ApiOperationId];
type Content<T> = T extends { content: infer C } ? C[keyof C] : never;
type Parameters<I extends OperationId> = operations[I]['parameters'];
type Param<I extends OperationId, K extends keyof Parameters<I>> = NonNullable<
  Parameters<I>[K]
>;
export type RequestBody<I extends OperationId> = operations[I] extends {
  requestBody?: infer B;
}
  ? Content<NonNullable<B>>
  : never;
export type RequestInput<I extends OperationId> = (Param<
  I,
  'path'
> extends never
  ? { path?: never }
  : { path: Param<I, 'path'> }) &
  (Param<I, 'query'> extends never
    ? { query?: never }
    : Record<string, never> extends Pick<Parameters<I>, 'query'>
      ? { query?: Param<I, 'query'> }
      : { query: Param<I, 'query'> }) &
  (RequestBody<I> extends never
    ? { body?: never }
    : Record<string, never> extends Pick<operations[I], 'requestBody'>
      ? { body?: RequestBody<I> }
      : { body: RequestBody<I> });
export type SuccessBody<I extends OperationId> = {
  [S in keyof operations[I]['responses']]: S extends 200 | 201 | 202 | 204 | 206
    ? Content<operations[I]['responses'][S]>
    : never;
}[keyof operations[I]['responses']];
