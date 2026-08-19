import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  afterNextRender,
  computed,
  forwardRef,
  input,
  linkedSignal,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextUniqueId = 0;

/**
 * Verification Code Input Component with one input per digit
 *
 * Features:
 * - Configurable number of digit fields (`length`, default 6)
 * - Automatic focus advancement after entering a digit
 * - Backspace moves to the previous input, arrow keys navigate
 * - Paste / autofill support (splits the code across the inputs)
 * - Accessible ARIA attributes (labelled group, linked hint and error)
 * - Reactive Forms ControlValueAccessor implementation
 * - `complete` emits exactly once when all digits are entered
 *
 * Usage:
 * ```html
 * <lc-verification-code-input
 *   [formControl]="codeControl"
 *   label="Verification Code"
 *   [length]="6"
 *   (complete)="onCodeComplete($event)"
 * ></lc-verification-code-input>
 * ```
 */
@Component({
  selector: 'lc-verification-code-input',
  standalone: true,
  imports: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VerificationCodeInputComponent),
      multi: true,
    },
  ],
  templateUrl: './verification-code-input.component.html',
  styleUrls: ['./verification-code-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificationCodeInputComponent implements ControlValueAccessor {
  /** Group label rendered above the digit inputs */
  readonly label = input<string>('Verification Code');

  /** Number of digits */
  readonly length = input<number>(6);

  /** Whether the inputs are disabled */
  readonly disabled = input<boolean>(false);

  /** Whether the code is required */
  readonly required = input<boolean>(false);

  /** Error message displayed below the inputs (also sets aria-invalid) */
  readonly error = input<string | undefined>(undefined);

  /**
   * @deprecated `complete` always emits exactly once when the last digit is
   * entered — bind `(complete)` to auto-submit. Kept so existing bindings
   * keep compiling; it no longer changes behaviour.
   */
  readonly autoSubmit = input<boolean>(false);

  /**
   * Hint text below the inputs. Defaults to "Enter the N-digit code";
   * pass an empty string to hide the hint.
   */
  readonly hint = input<string | undefined>(undefined);

  /** Focus the first digit input once rendered (opt-in) */
  readonly autofocus = input<boolean>(false);

  /** Emitted once with the full code when all digits are entered */
  readonly complete = output<string>();

  /** Per-instance ids for the group label, hint and error linkage */
  readonly groupId = `lc-verification-code-${nextUniqueId++}`;
  readonly labelId = `${this.groupId}-label`;
  readonly hintId = `${this.groupId}-hint`;
  readonly errorId = `${this.groupId}-error`;

  private readonly digitInputs = viewChildren<ElementRef<HTMLInputElement>>('digitInput');

  /** One entry per digit; resets when `length` changes */
  readonly digits = linkedSignal<string[]>(() => Array<string>(this.length()).fill(''));

  // Internal disabled state (for ControlValueAccessor)
  private readonly formDisabled = signal<boolean>(false);

  /** Computed disabled state from both input and form control */
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  readonly code = computed(() => this.digits().join(''));

  readonly isComplete = computed(() => this.digits().every((digit) => digit !== ''));

  readonly hintText = computed(() => {
    const hint = this.hint();
    return hint === undefined ? `Enter the ${this.length()}-digit code` : hint;
  });

  readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.error()) ids.push(this.errorId);
    if (this.hintText()) ids.push(this.hintId);
    return ids.length ? ids.join(' ') : null;
  });

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange: (value: string) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched: () => void = () => {};

  constructor() {
    afterNextRender(() => {
      if (this.autofocus()) {
        this.focusInput(0);
      }
    });
  }

  /**
   * ControlValueAccessor: Write value from form control
   */
  writeValue(value: string | null | undefined): void {
    const chars = (value ?? '').replace(/\D/g, '').slice(0, this.length()).split('');
    this.digits.set(Array.from({ length: this.length() }, (_, i) => chars[i] ?? ''));
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
   * Handle digit input
   */
  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const typed = input.value.replace(/\D/g, '');

    if (!typed) {
      // Non-digit: the signal still holds '' so the binding won't reset the DOM — clear it here
      input.value = '';
      return;
    }

    // Several digits at once (autofill / IME): distribute from this position
    this.applyDigits(typed.split(''), index);
  }

  /**
   * Handle keydown events (backspace, arrow keys)
   */
  onKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace') {
      if (input.value) {
        this.setDigit(index, '');
      } else if (index > 0) {
        // Move to previous input and clear it
        this.setDigit(index - 1, '');
        this.focusInput(index - 1);
      }
      event.preventDefault();
    } else if (event.key === 'ArrowLeft' && index > 0) {
      this.focusInput(index - 1);
      event.preventDefault();
    } else if (event.key === 'ArrowRight' && index < this.length() - 1) {
      this.focusInput(index + 1);
      event.preventDefault();
    }
  }

  /**
   * Handle paste event (split the pasted code across the inputs)
   */
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    if (this.isDisabled()) {
      return;
    }
    const pasted = (event.clipboardData?.getData('text') || '').replace(/\D/g, '');
    if (pasted) {
      this.applyDigits(pasted.split(''), 0);
    }
  }

  /** Writes `chars` into consecutive slots from `start`, then advances focus and reports completion. */
  private applyDigits(chars: string[], start: number): void {
    const len = this.length();
    const next = [...this.digits()];
    const count = Math.min(chars.length, len - start);
    for (let i = 0; i < count; i++) {
      next[start + i] = chars[i];
    }
    this.digits.set(next);
    this.onChange(this.code());

    // Focus the slot after the last written digit (or stay on the last one)
    this.focusInput(Math.min(start + count, len - 1));

    if (this.isComplete()) {
      this.onTouched();
      this.complete.emit(this.code());
    }
  }

  private setDigit(index: number, digit: string): void {
    this.digits.update((digits) => digits.map((d, i) => (i === index ? digit : d)));
    this.onChange(this.code());
  }

  /**
   * Focus specific input by index
   */
  private focusInput(index: number): void {
    const input = this.digitInputs()[index]?.nativeElement;
    if (input) {
      input.focus();
      input.select();
    }
  }
}
