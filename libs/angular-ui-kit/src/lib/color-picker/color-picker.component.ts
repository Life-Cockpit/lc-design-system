import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  computed,
  signal,
  forwardRef,
  viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

const DEFAULT_SWATCHES = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#0ea5e9', '#10b981', '#a855f7', '#64748b', '#000000',
  '#ffffff',
];

@Component({
  selector: 'lc-color-picker',
  standalone: true,
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ColorPickerComponent),
      multi: true,
    },
  ],
})
/**
 * Color picker component for selecting colors from swatches or custom input.
 *
 * Features:
 * - Predefined color swatch palette (a radiogroup: arrow keys move between swatches)
 * - Native browser color picker integration
 * - Hex color text input with validation
 * - Disabled state support
 * - ControlValueAccessor integration for reactive forms
 *
 * @example
 * ```html
 * <lc-color-picker label="Brand Color" [showInput]="true" />
 * ```
 */
export class ColorPickerComponent implements ControlValueAccessor {
  private static nextId = 0;

  /** Label text */
  label = input<string>();

  /** Predefined color swatches */
  swatches = input<string[]>(DEFAULT_SWATCHES);

  /** Whether to show the hex input field */
  showInput = input<boolean>(true);

  /** Whether the picker is disabled */
  disabled = input<boolean>(false);

  /** Emits the selected color hex value */
  colorChange = output<string>();

  /** Per-instance id wiring the label to the native colour input. */
  readonly inputId = `lc-color-picker-${++ColorPickerComponent.nextId}`;

  protected value = signal('#3b82f6');

  /** Disabled through the form control (`setDisabledState`), as opposed to the input. */
  private readonly formDisabled = signal(false);

  /** Disabled by either route — the one flag the template consults. */
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  private readonly swatchButtons = viewChildren<ElementRef<HTMLButtonElement>>('swatchBtn');

  /**
   * The swatch carrying the group's single tab stop (roving tabindex): the
   * selected one, or the first when the current colour is not in the palette.
   */
  protected readonly focusableSwatchIndex = computed(() => {
    const index = this.swatches().indexOf(this.value());
    return index >= 0 ? index : 0;
  });

  protected pickerClasses = computed(() => {
    const classes = ['color-picker'];
    if (this.isDisabled()) classes.push('color-picker--disabled');
    return classes.join(' ');
  });

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange: (val: string) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched: () => void = () => {};

  protected selectSwatch(color: string): void {
    if (this.isDisabled()) return;
    this.setValue(color);
  }

  /** Arrow keys / Home / End move selection (and focus) through the palette like a radiogroup. */
  protected onSwatchKeydown(event: KeyboardEvent, index: number): void {
    if (this.isDisabled()) return;
    const count = this.swatches().length;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (index + 1) % count;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (index - 1 + count) % count;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = count - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.selectSwatch(this.swatches()[next]);
    this.swatchButtons()[next]?.nativeElement.focus();
  }

  protected onNativeInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.setValue(target.value);
  }

  protected onHexInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    let val = target.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      this.setValue(val);
    }
  }

  protected onBlur(): void {
    this.onTouched();
  }

  private setValue(color: string): void {
    this.value.set(color);
    this.colorChange.emit(color);
    this.onChange(color);
  }

  // ControlValueAccessor
  writeValue(val: string): void {
    this.value.set(val ?? '#3b82f6');
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
