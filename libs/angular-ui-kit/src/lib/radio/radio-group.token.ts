import { InjectionToken, Signal } from '@angular/core';

/**
 * What an `lc-radio` inside an `lc-radio-group` reads from its group: the
 * shared name, the selected value and the group's states. Provided by
 * `RadioGroupComponent`; a radio without a group works on its own as before.
 */
export interface RadioGroupContext {
  /** The `name` every radio of the group renders. */
  readonly groupName: Signal<string>;
  /** The selected value; `''` = none. */
  readonly selectedValue: Signal<string>;
  readonly groupDisabled: Signal<boolean>;
  readonly groupRequired: Signal<boolean>;
  readonly groupInvalid: Signal<boolean>;
  /** Called by a radio the person selects. */
  select(value: string): void;
  /** Called when a radio loses focus (marks a bound form control touched). */
  touch(): void;
}

export const RADIO_GROUP = new InjectionToken<RadioGroupContext>('RADIO_GROUP');
