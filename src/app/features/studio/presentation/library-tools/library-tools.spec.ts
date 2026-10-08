import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { STUDIO_API } from '../../bindings';
import { Feedback } from '../../../../core/feedback/feedback';
import { ActorState } from '../../../../core/auth/actor-state';
import { LibraryTools } from './library-tools';
describe('Reviewed library upgrade', () => {
  const auxiliary = vi.fn();
  beforeEach(() => {
    auxiliary.mockReset();
    auxiliary.mockImplementation(async (tool: string): Promise<unknown> =>
      tool === 'library'
        ? { items: [], totalPages: 0 }
        : { compatible: true, impacts: [] },
    );
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: STUDIO_API, useValue: { auxiliary } },
      ],
    });
  });
  it('invalidates approval when the reviewed payload changes', async () => {
    const fixture = TestBed.createComponent(LibraryTools);
    await fixture.whenStable();
    const editor = fixture.componentInstance;
    editor.changed(
      '{"targets":[{"kind":"form","version_ref_id":"current","replacements":{"old":"new"}}]}',
    );
    await editor.previewUpgrade();
    expect(editor.upgradeReady()).toBe(true);
    editor.changed('{"targets":[]}');
    await editor.applyUpgrade();
    expect(editor.upgradeReady()).toBe(false);
    expect(
      auxiliary.mock.calls.some((call) => call[0] === 'upgradeApply'),
    ).toBe(false);
  });
  it('disables apply for incompatible impacts', async () => {
    const fixture = TestBed.createComponent(LibraryTools);
    await fixture.whenStable();
    auxiliary.mockResolvedValue({
      compatible: false,
      impacts: [{ compatible: false, issues: [{ code: 'immutable' }] }],
    });
    await fixture.componentInstance.previewUpgrade();
    expect(fixture.componentInstance.upgradeReady()).toBe(false);
  });
  it('keeps applied search, kind and selector mode across both directions of paging', async () => {
    const fixture = TestBed.createComponent(LibraryTools);
    await fixture.whenStable();
    const library = fixture.componentInstance;
    auxiliary.mockResolvedValue({
      items: [{ key: 'version', value: 'Chosen' }],
      totalPages: 2,
    });
    library.kind = 'data_type';
    library.search = 'approved';
    await library.load(1, true, true);
    library.kind = 'subprocess';
    library.search = 'unapplied';
    await library.load(2);
    expect(auxiliary).toHaveBeenLastCalledWith('selection', {
      page: 2,
      size: 20,
      kind: 'data_type',
      locale: 'en',
      capabilities: [],
      search: 'approved',
    });
    await library.load(1);
    expect(auxiliary).toHaveBeenLastCalledWith('selection', {
      page: 1,
      size: 20,
      kind: 'data_type',
      locale: 'en',
      capabilities: [],
      search: 'approved',
    });
    library.choose({ key: 'version', value: 'Chosen' });
    expect(library.kind).toBe('data_type');
  });
  it('freezes template creation while confirmation is pending and closes after acceptance', async () => {
    const fixture = TestBed.createComponent(LibraryTools);
    await fixture.whenStable();
    const library = fixture.componentInstance;
    library.reference = 'source';
    library.templateCode = 'copy';
    library.templateName = 'Copy';
    library.templateOpen.set(true);
    const creating = library.createTemplate();
    library.reference = 'changed';
    library.templateCode = 'changed';
    TestBed.inject(Feedback).answer(true);
    await creating;
    expect(auxiliary).toHaveBeenLastCalledWith('template', {
      kind: 'form',
      source_ref_id: 'source',
      code: 'copy',
      name: 'Copy',
      mode: 'COPY',
    });
    expect(library.templateOpen()).toBe(false);
    expect(library.templateCode).toBe('');
  });
  it('does not create a template after an actor change during confirmation', async () => {
    const fixture = TestBed.createComponent(LibraryTools);
    await fixture.whenStable();
    const library = fixture.componentInstance;
    library.reference = 'private';
    library.templateOpen.set(true);
    const creating = library.createTemplate();
    TestBed.inject(ActorState).reset();
    TestBed.inject(Feedback).answer(true);
    await creating;
    expect(auxiliary.mock.calls.some((call) => call[0] === 'template')).toBe(
      false,
    );
    expect(library.templateOpen()).toBe(false);
  });
});
