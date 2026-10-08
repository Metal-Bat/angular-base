// Compile-time contract fixtures: these must keep compiling after regeneration.
import type { components } from './generated/schema';
import type { RequestBody, RequestInput, SuccessBody } from './api-types';

type Assert<T extends true> = T;
export type BinaryUpload = Assert<
  RequestBody<'upload_file_api_v1_media_files_post'> extends { upload: Blob }
    ? true
    : false
>;
export type NullableEmail = Assert<
  null extends components['schemas']['UserDTO']['email'] ? true : false
>;
export type SnakeCase = Assert<
  'ref_id' extends keyof components['schemas']['UserDTO'] ? true : false
>;
export type OpaqueReference = Assert<
  components['schemas']['UserDTO']['ref_id'] extends string ? true : false
>;
export const permissionSearchFixture = {
  body: { page: 1, size: 100 },
} satisfies RequestInput<'current_permissions_api_v1_auth_permissions_search_post'>;

export type SelectorUnion = Assert<
  Extract<
    SuccessBody<'select_users_api_v1_admin_users_select_post'>,
    readonly unknown[]
  > extends never
    ? false
    : true
>;
