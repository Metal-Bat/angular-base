import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { finishSessionBootstrap } from './testing/session-bootstrap';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { App } from './app';
import { appConfig } from './app.config';

describe('App', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [...appConfig.providers, provideHttpClientTesting()],
    }).compileComponents();
    await finishSessionBootstrap({
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
