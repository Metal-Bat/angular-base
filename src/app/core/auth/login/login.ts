import { RouterLink } from '@angular/router';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthSession } from '../auth-session';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-login',
  imports: [
    RouterLink,
    LocalizePipe,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly auth = inject(AuthSession);
  private readonly route = inject(ActivatedRoute);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly form = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(255)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(4096)],
    }),
  });
  async submit(): Promise<void> {
    if (this.busy()) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    this.busy.set(true);
    this.error.set('');
    const { username, password } = this.form.getRawValue();
    try {
      await this.auth.login(
        username,
        password,
        this.route.snapshot.queryParamMap.get('returnTo'),
      );
    } catch (error) {
      this.error.set(
        error instanceof HttpErrorResponse && error.status === 401
          ? 'The username or password is incorrect.'
          : error instanceof HttpErrorResponse && error.status === 403
            ? 'This account or application release cannot sign in.'
            : 'Sign-in is unavailable. Try again later.',
      );
    } finally {
      this.form.controls.password.reset();
      this.busy.set(false);
    }
  }
}
