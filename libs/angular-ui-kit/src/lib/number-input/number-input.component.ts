import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  computed,
  signal,
  forwardRef,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

/** Number of decimals a number is written with (`0.001` → 3, `1e-7` → 7, `5` → 0). */
function decimalsOf(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const [mantissa, exponent] = String(n).split('e');
  const decimals = (mantissa.split('.')[1]?.length ?? 0) - (exponent ? Number(exponent) : 0);
  return Math.max(0, decimals);
}

/**
 * Reduces raw text to something `Number()` can parse: digits, one leading
 * minus and one decimal point. A comma is taken as a decimal separator so a
 * German keyboard layout does not silently lose the fraction.
 */
function sanitizeNumericText(raw: string): string {
  let out = '';
  let seenPoint = false;
  for (const ch of raw) {
    if (ch >= '0' && ch <= '9') {
      out += ch;
    } else if (ch === '-' && out.length === 0) {
      out += ch;
    } else if ((ch === '.' || ch === ',') && !seenPoint) {
      seenPoint = true;
      out += '.';
    }
  }
  return out;
}

@Component({
  selector: 'lc-number-input',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './number-input.component.html',
  styleUrls: ['./number-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberInputComponent),
      multi: true,
    },
  ],
})
/**
 * Number input component with increment/decrement controls.
 *
 * Features:
 * - Increment and decrement buttons (also ArrowUp / ArrowDown)
 * - Configurable min, max, and step values
 * - Value clamping within bounds; stepping is rounded to the step's precision
 * - Non-numeric characters are rejected as they are typed
 * - Disabled state support
 * - ControlValueAccessor integration for reactive forms
 *
 * @example
 * ```html
 * <lc-number-input label="Quantity" [min]="0" [max]="100" [step]="1" />
 * ```
 */
export class NumberInputComponent implements ControlValueAccessor {
  private static nextId = 0;

  /** Minimum value */
  min = input<number | undefined>(undefined);

  /** Maximum value */
  max = input<number | undefined>(undefined);

  /** Step increment */
  step = input<number>(1);

  /** Label text */
  label = input<string>();

  /** Accessible name for the field when no visible `label` is rendered. */
  ariaLabel = input<string>();

  /** Placeholder */
  placeholder = input<string>('0');

  /** Helper text shown below the control (linked via `aria-describedby`). */
  helperText = input<string>();

  /** Error message shown below the control; marks the field `aria-invalid`. */
  error = input<string>();

  /** Disabled state */
  disabled = input<boolean>(false);

  /** Emits value on change */
  valueChange = output<number>();

  /** Per-instance id wiring the label, hint and error to the field. */
  readonly inputId = `lc-number-input-${++NumberInputComponent.nextId}`;

  protected value = signal<number | null>(null);

  /**
   * Text shown in the field. It is re-derived from the model on `writeValue`,
   * stepping and blur — never while typing — so an in-progress entry such as
   * "1." or "-" is not snapped back to "1" under the user's cursor.
   */
  protected readonly text = signal('');

  /** Disabled through the form control (`setDisabledState`), as opposed to the input. */
  private readonly formDisabled = signal(false);

  /** Disabled by either route — the one flag the template consults. */
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');

  /** Decimals implied by `step` — stepped results are rounded to it so 0.1 + 0.2 does not drift. */
  private readonly stepPrecision = computed(() => decimalsOf(this.step()));

  /** Fractions need a decimal key on touch keyboards; integers do not. */
  protected readonly inputMode = computed(() => (this.stepPrecision() > 0 ? 'decimal' : 'numeric'));

  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.error()) ids.push(`${this.inputId}-error`);
    else if (this.helperText()) ids.push(`${this.inputId}-helper`);
    return ids.length ? ids.join(' ') : null;
  });

  protected containerClasses = computed(() => {
    const classes = ['number-input'];
    if (this.isDisabled()) classes.push('number-input--disabled');
    if (this.error()) classes.push('number-input--error');
    return classes.join(' ');
  });

  protected canDecrement = computed(() => {
    const val = this.value();
    const minV = this.min();
    if (val === null || minV === undefined) return true;
    return val > minV;
  });

  protected canIncrement = computed(() => {
    const val = this.value();
    const maxV = this.max();
    if (val === null || maxV === undefined) return true;
    return val < maxV;
  });

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange: (val: number | null) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched: () => void = () => {};

  decrement(): void {
    this.stepBy(-1);
  }

  increment(): void {
    this.stepBy(1);
  }

  private stepBy(direction: 1 | -1): void {
    const cur = this.value() ?? 0;
    // Keep whatever precision the user typed (1.25 + 0.1 → 1.35), but never
    // less than the step's own — that is what removes the binary drift.
    const precision = Math.max(this.stepPrecision(), decimalsOf(cur));
    const next = this.clamp(Number((cur + direction * this.step()).toFixed(precision)));
    this.setValue(next);
    this.text.set(this.format(next));
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.canIncrement()) this.increment();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (this.canDecrement()) this.decrement();
    }
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const raw = target.value;
    const text = sanitizeNumericText(raw);
    // Property binding alone would not repaint the field when the model does
    // not change (typing "a" after "12" leaves 12 as-is), so the stripped
    // text is written straight back to the element.
    if (text !== raw) {
      const caret = Math.max(0, (target.selectionStart ?? text.length) - (raw.length - text.length));
      target.value = text;
      target.setSelectionRange(caret, caret);
    }
    this.text.set(text);
    // "" would parse as 0; it and the other in-progress entries ("-", ".")
    // mean the model has no number yet.
    const parsed = text === '' ? NaN : Number(text);
    if (Number.isNaN(parsed)) {
      if (this.value() !== null) {
        this.value.set(null);
        this.onChange(null);
      }
      return;
    }
    this.setValue(parsed);
  }

  onBlur(): void {
    this.onTouched();
    // Clamp on blur
    const val = this.value();
    if (val !== null) {
      const clamped = this.clamp(val);
      if (clamped !== val) this.setValue(clamped);
    }
    // Whatever half-typed text is left ("1.", "-", "007") is replaced by the
    // model's canonical form. The element is written directly as well, in
    // case the DOM drifted from the bound text without an input event.
    const canonical = this.format(this.value());
    this.text.set(canonical);
    const el = this.inputEl()?.nativeElement;
    if (el) el.value = canonical;
  }

  private format(val: number | null): string {
    return val === null ? '' : String(val);
  }

  private clamp(val: number): number {
    const minV = this.min();
    const maxV = this.max();
    if (minV !== undefined) val = Math.max(minV, val);
    if (maxV !== undefined) val = Math.min(maxV, val);
    return val;
  }

  private setValue(val: number): void {
    if (val === this.value()) return;
    this.value.set(val);
    this.valueChange.emit(val);
    this.onChange(val);
  }

  // ControlValueAccessor
  writeValue(val: number | null): void {
    this.value.set(val);
    this.text.set(this.format(val));
  }

  registerOnChange(fn: (val: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
