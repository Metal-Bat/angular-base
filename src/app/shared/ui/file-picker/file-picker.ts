import { safeFilename } from '../../../core/transport/binary-transfer';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { ActorState } from '../../../core/auth/actor-state';
import { Locale } from '../../../core/localization/locale';
import { LocalizePipe } from '../localize-pipe';

@Component({
  selector: 'app-file-picker',
  imports: [LocalizePipe],
  templateUrl: './file-picker.html',
  styleUrl: './file-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilePicker {
  readonly controlId = input.required<string>();
  readonly label = input('Upload attachment');
  readonly accept = input('');
  readonly capture = input<'environment' | null>(null);
  readonly disabled = input(false);
  readonly owner = input('');
  readonly picked = output<File>();
  readonly locale = inject(Locale);
  readonly selection = linkedSignal({
    source: () => this.owner(),
    computation: (): { name: string; size: number } | null => null,
  });
  readonly error = linkedSignal({
    source: () => this.owner(),
    computation: () => '',
  });
  constructor() {
    const release = inject(ActorState).register(() => {
      this.selection.set(null);
      this.error.set('');
    });
    inject(DestroyRef).onDestroy(release);
  }
  choose(event: Event): void {
    const picker = event.target as HTMLInputElement;
    const files = Array.from(picker.files ?? []);
    picker.value = '';
    this.select(files);
  }
  drag(event: DragEvent): void {
    if (!Array.from(event.dataTransfer?.types ?? []).includes('Files')) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = this.disabled() ? 'none' : 'copy';
    }
  }
  drop(event: DragEvent): void {
    if (!Array.from(event.dataTransfer?.types ?? []).includes('Files')) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.select(Array.from(event.dataTransfer?.files ?? []));
  }
  private select(files: readonly File[]): void {
    if (this.disabled() || !files.length) {
      return;
    }
    if (files.length !== 1) {
      this.error.set('Choose one file at a time.');
      return;
    }
    this.error.set('');
    const file = files[0];
    this.selection.set({ name: safeFilename(file.name), size: file.size });
    this.picked.emit(file);
  }
}
