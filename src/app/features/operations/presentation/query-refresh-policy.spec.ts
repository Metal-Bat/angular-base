import { signal, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NotificationPreview } from '../../../core/notifications/notification-preview';
import { BoundedPolling } from '../../../core/transport/bounded-polling';
import { WORKSPACE_PAGES } from '../bindings';
import { PagesPort } from '../application/workspace-ports';
import { By } from '@angular/platform-browser';
import { Panel } from 'primeng/panel';
import { TaskListQuery } from './task-list-query/task-list-query';
import { RequestList } from './request-list/request-list';
import { TaskInbox } from './task-inbox/task-inbox';

for (const component of [RequestList, TaskInbox] as Type<
  RequestList | TaskInbox
>[]) {
  describe(component.name + ' automatic refresh policy', () => {
    it('defers polls and coalesces notification refreshes throughout filter editing', async () => {
      const revision = signal(0);
      const state = signal<'ready' | 'loading' | 'error'>('ready');
      const load = vi.fn().mockResolvedValue(undefined);
      const pages: PagesPort = {
        state,
        load,
        catalog: () => [],
        cases: () => [],
        page: () => 1,
        totalPages: () => 1,
        appliedQuery: () => null,
        error: () => '',
      };
      let enabled: (() => boolean) | undefined;
      const polling = {
        start: vi.fn((_work: unknown, predicate: () => boolean) => {
          enabled = predicate;
        }),
      };
      TestBed.configureTestingModule({
        providers: [{ provide: NotificationPreview, useValue: { revision } }],
      });
      TestBed.overrideComponent(component, {
        set: {
          template: '',
          providers: [
            { provide: WORKSPACE_PAGES, useValue: pages },
            { provide: BoundedPolling, useValue: polling },
          ],
        },
      });
      const fixture = TestBed.createComponent(component);
      await fixture.whenStable();
      expect(load).toHaveBeenCalledTimes(1);
      expect(enabled?.()).toBe(true);
      fixture.componentInstance.queryEditing.set(true);
      revision.set(1);
      await fixture.whenStable();
      revision.set(2);
      await fixture.whenStable();
      expect(enabled?.()).toBe(false);
      expect(load).toHaveBeenCalledTimes(1);
      fixture.componentInstance.queryEditing.set(false);
      await fixture.whenStable();
      expect(load).toHaveBeenCalledTimes(2);
      expect(enabled?.()).toBe(true);
      state.set('loading');
      await fixture.whenStable();
      expect(enabled?.()).toBe(false);
    });
  });
}

it('forwards the task filter panel editing boundary to its refresh owner', async () => {
  const fixture = TestBed.createComponent(TaskListQuery);
  await fixture.whenStable();
  const editing = vi.fn();
  fixture.componentInstance.editing.subscribe(editing);
  const panel = fixture.debugElement.query(By.directive(Panel))
    .componentInstance as Panel;
  panel.expand();
  await fixture.whenStable();
  panel.collapse();
  await fixture.whenStable();
  expect(editing.mock.calls).toEqual([[true], [false]]);
});
