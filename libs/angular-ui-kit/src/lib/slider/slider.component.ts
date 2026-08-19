import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  computed,
  signal,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'lc-slider',
  standalone: true,
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SliderComponent),
      multi: true,
    },
  ],
})
/**
 * Slider component for selecting a numeric value within a range.
 *
 * Features:
 * - Configurable min, max, and step values
 * - Visual fill track indicating current position
 * - Optional value label display
 * - Disabled state support
 * - ControlValueAccessor integration for reactive forms
 *
 * @example
 * ```html
 * <lc-slider label="Volume" [min]="0" [max]="100" [showValue]="true" />
 * ```
 */
export class SliderComponent implements ControlValueAccessor {
  private static nextId = 0;

  /** Minimum value */
  min = input<number>(0);

  /** Maximum value */
  max = input<number>(100);

  /** Step increment */
  step = input<number>(1);

  /** Label text */
  label = input<string>();

  /** Whether to show the current value */
  showValue = input<boolean>(true);

  /** Disabled state */
  disabled = input<boolean>(false);

  /** Emits the current value on change */
  valueChange = output<number>();

  /** Per-instance id wiring the label to the range input. */
  readonly inputId = `lc-slider-${++SliderComponent.nextId}`;

  /** Last value written by the user or the form; `null` until one arrives. */
  private readonly rawValue = signal<number | null>(null);

  /**
   * The value the template and fill track show — always inside `[min, max]`,
   * mirroring what the native range input clamps to. Without this, `min="10"`
   * would show a "0" label over a track filled to −10%.
   */
  protected readonly value = computed(() => {
    const minV = this.min();
    const maxV = this.max();
    return Math.min(maxV, Math.max(minV, this.rawValue() ?? minV));
  });

  /** Disabled through the form control (`setDisabledState`), as opposed to the input. */
  private readonly formDisabled = signal(false);

  /** Disabled by either route — the one flag the template consults. */
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  /** Percentage for fill track */
  protected fillPercentage = computed(() => {
    const minV = this.min();
    const maxV = this.max();
    if (maxV === minV) return 0;
    return ((this.value() - minV) / (maxV - minV)) * 100;
  });

  protected sliderClasses = computed(() => {
    const classes = ['slider'];
    if (this.isDisabled()) classes.push('slider--disabled');
    return classes.join(' ');
  });

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange: (val: number) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched: () => void = () => {};

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const val = Number(target.value);
    this.rawValue.set(val);
    this.valueChange.emit(val);
    this.onChange(val);
  }

  onBlur(): void {
    this.onTouched();
  }

  // ControlValueAccessor
  writeValue(val: number | null): void {
    this.rawValue.set(val);
  }

  registerOnChange(fn: (val: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
