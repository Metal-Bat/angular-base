import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { readRuntimeDocument } from '../../../forms/infrastructure/runtime-document-adapter';
import { runtimeFixture } from '../../../forms/testing/runtime-fixtures';
import {
  JsonObject,
  RuntimeCompatibility,
} from '../../../forms/domain/runtime-document';
import { STUDIO_API } from '../../bindings';
import { FormDisplay } from './form-display';
const row = {
  ref_id: 'version-current',
  number: 1,
  status: 'PUBLISHED',
  private_note: 'excluded',
  data_schema: { type: 'object', properties: { amount: { type: 'number' } } },
  render_schema: { root: { component: 'vertical', children: [] } },
};
describe('Form display', () => {
  const get = vi.fn();
  const search = vi.fn();
  const preview = vi.fn();
  const write = vi.fn();
  beforeEach(() => {
    get.mockReset().mockResolvedValue(row);
    search
      .mockReset()
      .mockResolvedValue({ items: [row], page: 1, totalPages: 2 });
    preview
      .mockReset()
      .mockImplementation(
        async (
          _documents: JsonObject,
          data: JsonObject,
          purpose: string,
          locale: string,
        ) => {
          const dto = runtimeFixture('REQUEST');
          dto['purpose'] = purpose;
          dto['resolved_locale'] = locale;
          dto['direction'] = locale === 'en' ? 'ltr' : 'rtl';
          dto['data'] = { ...(dto['data'] as JsonObject), ...data };
          dto['actions'] = [];
          if (purpose === 'summary' || purpose === 'print') {
            dto['writable_scopes'] = [];
            dto['field_metadata'] = (dto['field_metadata'] as JsonObject[]).map(
              (field) => ({ ...field, writable: false }),
            );
          }
          return readRuntimeDocument(dto);
        },
      );
    write.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: STUDIO_API, useValue: { get, search, preview, write } },
      ],
    });
  });
  it('loads scoped versions and previews only authored documents without saving', async () => {
    const fixture = TestBed.createComponent(FormDisplay);
    fixture.componentRef.setInput('form', 'form-current');
    await fixture.whenStable();
    expect(search).toHaveBeenCalledWith('form-versions', 1, {
      form_ref_id: 'form-current',
      size: 20,
      filters: [],
      sort_orders: [{ field_name: 'number', operation: 'desc' }],
    });
    expect(preview).toHaveBeenCalledWith(
      { data_schema: row.data_schema, render_schema: row.render_schema },
      {},
      'edit',
      'en',
      { item_identity: {} },
    );
    expect(
      fixture.nativeElement.querySelector('app-runtime-form'),
    ).not.toBeNull();
    expect(write).not.toHaveBeenCalled();
  });
  it('preserves false and zero sample answers across all views and locales, and explicitly resets them', async () => {
    const fixture = TestBed.createComponent(FormDisplay);
    fixture.componentRef.setInput('version', 'direct-version');
    await fixture.whenStable();
    const view = fixture.componentInstance;
    view.editSample({ scope: '/properties/amount', value: 0 });
    view.editSample({ scope: '/properties/approved', value: false });
    for (const purpose of ['summary', 'print', 'correction', 'edit']) {
      view.purpose.set(purpose);
      view.locale.set('fa');
      await view.refresh();
      expect(view.runtime()?.purpose).toBe(purpose);
      expect(view.data()['amount']).toBe(0);
      expect(view.data()['approved']).toBe(false);
      expect(view.runtime()?.locale.direction).toBe('rtl');
    }
    await view.refresh(true);
    expect(preview.mock.calls.at(-1)?.[1]).toEqual({});
    expect(write).not.toHaveBeenCalled();
  });
  it('clears a stale preview on failure and ignores late results after actor cleanup', async () => {
    const fixture = TestBed.createComponent(FormDisplay);
    fixture.componentRef.setInput('version', 'direct-version');
    await fixture.whenStable();
    const view = fixture.componentInstance;
    preview.mockRejectedValueOnce(Error('offline'));
    await view.refresh();
    expect(view.runtime()).toBeNull();
    expect(view.error()).toBe('The form display is unavailable.');
    let resolve!: (result: RuntimeCompatibility) => void;
    preview.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const pending = view.refresh();
    TestBed.inject(ActorState).reset();
    resolve(readRuntimeDocument(runtimeFixture()));
    await pending;
    expect(view.runtime()).toBeNull();
    expect(view.current()).toBeNull();
    expect(view.data()).toEqual({});
  });
  it('offers creation when there are no versions and keeps sample answers out of a different version', async () => {
    search.mockResolvedValueOnce({ items: [], page: 1, totalPages: 0 });
    const fixture = TestBed.createComponent(FormDisplay);
    fixture.componentRef.setInput('form', 'empty-form');
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain(
      'This form has no versions yet.',
    );
    expect(preview).not.toHaveBeenCalled();
    const view = fixture.componentInstance;
    await view.show('first');
    view.editSample({ scope: '/properties/amount', value: 0 });
    await view.show('second');
    expect(preview.mock.calls.at(-1)?.[1]).toEqual({});
  });
});
