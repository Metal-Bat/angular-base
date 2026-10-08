import { LocalizePipe } from './localize-pipe';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  host: { class: 'console-page console-error' },
  imports: [LocalizePipe, RouterLink],
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './not-found.scss',
  templateUrl: './not-found.html',
})
export class NotFound {}
