import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { STUDIO_API } from '../../bindings';
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
});
