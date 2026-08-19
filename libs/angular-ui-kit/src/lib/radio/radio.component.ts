import {
  Component,
  input,
  model,
  output,
  signal,
  computed,
  effect,
  untracked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  DestroyRef,
  ElementRef,
  Injectable,
  inject,
  viewChild,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { Subscription } from 'rxjs';

export type RadioSize = 'xs' | 'sm' | 'md' | 'lg';

let nextUniqueId = 0;

/**
 * Tracks every live `lc-radio` so that checking one radio can uncheck the
 * others of its group. The browser does this natively (same `name`, same form
 * owner) without firing an event on the radios that lose the check, so their
 * component state would otherwise go stale.
 */
@Injectable({ providedIn: 'root' })
export class RadioGroupRegistry {
  private readonly radios = new Set<RadioComponent>();

  add(radio: RadioComponent): void {
    this.radios.add(radio);
  }

  remove(radio: RadioComponent): void {
    this.radios.delete(radio);
  }

  /** Marks `source` as the checked radio of its group; siblings are unchecked. */
  select(source: RadioComponent): void {
    const name = source.name();
    if (!name) return;
    const form = source.formOwner();
    for (const radio of this.radios) {
      if (radio !== source && radio.name() === name && radio.formOwner() === form) {
        radio.checked.set(false);
      }
    }
  }
}

@Component({
  selector: 'lc-radio',
  standalone: true,
  imports: [],
  templateUrl: './radio.component.html',
  styleUrl: './radio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Radio button component for single-option selection within a group.
 *
 * Features:
 * - Single selection within a named radio group
 * - Multiple size variants (sm, md, lg)
 * - Validation error display with error message
 * - Help text support
 * - Full accessibility with ARIA attributes
 * - ControlValueAccessor integration for reactive forms
 *
 * @example
 * ```html
 * <lc-radio label="Option A" value="a" name="group1" />
 * <lc-radio label="Option B" value="b" name="group1" />
 * ```
 */
export class RadioComponent implements ControlValueAccessor, OnInit, OnDestroy {
  // Inputs
  readonly id = input<string>(`lc-radio-${nextUniqueId++}`);
  readonly label = input<string>('');
  readonly value = input<string>('');
  readonly name = input<string>('');
  readonly error = input<boolean>(false);
  readonly errorMessage = input<string>('');
  readonly helpText = input<string>('');
  readonly size = input<RadioSize>('md');
  readonly required = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly ariaLabel = input<string>('');
  readonly ariaLabelledBy = input<string>('');
  readonly ariaDescribedBy = input<string>('');

  /**
   * Checked state (two-way bindable). Emits `checkedChange` whenever it
   * changes: on user selection, when a sibling of the same group is selected,
   * and when a bound form control writes a value.
   */
  readonly checked = model<boolean>(false);

  // Outputs
  readonly valueChange = output<string>();

  /** Disabled state pushed by a form control (`setDisabledState`). */
  private readonly formDisabled = signal(false);

  /** Effective disabled state: `disabled` input OR form control disabled. */
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  readonly labelClasses = computed(() => {
    const classes = ['radio-label', `radio-${this.size()}`];

    if (this.checked()) {
      classes.push('radio-checked');
    }

    if (this.isDisabled()) {
      classes.push('radio-disabled');
    }

    if (this.error()) {
      classes.push('radio-error');
    }

    if (this.required()) {
      classes.push('radio-required');
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

  // Private fields
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngControl = inject(NgControl, { optional: true, self: true });
  private readonly registry = inject(RadioGroupRegistry);
  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('radioInput');
  /**
   * Last value written by a bound form control; `null` until a form has
   * written once, so `[checked]` bindings on unbound radios are left alone.
   */
  private readonly formValue = signal<string | null>(null);
  private valueChangeSub?: Subscription;

  // Control Value Accessor callbacks
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    // Prevent circular dependency by not providing NG_VALUE_ACCESSOR here
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }

    this.registry.add(this);
    inject(DestroyRef).onDestroy(() => this.registry.remove(this));

    // A form-bound radio is checked exactly when the form value equals its own value.
    effect(() => {
      const fv = this.formValue();
      const v = this.value();
      if (fv === null) return;
      untracked(() => this.checked.set(fv !== '' && v !== '' && fv === v));
    });
  }

  ngOnInit(): void {
    // Subscribe to form control value changes
    if (this.ngControl?.control) {
      this.valueChangeSub = this.ngControl.control.valueChanges.subscribe((value: string) => {
        this.formValue.set(value || '');
        this.cdr.markForCheck();
      });
      // Set initial value
      const initialValue = this.ngControl.control.value as string;
      if (initialValue) {
        this.formValue.set(initialValue);
      }
    }
  }

  ngOnDestroy(): void {
    this.valueChangeSub?.unsubscribe();
  }

  /** Native form owner of the radio input; scopes the radio group like the browser does. */
  formOwner(): HTMLFormElement | null {
    return this.inputEl()?.nativeElement.form ?? null;
  }

  // ControlValueAccessor implementation
  writeValue(value: string | null): void {
    // The `checked` model follows formValue via the effect above
    this.formValue.set(value || '');
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  // Event handlers
  public handleChange(event: Event): void {
    if (this.isDisabled()) {
      event.preventDefault();
      return;
    }

    // model.set() emits `checkedChange` once; siblings that the browser just
    // unchecked natively are updated through the registry.
    this.checked.set(true);
    this.registry.select(this);

    // Notify the form control - it will call writeValue on all radios
    this.onChange(this.value());
    this.valueChange.emit(this.value());
  }

  public handleBlur(): void {
    this.onTouched();
  }
}
