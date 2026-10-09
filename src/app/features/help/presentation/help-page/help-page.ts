import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ActorState } from '../../../../core/auth/actor-state';
import { SessionContext } from '../../../../core/auth/session-context';
import { hasPermissions } from '../../../../core/permissions/area-access';
import { Feedback } from '../../../../core/feedback/feedback';
import { Locale } from '../../../../core/localization/locale';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import {
  helpCatalog,
  helpIdentity,
  helpRoutes,
  HelpTopic,
} from '../../domain/help-catalog';

@Component({
  selector: 'app-help-page',
  imports: [ButtonModule, RouterLink, LocalizePipe],
  host: { class: 'console-page' },
  templateUrl: './help-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpPage {
  private readonly session = inject(SessionContext);
  private readonly feedback = inject(Feedback);
  readonly locale = inject(Locale);
  readonly language = computed(() =>
    this.locale.language() === 'fa' ? 'fa' : 'en',
  );
  readonly selected = signal<HelpTopic | null>(null);
  readonly viewed = signal<readonly string[]>([]);
  readonly dismissed = signal<readonly string[]>([]);
  readonly routes = helpRoutes;
  readonly suggested =
    inject(ActivatedRoute).snapshot.queryParamMap.get('topic');
  readonly title = viewChild<ElementRef<HTMLElement>>('topicTitle');
  readonly topics = computed(() => {
    const actor = this.session.snapshot();
    return actor.status === 'authenticated'
      ? helpCatalog.filter((topic) =>
          hasPermissions(actor.permissions, [], topic.permissions),
        )
      : [];
  });
  private generation = 0;
  private opener: HTMLElement | null = null;
  constructor() {
    const release = inject(ActorState).register(() => {
      this.generation++;
      this.opener = null;
      this.selected.set(null);
      this.viewed.set([]);
      this.dismissed.set([]);
    });
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
      release();
    });
    afterRenderEffect(() => {
      if (this.selected()) {
        this.title()?.nativeElement.focus();
      }
    });
  }
  status(topic: HelpTopic): string {
    const identity = helpIdentity(topic, this.language());
    return this.dismissed().includes(identity)
      ? 'Dismissed this session'
      : this.viewed().includes(identity)
        ? 'Viewed this session'
        : 'Not viewed this session';
  }
  open(topic: HelpTopic, event?: Event): void {
    if (!this.topics().includes(topic)) {
      return;
    }
    this.opener =
      event?.currentTarget instanceof HTMLElement ? event.currentTarget : null;
    const identity = helpIdentity(topic, this.language());
    this.viewed.update((items) => [...new Set([...items, identity])]);
    this.dismissed.update((items) => items.filter((item) => item !== identity));
    this.selected.set(topic);
  }
  dismiss(topic: HelpTopic): void {
    if (!this.topics().includes(topic)) {
      return;
    }
    this.dismissed.update((items) => [
      ...new Set([...items, helpIdentity(topic, this.language())]),
    ]);
    this.selected.set(null);
  }
  close(): void {
    this.selected.set(null);
    if (this.opener?.isConnected) {
      this.opener.focus();
    }
    this.opener = null;
  }
  async reset(): Promise<void> {
    const generation = this.generation;
    if (
      (await this.feedback.confirm('Reset help for this session?')) &&
      generation === this.generation
    ) {
      this.viewed.set([]);
      this.dismissed.set([]);
      this.selected.set(null);
    }
  }
}
