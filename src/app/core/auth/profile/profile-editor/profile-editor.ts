import { FilePicker } from '../../../../shared/ui/file-picker/file-picker';
import { TransferProgress } from '../../../../shared/ui/transfer-progress/transfer-progress';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Feedback } from '../../../feedback/feedback';
import { ActorState } from '../../actor-state';
import { Preferences } from '../../preferences';
import { ProfileSettings } from '../../profile-settings';
import { PrivateAvatar } from '../private-avatar/private-avatar';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
import { BinaryTransfer } from '../../../transport/binary-transfer';
import { readData } from '../../../transport/response-adapters';
import { ApiFailure, record } from '../../../transport/api-failure';
import { focusInvalidControl } from '../../../../shared/ui/focus-invalid-control';
@Component({
  selector: 'app-profile-editor',
  imports: [
    TransferProgress,
    FilePicker,
    FormsModule,
    ButtonDirective,
    InputTextModule,
    LocalizePipe,
    ControlField,
    PrivateAvatar,
  ],
  providers: [BinaryTransfer],
  templateUrl: './profile-editor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileEditor {
  readonly profile = inject(ProfileSettings);
  readonly preferences = inject(Preferences);
  private readonly actor = inject(ActorState);
  readonly transfer = inject(BinaryTransfer);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly saved = signal(false);
  readonly reconcileRequired = signal(false);
  readonly pendingAvatar = signal<string | null>(null);
  readonly candidateAvatar = signal<File | null>(null);
  discardAvatar(): void {
    if (!this.busy() && !this.transfer.busy()) {
      this.pendingAvatar.set(null);
      this.candidateAvatar.set(null);
    }
  }
  private readonly form = viewChild<ElementRef<HTMLFormElement>>('profileForm');
  private readonly renderInjector = inject(Injector);
  private generation = 0;
  private avatarWriting = false;
  private baseline: string | null = null;
  private readonly feedback = inject(Feedback);
  dirty(): boolean {
    return (
      this.baseline !== null &&
      JSON.stringify([this.firstName, this.lastName]) !== this.baseline
    );
  }
  async canLeave(): Promise<boolean> {
    if (this.busy() || this.transfer.busy() || this.avatarWriting) {
      return false;
    }
    return (
      (!this.dirty() && !this.pendingAvatar()) ||
      this.feedback.confirm('Discard unsaved profile changes?')
    );
  }
  firstName = '';
  lastName = '';
  constructor() {
    const release = this.actor.register(() => {
      this.generation++;
      this.avatarWriting = false;
      this.baseline = null;
      this.firstName = this.lastName = '';
      this.error.set('');
      this.busy.set(false);
      this.saved.set(false);
      this.reconcileRequired.set(false);
      this.pendingAvatar.set(null);
      this.candidateAvatar.set(null);
    });
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
      release();
      this.pendingAvatar.set(null);
      this.candidateAvatar.set(null);
    });
    void this.load();
  }
  async load(): Promise<void> {
    const initialGeneration = this.generation;
    if (!(await this.canLeave()) || initialGeneration !== this.generation) {
      return;
    }
    this.busy.set(true);
    this.error.set('');
    const epoch = this.actor.epoch;
    const generation = this.generation;
    try {
      const value = await this.profile.read();
      if (epoch !== this.actor.epoch || generation !== this.generation) {
        return;
      }
      this.reconcileRequired.set(false);
      this.firstName = value.first_name ?? '';
      this.lastName = value.last_name ?? '';
      this.baseline = JSON.stringify([this.firstName, this.lastName]);
    } catch {
      if (epoch === this.actor.epoch && generation === this.generation) {
        this.error.set('This resource is unavailable.');
      }
    } finally {
      if (epoch === this.actor.epoch && generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  nameError(value: string): string {
    return Array.from(value).length > 255 ? 'Use at most 255 characters.' : '';
  }
  private validateNames(avatar: string | null | undefined): boolean {
    if (
      avatar !== undefined ||
      (!this.nameError(this.firstName) && !this.nameError(this.lastName))
    ) {
      return true;
    }
    const generation = this.generation;
    focusInvalidControl(
      () => this.form()?.nativeElement,
      () => generation === this.generation,
      this.renderInjector,
    );
    return false;
  }
  private needsRead(failure: unknown): boolean {
    return !(
      failure instanceof ApiFailure &&
      !failure.uncertain &&
      [400, 422].includes(failure.httpStatus)
    );
  }
  private patch(
    ref: string,
    avatar: string | null | undefined,
  ): Parameters<ProfileSettings['save']>[0] {
    return {
      ref_id: ref,
      ...(avatar !== undefined
        ? { avatar_ref_id: avatar }
        : {
            first_name: this.firstName || null,
            last_name: this.lastName || null,
          }),
    };
  }
  async save(avatar?: string | null, held = false): Promise<void> {
    const value = this.profile.value();
    if (!value || this.busy() || this.reconcileRequired()) {
      return;
    }
    if (!this.validateNames(avatar)) {
      return;
    }
    const release =
      avatar !== undefined && !held
        ? this.preferences.beginProfileMutation()
        : null;
    if (avatar !== undefined && !held && !release) {
      return;
    }
    const submittedNames =
      avatar === undefined
        ? JSON.stringify([this.firstName, this.lastName])
        : null;
    this.busy.set(true);
    this.error.set('');
    this.saved.set(false);
    const epoch = this.actor.epoch;
    const generation = this.generation;
    try {
      const saved = await this.profile.save(this.patch(value.ref_id, avatar));
      await this.acceptSaved(saved, avatar, epoch, generation, submittedNames);
    } catch (failure) {
      if (epoch === this.actor.epoch && generation === this.generation) {
        this.reconcileRequired.set(this.needsRead(failure));
        this.error.set(
          'Your edits have been kept. Check the latest revision before continuing.',
        );
      }
    } finally {
      release?.();
      if (epoch === this.actor.epoch && generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  private async acceptSaved(
    saved: NonNullable<ReturnType<ProfileSettings['value']>>,
    avatar: string | null | undefined,
    epoch: number,
    generation: number,
    submittedNames: string | null,
  ): Promise<void> {
    if (epoch === this.actor.epoch && generation === this.generation) {
      if (avatar !== undefined && saved.avatar_ref_id !== avatar) {
        throw Error('Avatar association is unconfirmed');
      }
      if (avatar === this.pendingAvatar()) {
        this.pendingAvatar.set(null);
        this.candidateAvatar.set(null);
      }
      if (avatar === undefined) {
        if (
          JSON.stringify([this.firstName, this.lastName]) === submittedNames
        ) {
          this.firstName = saved.first_name ?? '';
          this.lastName = saved.last_name ?? '';
        }
        this.baseline = JSON.stringify([
          saved.first_name ?? '',
          saved.last_name ?? '',
        ]);
      }
      if (avatar !== undefined) {
        await this.preferences.load();
      }
      if (epoch === this.actor.epoch && generation === this.generation) {
        this.saved.set(!this.dirty());
      }
    }
  }
  async avatar(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) {
      await this.uploadAvatar(file);
    }
  }
  async uploadAvatar(file: File): Promise<void> {
    if (
      this.busy() ||
      this.transfer.busy() ||
      this.pendingAvatar() ||
      this.reconcileRequired()
    ) {
      return;
    }
    const release = this.preferences.beginProfileMutation();
    if (!release) {
      return;
    }
    this.avatarWriting = true;
    const epoch = this.actor.epoch;
    const generation = this.generation;
    try {
      const response = await this.transfer.run(
        'upload_image_api_v1_media_images_post',
        {
          body: { upload: file },
        },
      );
      if (!response.body || response.body.size > 1048576) {
        throw Error('Invalid upload response');
      }
      const body: unknown = JSON.parse(await response.body.text());
      const ref = readData(response.clone({ body }), (raw) => {
        const value = record(raw);
        if (typeof value['ref_id'] !== 'string' || !value['ref_id']) {
          throw Error('Invalid upload');
        }
        return value['ref_id'];
      });
      if (epoch === this.actor.epoch && generation === this.generation) {
        this.pendingAvatar.set(ref);
        this.candidateAvatar.set(file);
        await this.save(ref, true);
      }
    } catch {
      if (epoch === this.actor.epoch && generation === this.generation) {
        this.error.set('Private content is unavailable');
      }
    } finally {
      release();
      if (epoch === this.actor.epoch && generation === this.generation) {
        this.avatarWriting = false;
      }
    }
  }
  async checkAvatar(): Promise<void> {
    if (this.busy() || this.transfer.busy()) {
      return;
    }
    const epoch = this.actor.epoch;
    const generation = this.generation;
    const nameSnapshot = JSON.stringify([this.firstName, this.lastName]);
    const namesWereDirty = this.dirty();
    this.busy.set(true);
    try {
      const current = await this.profile.read();
      if (epoch !== this.actor.epoch || generation !== this.generation) {
        return;
      }
      if (
        !namesWereDirty &&
        JSON.stringify([this.firstName, this.lastName]) === nameSnapshot
      ) {
        this.firstName = current.first_name ?? '';
        this.lastName = current.last_name ?? '';
      }
      this.baseline = JSON.stringify([
        current.first_name ?? '',
        current.last_name ?? '',
      ]);
      this.reconcileRequired.set(false);
      this.error.set('');
      if (current.avatar_ref_id === this.pendingAvatar()) {
        this.pendingAvatar.set(null);
        this.candidateAvatar.set(null);
      }
    } catch {
      if (epoch === this.actor.epoch && generation === this.generation) {
        this.error.set('This resource is unavailable.');
      }
    } finally {
      if (epoch === this.actor.epoch && generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  async download(): Promise<void> {
    const generation = this.generation;
    const ref = this.profile.value()?.avatar_ref_id;
    try {
      if (ref) {
        const response = await this.transfer.run(
          'download_image_api_v1_media_images__ref_id__get',
          { path: { ref_id: ref } },
        );
        if (generation === this.generation) {
          this.transfer.download(response);
        }
      }
    } catch {
      if (generation === this.generation) {
        this.error.set('Private content is unavailable');
      }
    }
  }
}
