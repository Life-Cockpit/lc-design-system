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

  /** Error message to display (also sets aria-invalid) */
  readonly error = input<string | undefined>(undefined);

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
  readonly strengthId = `${this.inputId}-strength`;

  // Internal state
  readonly value = signal<string>('');
  readonly isPasswordVisible = signal<boolean>(false);

  // Internal disabled state (for ControlValueAccessor)
  private readonly formDisabled = signal<boolean>(false);

  /** Computed disabled state from both input and form control */
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  readonly requirements = computed<PasswordRequirement[]>(() => {
    const password = this.value();
    const checks: Array<[string, boolean]> = [
      [this.minLengthRequirementLabel(), password.length >= 8],
      [this.uppercaseRequirementLabel(), /[A-Z]/.test(password)],
      [this.lowercaseRequirementLabel(), /[a-z]/.test(password)],
      [this.digitRequirementLabel(), /[0-9]/.test(password)],
      [this.symbolRequirementLabel(), SYMBOL_PATTERN.test(password)],
    ];
    return checks.map(([label, met]) => ({ label, met, icon: met ? '✓' : '✗' }));
  });

  readonly strength = computed<PasswordStrength>(() => {
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
  });

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
}
