import { ErrorHandler, inject, Injectable, Injector } from '@angular/core';
@Injectable()
export class ApplicationErrorHandler extends ErrorHandler {
  private readonly injector = inject(Injector);
  override handleError(error: unknown): void {
    super.handleError(error);
    // Only a fixed error classification is sent; the error itself stays in the local console.
    void import('./support-reporter')
      .then(({ SupportReporter }) =>
        this.injector.get(SupportReporter).report('client.render_failed'),
      )
      .catch(() => {
        /* Intake unavailability must not cause another application error. */
      });
  }
}
