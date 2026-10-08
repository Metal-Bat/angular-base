import { RequestErrors } from './core/feedback/request-errors';
import { ErrorNotification } from './core/feedback/error-notification/error-notification';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ErrorNotification],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.scss',
})
export class App {
  readonly errors = inject(RequestErrors);
}
