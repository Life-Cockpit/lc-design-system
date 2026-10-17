import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CopyFieldComponent } from '@lifecorner/angular-ui-kit/copy-field';
import { EmailInputComponent } from '@lifecorner/angular-ui-kit/email-input';
import { InputComponent } from '@lifecorner/angular-ui-kit/input';
import { PasswordInputComponent } from '@lifecorner/angular-ui-kit/password-input';
import { ProviderButtonComponent } from '@lifecorner/angular-ui-kit/provider-button';
import { RadioComponent, RadioGroupComponent } from '@lifecorner/angular-ui-kit/radio';
import { VerificationCodeInputComponent } from '@lifecorner/angular-ui-kit/verification-code-input';

/** Household (`/tt/household`): the F1 form components. */
@Component({
  selector: 'tt-household',
  imports: [
    CopyFieldComponent, EmailInputComponent, InputComponent, PasswordInputComponent, ProviderButtonComponent,
    RadioComponent, RadioGroupComponent, VerificationCodeInputComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Haushalt</h1>
    <lc-input label="Name des Haushalts" placeholder="Unser Haushalt" />
    <lc-email-input label="E-Mail" />
    <lc-password-input label="Passwort" />
    <lc-verification-code-input label="Code" />
    <lc-radio-group legend="Rolle" name="role" [(value)]="role">
      <lc-radio value="member" label="Mitglied" />
      <lc-radio value="admin" label="Verwalten" />
    </lc-radio-group>
    <lc-copy-field label="Einladungslink" value="https://example.org/join/abc" copyLabel="Kopieren" />
    <lc-provider-button text="continue" label="Weiter mit Google" />
  `,
})
export class TtHousehold {
  protected readonly role = signal('member');
}
