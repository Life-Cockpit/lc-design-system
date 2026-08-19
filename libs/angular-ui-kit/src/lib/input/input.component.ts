/* eslint-disable @typescript-eslint/member-ordering */
import {
  Component,
  input,
  model,
  output,
  signal,
  viewChild,
  ElementRef,
  ChangeDetectionStrategy,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

/**
 * Input component for single-line text form data entry.
 *
 * Features:
 * - Type variants (text, email, password, number, tel, url)
 * - Size presets (xs, sm, md, lg)
 * - Leading and trailing icon support
 * - Character count display with maxLength
 * - Validation error message display
 * - Helper text support
 * - Disabled and readonly states
 * - ControlValueAccessor integration for reactive forms
 *
 * @example
 * ```html
 * <lc-input label="Email" type="email" placeholder="Enter email" [(ngModel)]="email" />
 * ```
 */
@Component({
  selector: 'lc-input',
  imports: [IconComponent],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
})
export class InputComponent implements ControlValueAccessor {
  // Input Properties
  /**
   * Input label (displayed above input)
   */
  readonly label = input<string>();

  /**
   * Placeholder text
   * @default ''
   */
  readonly placeholder = input<string>('');

  /**
   * Input type
   * @default 'text'
   */
  readonly type = input<'text' | 'email' | 'password' | 'number' | 'tel' | 'url'>('text');

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
   * Error message to display (if validation fails)
   */
  readonly error = input<string>();

  /**
   * Helper text to display below input
   */
  readonly helperText = input<string>();

  /**
    * Icon to display before input text (Tabler icon name)
   * @example 'envelope'
   */
  readonly iconBefore = input<string>();

  /**
    * Icon to display after input text (Tabler icon name)
   * @example 'eye'
   */
  readonly iconAfter = input<string>();

  /**
   * Maximum number of characters
   */
  readonly maxLength = input<number>();

  /**
   * Whether to show character count
   * @default false
   */
  readonly showCharCount = input<boolean>(false);

  /**
   * ARIA label for accessibility
   */
  readonly ariaLabel = input<string>();

  /**
   * Current value (two-way bindable: `[value]` / `[(value)]`). Emits
   * `valueChange` whenever it changes — once per user keystroke, on `clear()`
   * and when a bound form control writes a value.
   */
  readonly value = model<string>('');

  // Output Events
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
  readonly inputId = `lc-input-${Math.random().toString(36).substr(2, 9)}`;

  // ViewChild reference
  private readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('inputRef');

  // Internal disabled state (for ControlValueAccessor)
  private readonly _formDisabled = signal<boolean>(false);

  // ControlValueAccessor callbacks
  private onChange: (value: string) => void = () => { /* set by registerOnChange */ };
  private onTouched: () => void = () => { /* set by registerOnTouched */ };

  /**
   * Computed disabled state from both input and form control
   */
  protected get isDisabled(): boolean {
    return this.disabled() || this._formDisabled();
  }

  /**
   * Gets current character count
   */
  protected get charCount(): number {
    return this.value().length;
  }

  /**
   * Determines if error state should be shown
   */
  protected get hasError(): boolean {
    return !!this.error();
  }

  /**
   * Programmatically focus the input
   */
  public focus(): void {
    this.inputElement()?.nativeElement.focus();
  }

  /**
   * Programmatically select input text
   */
  public select(): void {
    this.inputElement()?.nativeElement.select();
  }

  /**
   * Clear the input value
   */
  public clear(): void {
    this.value.set('');
    this.onChange('');
  }

  // ControlValueAccessor implementation
  writeValue(value: string | null): void {
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

  /**
   * Handles input value changes
   */
  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newValue = target.value;
    // model.set() emits `valueChange` exactly once per actual change
    this.value.set(newValue);
    this.onChange(newValue);
  }

  /**
   * Handles input focus
   */
  protected onFocus(): void {
    this.focused.emit();
  }

  /**
   * Handles input blur
   */
  protected onBlur(): void {
    this.onTouched();
    this.blurred.emit();
  }

  /**
   * Handles keydown events
   */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.enterPressed.emit();
    }
  }
}
