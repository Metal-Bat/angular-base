import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { ActorState } from '../auth/actor-state';
export type FeedbackState = {
  readonly kind: 'pending' | 'success' | 'error' | 'uncertain' | 'conflict';
  readonly message: string;
  readonly issues?: readonly {
    pointer: string;
    label: string;
    message: string;
  }[];
  readonly reconcile?: () => void;
};
export function fieldId(pointer: string): string {
  return 'field-' + encodeURIComponent(pointer);
}
@Injectable({ providedIn: 'root' })
export class Feedback {
  private readonly document = inject(DOCUMENT);
  readonly state = signal<FeedbackState | null>(null);
  readonly confirmation = signal<{
    message: string;
    finish: (approved: boolean) => void;
  } | null>(null);
  constructor() {
    inject(ActorState).register((): void => {
      this.state.set(null);
      this.answer(false);
    });
  }
  show(value: FeedbackState): void {
    this.state.set(value);
  }
  focus(pointer: string): void {
    this.document.getElementById(fieldId(pointer))?.focus();
  }
  confirm(message: string): Promise<boolean> {
    this.answer(false);
    return new Promise((resolve) => {
      this.confirmation.set({ message, finish: resolve });
    });
  }
  answer(approved: boolean): void {
    const request = this.confirmation();
    this.confirmation.set(null);
    request?.finish(approved);
  }
}
