import { TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { ApiClient } from '../../../core/transport/api-client';
import { redactAdmin } from '../domain/admin-command';
import { AdminApi } from './admin-api';
describe('Actual administration contracts', () => {
  let call: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    call = vi
      .fn()
      .mockReturnValue(
        of(new HttpResponse({ body: { success: true, data: null } })),
      );
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClient, useValue: { call } }],
    });
  });
  it('treats process timeline reads as readonly and report requests as mutations', () => {
    const commands = TestBed.inject(AdminApi).commands('processes');
    expect(
      commands.find((command) => command.path.endsWith('/timeline'))?.mutation,
    ).toBe(false);
    expect(
      commands.find((command) => command.path.endsWith('/timeline/report'))
        ?.mutation,
    ).toBe(true);
  });
  it('uses the declared task_id route and excludes unrelated body fields', async () => {
    const api = TestBed.inject(AdminApi);
    const command = api
      .commands('tasks')
      .find((item) => item.path.endsWith('/retry'))!;
    await api.send(command, {
      body: { password: 'discard' },
      path: { task_id: 'opaque/id', ref_id: 'wrong' },
      query: {},
    });
    expect(call).toHaveBeenCalledWith(command.id, {
      path: { task_id: 'opaque/id' },
    });
  });
  it('keeps role assignment, connection selection and process recovery permissions distinct', () => {
    const api = TestBed.inject(AdminApi);
    expect(
      api.commands('users').find((item) => item.path.endsWith('/roles'))
        ?.permission,
    ).toBe('admin.permissions.manage');
    expect(
      api.commands('integrations').find((item) => item.path.endsWith('/select'))
        ?.permission,
    ).toBe('workflows.manage');
    expect(
      api.commands('processes').find((item) => item.path.endsWith('/recover'))
        ?.permission,
    ).toBe('processes.recover');
    expect(
      api
        .commands('audit')
        .filter((item) => !item.path.endsWith('/report'))
        .every(
          (item) =>
            !item.mutation && item.permission === 'admin.permissions.manage',
        ),
    ).toBe(true);
    expect(
      api
        .commands('agents')
        .some((item) => item.path.includes('/tool-approval')),
    ).toBe(false);
  });
  it('redacts nested credentials without changing references or ordinary values', () => {
    expect(
      redactAdmin({
        ref_id: 'current',
        nested: [{ access_token: 'secret', name: 'visible' }],
      }),
    ).toEqual({
      ref_id: 'current',
      nested: [{ access_token: '[redacted]', name: 'visible' }],
    });
  });
  it('removes untrusted prototype keys before retaining response data', () => {
    const raw = JSON.parse(
      '{"ref_id":"safe","__proto__":{"injected":true},"nested":{"constructor":{"private":true}}}',
    );
    const value = redactAdmin(raw);
    expect(value).toEqual({ ref_id: 'safe', nested: {} });
    expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
    expect(Object.prototype.hasOwnProperty.call(value, '__proto__')).toBe(
      false,
    );
  });
  it('preserves report page bounds and safe request IDs', async () => {
    call.mockReturnValue(
      of(
        new HttpResponse({
          headers: undefined,
          body: {
            success: true,
            result: {
              items: [{ ref_id: 'a', secret: 'never' }],
              page: 2,
              size: 20,
              total: 21,
              total_pages: 2,
            },
          },
        }),
      ),
    );
    const api = TestBed.inject(AdminApi);
    const command = api
      .commands('users')
      .find((item) => item.path.endsWith('/report'))!;
    const result = await api.send(command, {
      body: { page: 2, size: 20 },
      path: {},
      query: {},
    });
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(2);
    expect(result.value).toEqual([{ ref_id: 'a', secret: '[redacted]' }]);
  });
});
