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
import { InputComponent } from '../input/input.component';

/**
 * Email input component with built-in RFC 5322 validation.
 *
 * Features:
 * - RFC 5322 regex email format validation
 * - Real-time validation feedback on input
 * - Valid/invalid visual indicators
 * - Size presets (xs, sm, md, lg)
 * - Helper text and error message display
 * - Disabled and readonly states
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
      return 'Email address is required';
    }
    if (val && !this.isValid()) {
      return 'Please enter a valid email address';
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
