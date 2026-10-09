import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SessionContext } from '../../../../core/auth/session-context';
import { ActorState } from '../../../../core/auth/actor-state';
import { Feedback } from '../../../../core/feedback/feedback';
import { Locale } from '../../../../core/localization/locale';
import { helpIdentity } from '../../domain/help-catalog';
import { HelpPage } from './help-page';
describe('Permission-aware session help', () => {
  const confirm = vi.fn();
  beforeEach(() => {
    confirm.mockReset().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: Feedback, useValue: { confirm } },
      ],
    });
    TestBed.inject(SessionContext).resolve({
      status: 'authenticated',
      permissions: ['requests.start'],
    });
  });
  it('marks only explicitly opened topics and scopes status to locale and revision', async () => {
    const fixture = TestBed.createComponent(HelpPage);
    const vm = fixture.componentInstance;
    await fixture.whenStable();
    expect(vm.viewed()).toEqual([]);
    expect(
      vm.topics().some((topic) => topic.help_key === 'studio.promote'),
    ).toBe(false);
    const topic = vm.topics()[0];
    vm.dismiss(topic);
    expect(vm.viewed()).toEqual([]);
    vm.open(topic);
    expect(vm.status(topic)).toBe('Viewed this session');
    await TestBed.inject(Locale).set('fa');
    expect(vm.status(topic)).toBe('Not viewed this session');
    expect(helpIdentity({ ...topic, revision: '2' }, 'en')).not.toBe(
      helpIdentity(topic, 'en'),
    );
    vm.open(topic);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain(topic.body.fa);
    TestBed.inject(ActorState).reset();
    expect(vm.selected()).toBeNull();
    expect(vm.viewed()).toEqual([]);
    expect(vm.dismissed()).toEqual([]);
  });
  it('discards a reset confirmation from the previous actor', async () => {
    let complete!: (answer: boolean) => void;
    confirm.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          complete = resolve;
        }),
    );
    const vm = TestBed.createComponent(HelpPage).componentInstance;
    const work = vm.reset();
    TestBed.inject(ActorState).reset();
    vm.open(vm.topics()[0]);
    complete(true);
    await work;
    expect(vm.viewed()).toHaveLength(1);
  });
  it('restores focus to the opening control when closing a topic', async () => {
    const fixture = TestBed.createComponent(HelpPage);
    await fixture.whenStable();
    const opener = fixture.nativeElement.querySelector(
      '[data-help-key] button',
    ) as HTMLButtonElement;
    opener.click();
    await fixture.whenStable();
    expect(document.activeElement?.tagName).toBe('H2');
    fixture.componentInstance.close();
    expect(document.activeElement).toBe(opener);
  });
});
