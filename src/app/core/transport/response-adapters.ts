import { HttpResponse } from '@angular/common/http';
import { failure, record } from './api-failure';

export type Decoder<T> = (value: unknown) => T;
export type Page<T> = {
  items: readonly T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
};
function envelope(response: HttpResponse<unknown>): Record<string, unknown> {
  const value = record(response.body);
  if (value['success'] !== true) {
    throw failure(response.status, value, response.headers.get('x-request-id'));
  }
  return value;
}
export function readData<T>(
  response: HttpResponse<unknown>,
  decode: Decoder<T>,
): T {
  return decode(envelope(response)['data']);
}
export function readResult<T>(
  response: HttpResponse<unknown>,
  decode: Decoder<T>,
): T {
  return decode(envelope(response)['result']);
}
export function decodePage<T>(value: unknown, decode: Decoder<T>): Page<T> {
  const page = record(value);
  const numbers = ['page', 'size', 'total', 'total_pages'].map(
    (key) => page[key],
  );
  if (
    !Array.isArray(page['items']) ||
    !numbers.every(Number.isSafeInteger) ||
    Number(page['page']) < 1 ||
    Number(page['size']) < 1 ||
    Number(page['size']) > 100 ||
    Number(page['total']) < 0 ||
    Number(page['total_pages']) < 0 ||
    page['items'].length > Number(page['size'])
  ) {
    throw new Error('Invalid page response.');
  }
  return {
    items: page['items'].map(decode),
    page: Number(page['page']),
    size: Number(page['size']),
    total: Number(page['total']),
    totalPages: Number(page['total_pages']),
  };
}
export function readResultPage<T>(
  response: HttpResponse<unknown>,
  decode: Decoder<T>,
): Page<T> {
  return readResult(response, (value) => decodePage(value, decode));
}
export function readDataPage<T>(
  response: HttpResponse<unknown>,
  decode: Decoder<T>,
): Page<T> {
  return readData(response, (value) => decodePage(value, decode));
}
export function readSelector<T>(
  response: HttpResponse<unknown>,
  decode: Decoder<T>,
): readonly T[] {
  const value = response.body;
  if (!Array.isArray(value) || value.length > 1000) {
    throw new Error('Invalid selector response.');
  }
  return value.map(decode);
}
export function responseMetadata(response: HttpResponse<unknown>): {
  httpStatus: number;
  applicationCode: string | number | null;
  requestId: string | null;
} {
  let value: Record<string, unknown> = {};
  try {
    value = record(response.body);
  } catch {
    /* Bare response. */
  }
  const code = value['code'];
  return {
    httpStatus: response.status,
    applicationCode:
      typeof code === 'number' || typeof code === 'string' ? code : null,
    requestId:
      response.headers.get('x-request-id') ??
      (typeof value['request_id'] === 'string' ? value['request_id'] : null),
  };
}
export function readBareToken(response: HttpResponse<unknown>): {
  access_token: string;
  token_type: string;
} {
  const value = record(response.body);
  if (
    typeof value['access_token'] !== 'string' ||
    typeof value['token_type'] !== 'string'
  ) {
    throw new Error('Invalid token contract.');
  }
  return {
    access_token: value['access_token'],
    token_type: value['token_type'],
  };
}
