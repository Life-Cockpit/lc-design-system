import { ChangeDetectionStrategy, Component, computed, forwardRef, input, model, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { RADIO_GROUP, RadioGroupContext } from './radio-group.token';

let nextUniqueId = 0;

export type RadioGroupOrientation = 'vertical' | 'horizontal';

/**
 * A group of `lc-radio`s: a native `<fieldset>` named by its `<legend>`, with
 * group help text and one group error, both linked by `aria-describedby`. The
 * group gives every radio inside the same `name`, `required`, `disabled` and
 * invalid state, and holds the selected value (`[(value)]` or a form control on
 * the group).
 *
 * @example
 * ```html
 * <lc-radio-group legend="Sprache" [legendHidden]="true" [(value)]="locale">
 *   <lc-radio value="device" label="Wie dieses Gerät" size="lg" />
 *   <lc-radio value="en" label="English" size="lg" lang="en" />
 *   <lc-radio value="de" label="Deutsch" size="lg" lang="de" />
 * </lc-radio-group>
 * ```
 */
@Component({
  selector: 'lc-radio-group',
  templateUrl: './radio-group.component.html',
  styleUrl: './radio-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: RADIO_GROUP, useExisting: forwardRef(() => RadioGroupComponent) },
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RadioGroupComponent), multi: true },
  ],
})
export class RadioGroupComponent implements RadioGroupContext, ControlValueAccessor {
  /** The group's question, rendered as the `<legend>` (its accessible name). */
  readonly legend = input<string>('');

  /** Hide the legend visually; screen readers still read it. */
  readonly legendHidden = input<boolean>(false);

  /** The `name` of every radio in the group. Unset = a generated one. */
  readonly name = input<string>('');

  /** Help for the whole group, below the legend. */
  readonly helpText = input<string>('');

  /** One error for the whole group, below the help text; marks every radio invalid. */
  readonly error = input<string>('');

  /** Every radio is `required`. */
  readonly required = input<boolean>(false);

  /** Show `*` after the legend of a required group. */
  readonly requiredIndicator = input<boolean>(true);

  /** Accessible name of the `*` marker. */
  readonly requiredAriaLabel = input('required');

  /** Disables every radio. */
  readonly disabled = input<boolean>(false);

  /** `vertical` (default) or `horizontal` (wraps). */
  readonly orientation = input<RadioGroupOrientation>('vertical');

  /** The selected value (two-way bindable); `''` = none. */
  readonly value = model<string>('');

  readonly groupId = `lc-radio-group-${nextUniqueId++}`;
  readonly helpId = `${this.groupId}-help`;
  readonly errorId = `${this.groupId}-error`;

  private readonly formDisabled = signal(false);
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  readonly groupName = computed(() => this.name() || this.groupId);
  readonly selectedValue = computed(() => this.value());
  readonly groupDisabled = computed(() => this.disabled() || this.formDisabled());
  readonly groupRequired = computed(() => this.required());
  readonly groupInvalid = computed(() => !!this.error());

  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.helpText()) ids.push(this.helpId);
    if (this.error()) ids.push(this.errorId);
    return ids.length ? ids.join(' ') : null;
  });

  select(value: string): void {
    if (this.groupDisabled()) return;
    this.value.set(value);
    this.onChange(value);
  }

  touch(): void {
    this.onTouched();
  }

  writeValue(value: string | null | undefined): void {
    this.value.set(value ?? '');
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
}
