import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SearchInputComponent } from '../search-input/search-input.component';
import { SelectComponent, SelectOption } from '../select/select.component';

/**
 * Configuration for a single filter in the FilterBar.
 */
export interface FilterConfig {
  /** Unique key for this filter */
  readonly key: string;
  /** Display label */
  readonly label: string;
  /** Filter type */
  readonly type: 'select' | 'toggle' | 'search';
  /** Available options for select/toggle types */
  readonly options?: readonly FilterOption[];
  /** Placeholder text (for search type) */
  readonly placeholder?: string;
}

export interface FilterOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface FilterValues {
  [key: string]: string;
}

const NO_OPTIONS: SelectOption[] = [];

/**
 * Filter bar component for composable data filtering.
 *
 * Features:
 * - Select dropdowns, toggle groups, and search inputs
 * - Declarative filter configuration via FilterConfig array
 * - Two-way filter values binding
 * - Responsive horizontal flex layout
 * - Size variants (sm, md)
 * - Dark mode support
 *
 * @example
 * ```html
 * <lc-filter-bar
 *   [filters]="filterConfig"
 *   [values]="currentFilters"
 *   (valuesChange)="onFilterChange($event)"
 * />
 * ```
 */
@Component({
  selector: 'lc-filter-bar',
  standalone: true,
  imports: [FormsModule, SelectComponent, SearchInputComponent],
  templateUrl: './filter-bar.component.html',
  styleUrl: './filter-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBarComponent {
  private static nextId = 0;

  /** Per-instance id prefix for label/control linking */
  readonly barId = `lc-filter-bar-${++FilterBarComponent.nextId}`;

  /** Filter configurations */
  filters = input.required<readonly FilterConfig[]>();

  /** Current filter values (two-way bindable) */
  values = input<FilterValues>({});

  /** Size variant */
  size = input<'sm' | 'md'>('md');

  /** Emitted when any filter value changes */
  valuesChange = output<FilterValues>();

  /** Computed size class */
  sizeClass = computed(() => `lc-filter-bar--${this.size()}`);

  /**
   * Select options per filter key, built once per `filters` change so the
   * lc-select `options` input keeps a stable reference across change detection.
   */
  private readonly selectOptionsByKey = computed(() => {
    const map = new Map<string, SelectOption[]>();
    for (const filter of this.filters()) {
      if (filter.type === 'select') {
        map.set(filter.key, (filter.options ?? []).map((opt) => ({ ...opt })));
      }
    }
    return map;
  });

  /** Get the current value for a filter key */
  getValue(key: string): string {
    return this.values()[key] ?? '';
  }

  /** Memoised select options for a filter key */
  selectOptions(key: string): SelectOption[] {
    return this.selectOptionsByKey().get(key) ?? NO_OPTIONS;
  }

  /** id of the control rendered for a filter (used by `<label for>`) */
  fieldId(key: string): string {
    return `${this.barId}-${key}`;
  }

  /** id of the label rendered for a filter (used by `aria-labelledby`) */
  labelId(key: string): string {
    return `${this.barId}-${key}-label`;
  }

  /** Handle select / toggle change */
  onFilterChange(key: string, value: string): void {
    const updated = { ...this.values(), [key]: value };
    this.valuesChange.emit(updated);
  }

  /** Handle search input */
  onSearchInput(key: string, value: string): void {
    this.onFilterChange(key, value);
  }

  normalizeSelectValue(value: string | number | null): string {
    return value == null ? '' : String(value);
  }

  /** Check if a toggle option is active */
  isToggleActive(key: string, optionValue: string): boolean {
    return this.getValue(key) === optionValue;
  }

  /** Get toggle button classes */
  getToggleClasses(key: string, option: FilterOption): string {
    const classes = ['lc-filter-bar__toggle-btn'];
    if (this.isToggleActive(key, option.value)) {
      classes.push('lc-filter-bar__toggle-btn--active');
    }
    if (option.disabled) {
      classes.push('lc-filter-bar__toggle-btn--disabled');
    }
    return classes.join(' ');
  }

}
