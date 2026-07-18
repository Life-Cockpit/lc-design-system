import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  model,
} from '@angular/core';
import { NgClass } from '@angular/common';

export type ToggleOptionDot = 'warning' | 'error' | 'success';

export interface ToggleOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
  /**
   * Small status dot rendered to the right of the label (e.g. an unread
   * indicator). `true` uses the default tone (`warning`); pass a tone name
   * to pick a semantic color. Does not change the option's height.
   */
  readonly dot?: boolean | ToggleOptionDot;
}

/**
 * Toggle group component for single-option selection from a set.
 *
 * Features:
 * - Multiple segmented toggle buttons
 * - Active state highlighting
 * - Size variants (sm, md, lg)
 * - Two-way selected value binding
 * - Per-option disabled state
 * - Dark mode support via CSS custom properties
 *
 * @example
 * ```html
 * <lc-toggle-group
 *   [options]="[{value:'1D',label:'1D'},{value:'1W',label:'1W'}]"
 *   [(selected)]="interval"
 * />
 * ```
 */
@Component({
  selector: 'lc-toggle-group',
  standalone: true,
  imports: [NgClass],
  templateUrl: './toggle-group.component.html',
  styleUrl: './toggle-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleGroupComponent {
  /** Available toggle options */
  options = input.required<readonly ToggleOption[]>();

  /** Currently selected value (two-way binding) */
  selected = model<string>('');

  /** Size variant */
  size = input<'sm' | 'md' | 'lg'>('md');

  /** Emitted when selection changes */
  selectionChange = output<string>();

  /** Computed size class */
  sizeClass = computed(() => `lc-toggle-group--${this.size()}`);

  /** Select an option */
  select(option: ToggleOption): void {
    if (option.disabled) return;
    this.selected.set(option.value);
    this.selectionChange.emit(option.value);
  }

  /** Check if an option is active */
  isActive(option: ToggleOption): boolean {
    return this.selected() === option.value;
  }

  /** Get button classes */
  getButtonClasses(option: ToggleOption): string {
    const classes = ['lc-toggle-group__btn'];

    if (this.isActive(option)) {
      classes.push('lc-toggle-group__btn--active');
    }
    if (option.disabled) {
      classes.push('lc-toggle-group__btn--disabled');
    }

    return classes.join(' ');
  }

  /** Resolve the dot tone for an option (null when no dot is shown) */
  dotTone(option: ToggleOption): ToggleOptionDot | null {
    if (!option.dot) return null;
    return option.dot === true ? 'warning' : option.dot;
  }
}
