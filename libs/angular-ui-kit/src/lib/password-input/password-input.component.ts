import {
  Component,
  ChangeDetectionStrategy,
  computed,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { AlertComponent } from '../alert/alert.component';
import type { InputAutocapitalize, InputEnterKeyHint } from '../input/input.component';

let nextUniqueId = 0;

/**
 * Password strength information
 */
export interface PasswordStrength {
  score: number; // 0-5 (number of requirements met)
  level: 'Weak' | 'Fair' | 'Good' | 'Strong';
  percentage: number; // 0-100
}

/**
 * Individual password requirement
 */
export interface PasswordRequirement {
  label: string;
  met: boolean;
  icon: string;
}

const SYMBOL_PATTERN = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/;

/** The length rule when no `minLength` is set (the 3.2 rule). */
const DEFAULT_MIN_LENGTH = 8;

/**
 * How the strength meter scores a password:
 * - `composition` (default, 3.2): share of five rules met — length and four character classes.
 * - `length`: the length only, as NIST SP 800-63B asks (no composition rules):
 *   below `minLength` Weak, from it Fair, from 1.5 × Good, from 2 × Strong.
 */
export type PasswordStrengthMode = 'composition' | 'length';

/**
 * Password Input Component with Show/Hide Toggle and Strength Meter
 *
 * Features:
 * - Show/Hide password toggle (eye icon)
 * - Real-time password strength indicator (Weak/Fair/Good/Strong)
 * - Visual strength meter bar with color coding
 * - Validation feedback (length, uppercase, lowercase, digit, symbol)
 * - Accessible ARIA attributes
 * - Reactive Forms ControlValueAccessor implementation
 *
 * Strength levels (share of the 5 requirements met):
 * - Weak: < 40%
 * - Fair: 40–59%
 * - Good: 60–79%
 * - Strong: >= 80%
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one digit (0-9)
 * - At least one symbol (!@#$%^&*()_+-=[]{}|;:,.<>?)
 *
 * NIST-style use (3.3): `strengthMode="length"`, `minLength`, `helperText` for
 * the rule, or no meter and no checklist at all.
 *
 * Usage:
 * ```html
 * <lc-password-input
 *   [formControl]="passwordControl"
 *   label="Password"
 *   placeholder="Enter your password"
 *   [showStrengthMeter]="true"
 * ></lc-password-input>
 * ```
 */
@Component({
  selector: 'lc-password-input',
  standalone: true,
  imports: [IconComponent, AlertComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordInputComponent),
      multi: true,
    },
  ],
  templateUrl: './password-input.component.html',
  styleUrls: ['./password-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordInputComponent implements ControlValueAccessor {
  /** Label text (displayed above the input) */
  readonly label = input<string>('Password');

  /** Placeholder text */
  readonly placeholder = input<string>('Enter password');

  /** Whether to show the strength meter bar + level text */
  readonly showStrengthMeter = input<boolean>(false);

  /** Whether to show the requirements checklist */
  readonly showRequirements = input<boolean>(false);

  /** Whether the input is disabled */
  readonly disabled = input<boolean>(false);

  /** Whether the input is required */
  readonly required = input<boolean>(false);

  /**
   * Show the `*` of a `required` field; `false` keeps `required` and
   * `aria-required` without the asterisk.
   * @default true
   */
  readonly requiredIndicator = input<boolean>(true);

  /** Error message to display (also sets aria-invalid) */
  readonly error = input<string | undefined>(undefined);

  /** Help below the field, e.g. the password rule; linked by `aria-describedby`. The error replaces it. */
  readonly helperText = input<string>();

  /**
   * Minimum length: the native `minlength` and the length rule of the
   * requirement list and the meter. Unset = no attribute, rule of 8 (3.2).
   */
  readonly minLength = input<number>();

  /** How the strength meter scores: `composition` (3.2) or `length` (NIST, no character-class rules). */
  readonly strengthMode = input<PasswordStrengthMode>('composition');

  /**
   * Native `autocomplete`: `current-password` (sign-in), `new-password`
   * (registration, change), so password managers fill and save the right
   * password. Unset = no attribute.
   */
  readonly autocomplete = input<string>();

  /** Native `name` of the inner input. Unset = no attribute. */
  readonly name = input<string>();

  /**
   * Native `autocapitalize`. Default `off`: a shown password must not be
   * capitalised by the on-screen keyboard.
   * @default 'off'
   */
  readonly autocapitalize = input<InputAutocapitalize>('off');

  /**
   * Native `spellcheck`. Default `false`: a shown password must never go to a
   * spell checker (some send text to a server).
   * @default false
   */
  readonly spellcheck = input<boolean>(false);

  /** Native `enterkeyhint`: the label of the on-screen keyboard's Enter key. Unset = no attribute. */
  readonly enterkeyhint = input<InputEnterKeyHint>();

  /** Accessible name of the visibility toggle while the password is hidden. */
  readonly showPasswordAriaLabel = input('Show password');

  /** Accessible name of the visibility toggle while the password is shown. */
  readonly hidePasswordAriaLabel = input('Hide password');

  /** Screen-reader prefix of the strength level (`showStrengthMeter`). */
  readonly strengthLabel = input('Password strength:');

  /** Shown for strength level `Weak`. */
  readonly weakLabel = input('Weak');

  /** Shown for strength level `Fair`. */
  readonly fairLabel = input('Fair');

  /** Shown for strength level `Good`. */
  readonly goodLabel = input('Good');

  /** Shown for strength level `Strong`. */
  readonly strongLabel = input('Strong');

  /** Accessible name of the requirement list (`showRequirements`). */
  readonly requirementsAriaLabel = input('Password requirements');

  /** Requirement: at least 8 characters. */
  readonly minLengthRequirementLabel = input('At least 8 characters');

  /** Requirement: one uppercase letter. */
  readonly uppercaseRequirementLabel = input('One uppercase letter (A-Z)');

  /** Requirement: one lowercase letter. */
  readonly lowercaseRequirementLabel = input('One lowercase letter (a-z)');

  /** Requirement: one digit. */
  readonly digitRequirementLabel = input('One digit (0-9)');

  /** Requirement: one symbol. */
  readonly symbolRequirementLabel = input('One symbol (!@#$%^&*)');

  /** Screen-reader suffix of a met requirement. */
  readonly requirementMetLabel = input('(met)');

  /** Screen-reader suffix of an unmet requirement. */
  readonly requirementNotMetLabel = input('(not met)');

  /** Emitted whenever the value (and thus the strength) is recalculated */
  readonly strengthChange = output<PasswordStrength>();

  /** Per-instance ids so label/error linkage survives several inputs on one page */
  readonly inputId = `lc-password-input-${nextUniqueId++}`;
  readonly errorId = `${this.inputId}-error`;
  readonly helperId = `${this.inputId}-helper`;
  readonly strengthId = `${this.inputId}-strength`;

  // Internal state
  readonly value = signal<string>('');
  readonly isPasswordVisible = signal<boolean>(false);

  // Internal disabled state (for ControlValueAccessor)
  private readonly formDisabled = signal<boolean>(false);

  /** Computed disabled state from both input and form control */
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  /** The length rule: `minLength`, else 8. */
  readonly requiredLength = computed(() => this.minLength() ?? DEFAULT_MIN_LENGTH);

  readonly requirements = computed<PasswordRequirement[]>(() => {
    const password = this.value();
    const checks: Array<[string, boolean]> = [[this.minLengthRequirementLabel(), password.length >= this.requiredLength()]];
    if (this.strengthMode() === 'composition') {
      checks.push(
        [this.uppercaseRequirementLabel(), /[A-Z]/.test(password)],
        [this.lowercaseRequirementLabel(), /[a-z]/.test(password)],
        [this.digitRequirementLabel(), /[0-9]/.test(password)],
        [this.symbolRequirementLabel(), SYMBOL_PATTERN.test(password)],
      );
    }
    return checks.map(([label, met]) => ({ label, met, icon: met ? '✓' : '✗' }));
  });

  readonly strength = computed<PasswordStrength>(() =>
    this.strengthMode() === 'length' ? this.lengthStrength() : this.compositionStrength(),
  );

  /** The strength level as shown to the user (the level itself stays English: it is API and class name). */
  readonly strengthText = computed(() => {
    switch (this.strength().level) {
      case 'Strong':
        return this.strongLabel();
      case 'Good':
        return this.goodLabel();
      case 'Fair':
        return this.fairLabel();
      default:
        return this.weakLabel();
    }
  });

  /** Lower-cased level for the modifier classes (lc-strength-weak …) */
  readonly strengthLevelClass = computed(() => `lc-strength-${this.strength().level.toLowerCase()}`);

  readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.error()) ids.push(this.errorId);
    else if (this.helperText()) ids.push(this.helperId);
    if (this.showStrengthMeter()) ids.push(this.strengthId);
    return ids.length ? ids.join(' ') : null;
  });

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange: (value: string) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched: () => void = () => {};

  /**
   * ControlValueAccessor: Write value from form control
   */
  writeValue(value: string | null | undefined): void {
    this.value.set(value || '');
    this.strengthChange.emit(this.strength());
  }

  /**
   * ControlValueAccessor: Register onChange callback
   */
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  /**
   * ControlValueAccessor: Register onTouched callback
   */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /**
   * ControlValueAccessor: Set disabled state
   */
  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.isPasswordVisible.update((visible) => !visible);
  }

  /**
   * Handle input changes
   */
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value.set(input.value);
    this.onChange(input.value);
    this.strengthChange.emit(this.strength());
  }

  /**
   * Handle blur event
   */
  onBlur(): void {
    this.onTouched();
  }

  /** 3.2 scoring: the share of the five rules met. */
  private compositionStrength(): PasswordStrength {
    const requirements = this.requirements();
    const score = requirements.filter((r) => r.met).length;
    const percentage = (score / requirements.length) * 100;

    let level: PasswordStrength['level'] = 'Weak';
    if (percentage >= 80) {
      level = 'Strong';
    } else if (percentage >= 60) {
      level = 'Good';
    } else if (percentage >= 40) {
      level = 'Fair';
    }

    return { score, level, percentage };
  }

  /** NIST scoring: the length against `minLength` (score 0–4 like the four levels). */
  private lengthStrength(): PasswordStrength {
    const length = this.value().length;
    const min = this.requiredLength();
    const percentage = Math.min(100, Math.round((length / (2 * min)) * 100));

    let level: PasswordStrength['level'] = 'Weak';
    let score = length > 0 ? 1 : 0;
    if (length >= 2 * min) {
      level = 'Strong';
      score = 4;
    } else if (length >= 1.5 * min) {
      level = 'Good';
      score = 3;
    } else if (length >= min) {
      level = 'Fair';
      score = 2;
    }

    return { score, level, percentage };
  }
}
