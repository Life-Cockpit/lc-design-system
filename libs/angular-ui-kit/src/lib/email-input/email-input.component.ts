/* eslint-disable @typescript-eslint/member-ordering */
/* ControlValueAccessor implementation requires specific method placement */

import {
  Component,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
  forwardRef,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputAutocapitalize, InputComponent, InputEnterKeyHint } from '../input/input.component';

/**
 * Email input component with built-in RFC 5322 validation.
 *
 * Features:
 * - RFC 5322 regex email format validation
 * - Real-time validation feedback on input
 * - Valid/invalid visual indicators
 * - Size presets (xs, sm, md, lg)
 * - Helper text and error message display
 * - Disabled and readonly states (read-only addresses can wrap: `readonlyWrap`)
 * - Optional leading mail icon (`showIcon`)
 * - Autofill and keyboard hints: `autocomplete`, `name`, `autocapitalize`, `spellcheck`, `enterkeyhint`
 * - ControlValueAccessor integration for reactive forms
 *
 * @example
 * ```html
 * <lc-email-input label="Email" placeholder="you@example.com" [(ngModel)]="email" />
 * ```
 */
@Component({
  selector: 'lc-email-input',
  imports: [CommonModule, InputComponent],
  templateUrl: './email-input.component.html',
  styleUrl: './email-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EmailInputComponent),
      multi: true,
    },
  ],
})
export class EmailInputComponent implements ControlValueAccessor {
  // Input Properties
  /**
   * Input label (displayed above input)
   * @default 'Email'
   */
  readonly label = input<string>('Email');

  /**
   * Placeholder text
   * @default 'you@example.com'
   */
  readonly placeholder = input<string>('you@example.com');

  /**
   * Size of the input
   * @default 'md'
   */
  readonly size = input<'xs' | 'sm' | 'md' | 'lg'>('md');

  /**
   * Whether the input is disabled
   * @default false
   */
  readonly disabled = input<boolean>(false);

  /**
   * Whether the input is read-only
   * @default false
   */
  readonly readonly = input<boolean>(false);

  /**
   * Whether the input is required
   * @default false
   */
  readonly required = input<boolean>(false);

  /**
   * Custom error message (overrides validation error)
   */
  readonly error = input<string>();

  /**
   * Helper text to display below input
   */
  readonly helperText = input<string>();

  /**
   * Whether to show validation feedback immediately
   * @default false (validates on blur)
   */
  readonly validateOnInput = input<boolean>(false);

  /**
   * ARIA label for accessibility
   */
  readonly ariaLabel = input<string>();

  /**
   * Native `autocomplete` (input purpose, WCAG 1.3.5): `email` (registration),
   * `username` (the address as the sign-in name), `username webauthn` (sign-in:
   * the browser offers passkeys in this field). Unset = no attribute.
   */
  readonly autocomplete = input<string>();

  /** Native `name` of the inner input. Unset = no attribute. */
  readonly name = input<string>();

  /** Native `autocapitalize` (`off` keeps keyboards from capitalising the address). Unset = no attribute. */
  readonly autocapitalize = input<InputAutocapitalize>();

  /** Native `spellcheck`. Unset = no attribute. */
  readonly spellcheck = input<boolean>();

  /** Native `enterkeyhint`: the label of the on-screen keyboard's Enter key. Unset = no attribute. */
  readonly enterkeyhint = input<InputEnterKeyHint>();

  /**
   * Show the leading mail icon. `false` gives the address the icon's width
   * (about 36 px) — long addresses fit on a phone.
   * @default true
   */
  readonly showIcon = input<boolean>(true);

  /**
   * While `readonly`: the address wraps onto more lines instead of being
   * clipped. A hidden native input keeps value, `name` and `autocomplete`
   * (e.g. `username` for password managers on a password page).
   * @default false
   */
  readonly readonlyWrap = input<boolean>(false);

  /**
   * Show the `*` of a `required` field; `false` keeps the required semantics without it.
   * @default true
   */
  readonly requiredIndicator = input<boolean>(true);

  /** Error shown for an empty `required` field. */
  readonly requiredMessage = input('Email address is required');

  /** Error shown for a malformed address. */
  readonly invalidMessage = input('Please enter a valid email address');

  // Output Events
  /**
   * Emitted when email value changes
   */
  readonly valueChange = output<string>();

  /**
   * Emitted when validation state changes
   */
  readonly validationChange = output<{ valid: boolean; error?: string }>();

  /**
   * Emitted when input receives focus
   */
  readonly focused = output<void>();

  /**
   * Emitted when input loses focus
   */
  readonly blurred = output<void>();

  /**
   * Emitted when Enter key is pressed
   */
  readonly enterPressed = output<void>();

  // Internal state
  readonly value = signal<string>('');
  private readonly touched = signal<boolean>(false);
  private readonly _formDisabled = signal<boolean>(false);

  /**
   * RFC 5322 compliant email regex (simplified but robust)
   * Validates: local-part@domain
   * - Local part: alphanumeric, dots, hyphens, underscores, plus signs
   * - Domain: alphanumeric, dots, hyphens with valid TLD
   */
  private readonly EMAIL_REGEX =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  // ControlValueAccessor callbacks
  private onChange: (value: string) => void = () => { /* set by registerOnChange */ };
  private onTouched: () => void = () => { /* set by registerOnTouched */ };

  /**
   * Computed validation state
   */
  protected readonly isValid = computed(() => {
    const val = this.value();
    if (!val) return this.required() ? false : true;
    return this.EMAIL_REGEX.test(val);
  });

  /**
   * Computed error message
   */
  protected readonly validationError = computed(() => {
    // Custom error takes precedence
    if (this.error()) return this.error();

    // Show validation errors only after touched or validateOnInput
    if (!this.touched() && !this.validateOnInput()) return undefined;

    const val = this.value();
    if (this.required() && !val) {
      return this.requiredMessage();
    }
    if (val && !this.isValid()) {
      return this.invalidMessage();
    }
    return undefined;
  });

  /**
   * Computed disabled state
   */
  protected get isDisabled(): boolean {
    return this.disabled() || this._formDisabled();
  }

  constructor() {
    // Emit validation state changes
    effect(() => {
      const valid = this.isValid();
      const error = this.validationError();
      this.validationChange.emit({ valid, error });
    });
  }

  // ===== ControlValueAccessor implementation =====

  writeValue(value: string): void {
    this.value.set(value || '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._formDisabled.set(isDisabled);
  }

  // ===== Public API methods =====

  /**
   * Public method to trigger validation
   */
  public validate(): boolean {
    this.touched.set(true);
    return this.isValid();
  }

  /**
   * Public method to reset validation state
   */
  public resetValidation(): void {
    this.touched.set(false);
  }

  // ===== Event handlers (protected) =====

  /**
   * Handles value changes from base input
   */
  protected onValueChange(newValue: string): void {
    this.value.set(newValue);
    this.onChange(newValue);
    this.valueChange.emit(newValue);
  }

  /**
   * Handles focus events
   */
  protected onFocus(): void {
    this.focused.emit();
  }

  /**
   * Handles blur events
   */
  protected onBlur(): void {
    this.touched.set(true);
    this.onTouched();
    this.blurred.emit();
  }

  /**
   * Handles Enter key press
   */
  protected onEnterPressed(): void {
    this.enterPressed.emit();
  }
}
