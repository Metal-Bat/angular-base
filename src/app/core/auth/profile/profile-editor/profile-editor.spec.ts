import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../actor-state';
import { Preferences } from '../../preferences';
import { ProfileSettings } from '../../profile-settings';
import { Feedback } from '../../../feedback/feedback';
import { ApiFailure } from '../../../transport/api-failure';
import { ProfileEditor } from './profile-editor';
const original = {
  ref_id: 'current',
  first_name: 'Original',
  last_name: 'Last',
  avatar_ref_id: null,
};
describe('Profile input and revision recovery', () => {
  const read = vi.fn();
  const save = vi.fn();
  const value = signal<typeof original | null>(null);
  beforeEach(() => {
    value.set(null);
    read.mockReset().mockImplementation(async () => {
      value.set(original);
      return original;
    });
    save.mockReset().mockResolvedValue(original);
    TestBed.configureTestingModule({
      providers: [
        { provide: ProfileSettings, useValue: { value, read, save } },
        {
          provide: Preferences,
          useValue: {
            loading: (): boolean => false,
            status: (): string => 'saved',
            beginProfileMutation: (): (() => void) => (): void => undefined,
            load: vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: Feedback,
          useValue: { confirm: vi.fn().mockResolvedValue(true) },
        },
      ],
    });
  });
  it.each(['firstName', 'lastName'] as const)(
    'rejects over-limit %s without sending and links its field error',
    async (field) => {
      const fixture = TestBed.createComponent(ProfileEditor);
      await fixture.whenStable();
      const id =
        field === 'firstName' ? 'profile-first-name' : 'profile-last-name';
      const control = fixture.nativeElement.querySelector('#' + id);
      // The test DOM omits this browser API; keep the real focus behavior under assertion.
      control.scrollIntoView = vi.fn();
      control.value = 'x'.repeat(256);
      control.dispatchEvent(new Event('input', { bubbles: true }));
      await fixture.whenStable();
      await fixture.componentInstance.save();
      expect(save).not.toHaveBeenCalled();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(control.scrollIntoView).toHaveBeenCalledWith({
        block: 'nearest',
        behavior: 'smooth',
      });
      expect(control.getAttribute('aria-invalid')).toBe('true');
      expect(control.getAttribute('aria-describedby')).toContain(id + '-error');
      expect(
        fixture.nativeElement.querySelector('#' + id + '-error').textContent,
      ).toBeTruthy();
    },
  );
  it('uses Unicode character limits and preserves independent names during avatar changes', async () => {
    const fixture = TestBed.createComponent(ProfileEditor);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.firstName = '🙂'.repeat(255);
    await vm.save();
    expect(save.mock.calls[0][0].first_name).toBe('🙂'.repeat(255));
    vm.firstName = 'Unsaved name';
    await vm.save(null);
    expect(save.mock.calls[1][0]).toEqual({
      ref_id: 'current',
      avatar_ref_id: null,
    });
    expect(vm.firstName).toBe('Unsaved name');
  });
  it.each([
    new ApiFailure(409, 'revision', null, []),
    new ApiFailure(0, null, null, [], true),
  ])(
    'retains failed edits and requires an authoritative reload: %s',
    async (error) => {
      const fixture = TestBed.createComponent(ProfileEditor);
      await fixture.whenStable();
      const vm = fixture.componentInstance;
      vm.firstName = 'Preserved draft';
      save.mockRejectedValueOnce(error);
      await vm.save();
      vm.lastName = 'Independent draft';
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('button[type=submit]').disabled,
      ).toBe(true);
      await vm.save();
      expect(save).toHaveBeenCalledTimes(1);
      expect(vm.firstName).toBe('Preserved draft');
      read.mockImplementationOnce(async () => {
        const current = {
          ...original,
          ref_id: 'next',
          first_name: 'Authoritative',
        };
        value.set(current);
        return current;
      });
      await vm.load();
      expect(vm.firstName).toBe('Authoritative');
      await vm.save();
      expect(save.mock.calls[1][0].ref_id).toBe('next');
    },
  );
  it('retains a newer name draft when an older successful save arrives', async () => {
    const fixture = TestBed.createComponent(ProfileEditor);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    let finish!: (value: typeof original) => void;
    save.mockImplementationOnce(
      () => new Promise<typeof original>((resolve) => (finish = resolve)),
    );
    vm.firstName = 'Submitted';
    const writing = vm.save();
    vm.firstName = 'Newer unsaved';
    finish({ ...original, first_name: 'Submitted' });
    await writing;
    expect(vm.firstName).toBe('Newer unsaved');
    expect(vm.dirty()).toBe(true);
    expect(vm.saved()).toBe(false);
  });
  it('clears drafts and ignores a late write after actor cleanup', async () => {
    const fixture = TestBed.createComponent(ProfileEditor);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    let finish!: (value: typeof original) => void;
    save.mockImplementationOnce(
      () => new Promise<typeof original>((resolve) => (finish = resolve)),
    );
    vm.firstName = 'Old account';
    const writing = vm.save();
    TestBed.inject(ActorState).reset();
    finish(original);
    await writing;
    expect(vm.firstName).toBe('');
    expect(vm.saved()).toBe(false);
  });
});
