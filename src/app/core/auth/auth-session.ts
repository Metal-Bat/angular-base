import { HttpClient } from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../transport/api-client';
import { record } from '../transport/api-failure';
import { readData, readResultPage } from '../transport/response-adapters';
import { canEnterArea, hasPermissions } from '../permissions/area-access';
import { SessionContext } from './session-context';
import { safeReturnPath } from './safe-return-path';

export type ActorProfile = { ref: string; username: string };
@Injectable({ providedIn: 'root' })
export class AuthSession {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiClient);
  private readonly context = inject(SessionContext);
  private readonly router = inject(Router);
  private generation = 0;
  private pending: Promise<void> | null = null;
  private revalidation: Promise<void> | null = null;
  private revalidateAgain = false;
  private channel: BroadcastChannel | null = null;
  readonly csrf = signal<string | null>(null);
  readonly profile = signal<ActorProfile | null>(null);
  readonly unavailable = signal(false);

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('workspace-session');
      this.channel.onmessage = (event: MessageEvent<unknown>): void => {
        const data = event.data;
        if (data === 'logout') {
          this.invalidate(false);
        }
        if (data === 'changed') {
          this.invalidate(false);
          void this.bootstrap();
        }
      };
    }
    const focus = (): void => {
      if (this.profile()) {
        void this.revalidate();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', focus);
    }
    inject(DestroyRef).onDestroy((): void => {
      this.channel?.close();
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', focus);
      }
    });
  }

  bootstrap(): Promise<void> {
    if (this.pending) {
      return this.pending;
    }
    const generation = ++this.generation;
    this.revalidation = null;
    this.context.beginResolution();
    this.profile.set(null);
    this.unavailable.set(false);
    const work = this.load(generation).finally((): void => {
      if (this.pending === work) {
        this.pending = null;
      }
    });
    this.pending = work;
    return work;
  }
  private async load(generation: number): Promise<void> {
    try {
      const status = record(
        await firstValueFrom(this.http.get<unknown>('/session/status')),
      );
      if (generation !== this.generation) {
        return;
      }
      if (status['authenticated'] === false) {
        this.context.clear();
        this.csrf.set(null);
        return;
      }
      if (
        status['authenticated'] !== true ||
        typeof status['csrfToken'] !== 'string'
      ) {
        throw new Error('Invalid session response.');
      }
      this.csrf.set(status['csrfToken']);
      const response = await firstValueFrom(
        this.api.call('me_api_v1_auth_me_get', {}),
      );
      const profile = readData(response, (value): ActorProfile => {
        const user = record(value);
        if (
          typeof user['ref_id'] !== 'string' ||
          typeof user['username'] !== 'string' ||
          user['is_active'] !== true
        ) {
          throw new Error('Invalid actor response.');
        }
        return { ref: user['ref_id'], username: user['username'] };
      });
      const permissions = await this.loadPermissions();
      if (generation !== this.generation) {
        return;
      }
      this.context.resolve({ status: 'authenticated', permissions });
      this.profile.set(profile);
    } catch {
      if (generation === this.generation) {
        this.csrf.set(null);
        this.unavailable.set(true);
        // Leave context unresolved: service failure does not imply valid access.
      }
    }
  }
  private async loadPermissions(): Promise<readonly string[]> {
    const permissions = new Set<string>();
    for (let index = 1; index <= 100; index += 1) {
      const response = await firstValueFrom(
        this.api.call(
          'current_permissions_api_v1_auth_permissions_search_post',
          { body: { page: index, size: 100 } },
        ),
      );
      const page = readResultPage(response, (value): string => {
        if (typeof value !== 'string' || value.length > 255) {
          throw new Error('Invalid permission response.');
        }
        return value;
      });
      if (page.page !== index || page.size !== 100) {
        throw new Error('Invalid permission pagination.');
      }
      page.items.forEach((permission): void => {
        permissions.add(permission);
      });
      if (index >= page.totalPages) {
        return [...permissions];
      }
    }
    throw new Error('Permission response exceeds supported bounds.');
  }
  revalidate(): Promise<void> {
    // A focus during an older read queues one fresh read without overlap.
    if (this.revalidation) {
      this.revalidateAgain = true;
      return this.revalidation;
    }
    if (this.pending || !this.profile()) {
      return Promise.resolve();
    }
    const work = this.drainRevalidation(this.generation).finally((): void => {
      if (this.revalidation === work) {
        this.revalidation = null;
      }
    });
    this.revalidation = work;
    return work;
  }
  private async drainRevalidation(generation: number): Promise<void> {
    do {
      this.revalidateAgain = false;
      await this.refreshPermissions(generation);
    } while (
      this.revalidateAgain &&
      generation === this.generation &&
      this.profile()
    );
  }
  private async refreshPermissions(generation: number): Promise<void> {
    try {
      const permissions = await this.loadPermissions();
      if (generation !== this.generation) {
        return;
      }
      this.context.updatePermissions(permissions);
      let active = this.router.routerState.snapshot.root;
      let revokedRoute = false;
      while (active) {
        const policy = active.routeConfig?.data;
        if (
          policy?.['access'] === 'authenticated' &&
          !hasPermissions(
            permissions,
            policy['requiredPermissions'] ?? [],
            policy['anyPermissions'] ?? [],
          )
        ) {
          revokedRoute = true;
        }
        if (!active.firstChild) {
          break;
        }
        active = active.firstChild;
      }
      const area = this.router.url.split('/')[1];
      if (
        (area === 'operations' ||
          area === 'studio' ||
          area === 'administration') &&
        (!canEnterArea(permissions, area) || revokedRoute)
      ) {
        await this.router.navigateByUrl('/forbidden');
      }
    } catch {
      if (generation === this.generation) {
        this.invalidate();
      }
    }
  }
  async login(
    username: string,
    password: string,
    returnTo: string | null,
  ): Promise<void> {
    this.invalidate(false);
    const generation = this.generation;
    const response = record(
      await firstValueFrom(
        this.http.post<unknown>('/session/login', { username, password }),
      ),
    );
    if (generation !== this.generation) {
      if (typeof response['csrfToken'] === 'string') {
        await firstValueFrom(
          this.http.post(
            '/session/logout',
            {},
            { headers: { 'x-csrf-token': response['csrfToken'] } },
          ),
        );
      }
      throw new Error('Sign-in cancelled.');
    }
    await this.bootstrap();
    if (!this.profile()) {
      throw new Error('Could not verify the signed-in account.');
    }
    this.channel?.postMessage('changed');
    const snapshot = this.context.snapshot();
    const permissions =
      snapshot.status === 'authenticated' ? snapshot.permissions : [];
    const destination =
      safeReturnPath(returnTo) ??
      (['operations', 'studio', 'administration'] as const)
        .filter((area) => canEnterArea(permissions, area))
        .map((area) => '/' + area)[0] ??
      '/forbidden';
    await this.router.navigateByUrl(destination);
  }
  async logout(): Promise<void> {
    const csrf = this.csrf();
    this.invalidate();
    try {
      await firstValueFrom(
        this.http.post(
          '/session/logout',
          {},
          { headers: csrf ? { 'x-csrf-token': csrf } : {} },
        ),
      );
    } finally {
      await this.router.navigateByUrl('/login');
    }
  }
  invalidate(broadcast = true): void {
    this.generation += 1;
    this.pending = null;
    this.revalidation = null;
    this.csrf.set(null);
    this.profile.set(null);
    this.context.clear();
    if (broadcast) {
      this.channel?.postMessage('logout');
    }
    if (
      /^\/(operations|studio|administration|account)(\/|\?|$)/.test(
        this.router.url,
      )
    ) {
      void this.router.navigateByUrl('/login');
    }
  }
}
