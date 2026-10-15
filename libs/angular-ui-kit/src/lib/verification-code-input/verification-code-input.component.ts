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

/** Space between the boxes: `default` 12 px (8 px below 480 px), `compact` 8 px (4 px below 480 px). */
export type VerificationCodeInputGap = 'default' | 'compact';

/**
 * Verification Code Input Component with one input per digit
 *
 * Features:
 * - Configurable number of digit fields (`length`, default 6)
 * - Automatic focus advancement after entering a digit
 * - Backspace moves to the previous input, arrow keys navigate
 * - Paste / autofill support (splits the code across the inputs); no
 *   `maxlength`, so iOS and Android can put the whole `one-time-code` into box 1
 * - `clear()` empties the boxes after a wrong code and focuses box 1
 * - Phones (below 480 px): 44 × 48 px boxes, 8 px apart (6 boxes = 304 px)
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

  /**
   * Show the `*` of a `required` code; `false` keeps `required` and
   * `aria-required` without the asterisk.
   * @default true
   */
  readonly requiredIndicator = input<boolean>(true);

  /** Space between the boxes: `default` (12 px, 8 px below 480 px) or `compact` (8 px, 4 px below 480 px). */
  readonly gap = input<VerificationCodeInputGap>('default');

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

  /** Accessible name of each box; `{n}` and `{total}` are replaced. */
  readonly digitAriaLabel = input('Digit {n} of {total}');

  /** Accessible name of box `index` (zero-based). */
  protected digitLabel(index: number): string {
    return this.digitAriaLabel().replace('{n}', String(index + 1)).replace('{total}', String(this.length()));
  }

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
   * Empty every box (e.g. after a wrong code), report `''` to the form and
   * focus box 1. Writing `''` through the form control empties the boxes too,
   * without moving the focus.
   */
  clear(): void {
    this.digits.set(Array<string>(this.length()).fill(''));
    for (const box of this.digitInputs()) {
      box.nativeElement.value = '';
    }
    this.onChange('');
    this.focusInput(0);
  }

  /**
   * Handle digit input
   */
  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const previous = this.digits()[index];

    if (input.value === '') {
      // Emptied without a Backspace keydown (some Android keyboards send none)
      if (previous) this.setDigit(index, '');
      return;
    }

    let typed = input.value.replace(/\D/g, '');
    // The boxes have no maxlength (it would cut an autofilled code to one
    // digit), so typing into a filled box briefly holds two characters: keep
    // the new digit.
    if (previous && typed.length === 2 && typed.includes(previous)) {
      typed = typed.replace(previous, '');
    } else if (typed === previous) {
      typed = '';
    }

    if (!typed) {
      // Only non-digits were added: the signal is unchanged, so restore the DOM here
      input.value = previous;
      return;
    }

    // One digit, or several at once (autofill / IME): distribute from this position
    this.applyDigits(typed.split(''), index);
    // Keep this box at one digit even when the signal did not change
    input.value = this.digits()[index];
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
