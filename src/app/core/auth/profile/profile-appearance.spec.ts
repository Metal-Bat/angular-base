import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { ActorState } from '../actor-state';
import { Locale } from '../../localization/locale';
import { ProfileAppearance } from './profile-appearance';

describe('Profile display controls', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideRouter([])],
    }),
  );
  it('applies named appearance and language without persistence and resets on actor change', async () => {
    const fixture = TestBed.createComponent(ProfileAppearance);
    const component = fixture.componentInstance;
    component.theme('violet-dark');
    await component.language('fa');
    await fixture.whenStable();
    expect(component.scheme.selected()).toBe('violet-dark');
    expect(component.locale.language()).toBe('fa');
    expect(fixture.nativeElement.textContent).toContain(
      'تغییرات به‌طور خودکار',
    );
    TestBed.inject(ActorState).reset();
    expect(component.scheme.selected()).toBe('blue-light');
    expect(component.locale.language()).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });
  it('rejects unsupported selections without altering canonical settings', async () => {
    const component =
      TestBed.createComponent(ProfileAppearance).componentInstance;
    component.theme('custom-css');
    await component.language('invented');
    expect(component.scheme.selected()).toBe('blue-light');
    expect(TestBed.inject(Locale).language()).toBe('en');
  });
});
