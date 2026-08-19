import {
  Component,
  input,
  model,
  signal,
  computed,
  ChangeDetectionStrategy,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type CheckboxSize = 'xs' | 'sm' | 'md' | 'lg';

let nextUniqueId = 0;

@Component({
  selector: 'lc-checkbox',
  standalone: true,
  imports: [],
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
})
/**
 * Checkbox component for boolean or indeterminate selections.
 *
 * Features:
 * - Checked, unchecked, and indeterminate states
 * - Multiple size variants (sm, md, lg)
 * - Validation error display with error message
 * - Help text support
 * - Full accessibility with ARIA attributes
 * - ControlValueAccessor integration for reactive forms
 *
 * @example
 * ```html
 * <lc-checkbox label="Accept terms" />
 * <lc-checkbox label="Select all" [(checked)]="allSelected" [indeterminate]="someSelected" />
 * ```
 */
export class CheckboxComponent implements ControlValueAccessor {
  // Inputs
  readonly id = input<string>(`lc-checkbox-${nextUniqueId++}`);
  readonly label = input<string>('');
  readonly error = input<boolean>(false);
  readonly errorMessage = input<string>('');
  readonly helpText = input<string>('');
  readonly size = input<CheckboxSize>('md');
  readonly required = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly ariaLabel = input<string>('');
  readonly ariaLabelledBy = input<string>('');
  readonly ariaDescribedBy = input<string>('');

  /**
   * Checked state (two-way bindable). Emits `checkedChange` whenever the
   * value changes — on user toggle as well as on form writes.
   */
  readonly checked = model<boolean>(false);

  /**
   * Indeterminate ("partially checked") state (two-way bindable). Cleared
   * automatically on the next user interaction; emits `indeterminateChange`.
   */
  readonly indeterminate = model<boolean>(false);

  /** Disabled state pushed by a form control (`setDisabledState`). */
  private readonly formDisabled = signal(false);

  /** Effective disabled state: `disabled` input OR form control disabled. */
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  readonly labelClasses = computed(() => {
    const classes = ['checkbox-label', `checkbox-${this.size()}`];

    if (this.checked()) {
      classes.push('checkbox-checked');
    }

    if (this.isDisabled()) {
      classes.push('checkbox-disabled');
    }

    if (this.indeterminate()) {
      classes.push('checkbox-indeterminate');
    }

    if (this.error()) {
      classes.push('checkbox-error');
    }

    if (this.required()) {
      classes.push('checkbox-required');
    }

    return classes.join(' ');
  });

  /** id of the rendered help text (only while it is shown). */
  readonly helpTextId = computed(() =>
    this.helpText() && !this.error() ? `${this.id()}-help` : null,
  );

  /** id of the rendered error message (only while it is shown). */
  readonly errorMessageId = computed(() =>
    this.error() && this.errorMessage() ? `${this.id()}-error` : null,
  );

  /** aria-describedby: consumer-supplied ids plus the rendered help/error text. */
  readonly describedBy = computed(() => {
    const ids = [this.ariaDescribedBy(), this.helpTextId(), this.errorMessageId()].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  });

  // ControlValueAccessor implementation
  writeValue(value: boolean | null): void {
    this.checked.set(value ?? false);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  // Event handlers
  handleChange(event: Event): void {
    if (this.isDisabled()) {
      event.preventDefault();
      return;
    }

    const target = event.target as HTMLInputElement;
    const newValue = target.checked;

    // Clear indeterminate state when user interacts
    this.indeterminate.set(false);

    // model.set() emits `checkedChange` exactly once per actual change
    this.checked.set(newValue);
    this.onChange(newValue);
  }

  handleBlur(): void {
    this.onTouched();
  }

  // Control Value Accessor callbacks (private)
  private onChange: (value: boolean) => void = () => undefined;
  private onTouched: () => void = () => undefined;
}
