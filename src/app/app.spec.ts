import { SessionContext } from './core/auth/session-context';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { App } from './app';
import { appConfig } from './app.config';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: appConfig.providers,
    }).compileComponents();
    TestBed.inject(SessionContext).resolve({
      status: 'authenticated',
      permissions: ['*'],
    });
  });

  it('renders the workspace through the root outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toBe('Operations');
    expect(element.querySelector('nav')?.getAttribute('aria-label')).toBe(
      'Main navigation',
    );
    expect(element.textContent).not.toContain('Hello, ng-architect');
  });
});
