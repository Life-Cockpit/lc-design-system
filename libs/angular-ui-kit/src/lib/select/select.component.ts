import {
  Component,
  input,
  output,
  signal,
  computed,
  linkedSignal,
  ChangeDetectionStrategy,
  forwardRef,
  ElementRef,
  viewChild,
  inject,
  DOCUMENT,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

export type SelectValue = string | number | string[] | number[] | null;

/**
 * Select component for dropdown option selection.
 *
 * Features:
 * - Single and multiple selection modes
 * - Searchable/filterable option list
 * - Option groups with headers
 * - Loading state indicator
 * - Variant styles (outline, filled)
 * - Size presets (xs, sm, md, lg)
 * - Keyboard navigation support
 * - CDK overlay positioning
 * - ControlValueAccessor integration for reactive forms
 *
 * @example
 * ```html
 * <lc-select [options]="options" placeholder="Choose" [(ngModel)]="selected" />
 * ```
 */
@Component({
  selector: 'lc-select',
  standalone: true,
  imports: [FormsModule, OverlayModule],
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
})
export class SelectComponent implements ControlValueAccessor {
  private static nextId = 0;

  /** Per-instance id base; the listbox and its options derive their ids from it. */
  readonly selectId = `lc-select-${++SelectComponent.nextId}`;
  readonly listboxId = `${this.selectId}-listbox`;

  private readonly selectTrigger = viewChild<ElementRef<HTMLElement>>('selectTrigger');
  private readonly dropdownPanel = viewChild<ElementRef<HTMLElement>>('dropdownPanel');

  /**
   * Visual variant of the select
   */
  readonly variant = input<'outline' | 'filled'>('outline');

  /**
   * Size of the select
   */
  readonly size = input<'xs' | 'sm' | 'md' | 'lg'>('md');

  /**
   * Whether the select is disabled
   */
  readonly disabled = input<boolean>(false);

  /**
   * Whether the select is in error state
   */
  readonly error = input<boolean>(false);

  /**
   * Whether the select is required
   */
  readonly required = input<boolean>(false);

  /**
   * Whether the select is in loading state
   */
  readonly loading = input<boolean>(false);

  /**
   * Whether the select allows searching
   */
  readonly searchable = input<boolean>(false);

  /**
   * Whether multiple options can be selected
   */
  readonly multiple = input<boolean>(false);

  /**
   * Placeholder text when no option is selected
   */
  readonly placeholder = input<string>('Select an option');

  /**
   * Helper text displayed below the select
   */
  readonly helperText = input<string>('');

  /**
   * Error message displayed when error is true
   */
  readonly errorMessage = input<string>('');

  /**
   * ARIA label for accessibility
   */
  readonly ariaLabel = input<string | undefined>(undefined);

  /**
   * Select options (flat list or groups)
   */
  readonly options = input<SelectOption[] | SelectOptionGroup[]>([]);

  /**
   * Emitted when selection changes
   */
  readonly selectionChange = output<SelectValue>();

  /**
   * Emitted when dropdown opens
   */
  readonly opened = output<void>();

  /**
   * Emitted when dropdown closes
   */
  readonly closed = output<void>();

  // Internal state
  readonly value = signal<SelectValue>(null);
  readonly isOpen = signal<boolean>(false);
  readonly searchQuery = signal<string>('');

  /** Disabled state pushed in by the forms API (setDisabledState). */
  private readonly formDisabled = signal<boolean>(false);

  /** Effective disabled state: the `disabled` input OR the form control's disabled state. */
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  // Computed values
  readonly filteredOptions = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const opts = this.options();

    if (!query || !this.searchable()) {
      return this.flattenOptions(opts);
    }

    return this.flattenOptions(opts).filter((opt) => opt.label.toLowerCase().includes(query));
  });

  /** Keyboard highlight; resets whenever the visible option list changes so it never points at a stale row. */
  readonly highlightedIndex = linkedSignal<SelectOption[], number>({
    source: this.filteredOptions,
    computation: () => -1,
  });

  readonly activeDescendantId = computed(() => {
    const index = this.highlightedIndex();
    return this.isOpen() && index >= 0 ? this.optionId(index) : null;
  });

  readonly selectedLabel = computed(() => {
    const currentValue = this.value();
    const opts = this.options();

    if (currentValue === null) {
      return '';
    }

    if (this.multiple()) {
      const values = Array.isArray(currentValue) ? currentValue : [currentValue];
      return values
        .map((val) => this.findOptionByValue(val, opts)?.label)
        .filter(Boolean)
        .join(', ');
    }

    const val = Array.isArray(currentValue) ? currentValue[0] : currentValue;
    return this.findOptionByValue(val ?? '', opts)?.label || '';
  });

  readonly displayValue = computed(() => {
    const label = this.selectedLabel();
    if (label) {
      const currentValue = this.value();
      if (this.multiple() && Array.isArray(currentValue)) {
        const count = currentValue.length;
        return count > 1 ? `${count} selected` : label;
      }
      return label;
    }
    return this.placeholder();
  });

  /** id of the helper/error text the trigger is described by (aria-describedby) */
  readonly describedBy = computed(() => {
    if (this.error() && this.errorMessage()) {
      return `${this.selectId}-error`;
    }
    return this.helperText() ? `${this.selectId}-helper` : null;
  });

  /**
   * Computed classes for the select trigger element
   */
  readonly selectClasses = computed(() => {
    const classes = ['lc-select', `lc-select--${this.variant()}`, `lc-select--${this.size()}`];

    if (this.isDisabled()) {
      classes.push('lc-select--disabled');
    }

    if (this.error()) {
      classes.push('lc-select--error');
    }

    if (this.loading()) {
      classes.push('lc-select--loading');
    }

    if (this.isOpen()) {
      classes.push('lc-select--open');
    }

    return classes.join(' ');
  });

  // Private properties
  private readonly document = inject(DOCUMENT);
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange: (value: SelectValue) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched: () => void = () => {};

  // Public methods
  /**
   * Id of the option at `index` in the filtered list (used for aria-activedescendant)
   */
  optionId(index: number): string {
    return `${this.selectId}-option-${index}`;
  }

  /**
   * Toggle dropdown open/closed
   */
  toggle(): void {
    if (this.isDisabled() || this.loading()) {
      return;
    }
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Open dropdown
   */
  open(): void {
    if (this.isDisabled() || this.loading() || this.isOpen()) {
      return;
    }
    this.isOpen.set(true);
    this.opened.emit();
  }

  /**
   * Close dropdown. Idempotent: the overlay's `detach` re-enters here after
   * `isOpen` flips, and that second call must not emit `closed` again.
   */
  close(): void {
    if (!this.isOpen()) {
      return;
    }
    // If focus is inside the panel (search input) it would fall to <body> when the
    // overlay is torn down; hand it back to the trigger first.
    this.restoreFocusFromPanel();
    this.isOpen.set(false);
    this.searchQuery.set('');
    this.highlightedIndex.set(-1);
    this.closed.emit();
  }

  /**
   * Select an option
   */
  selectOption(option: SelectOption): void {
    if (option.disabled) {
      return;
    }

    if (this.multiple()) {
      const currentValue = this.value() || [];
      const currentArray = (Array.isArray(currentValue) ? currentValue : []) as (string | number)[];
      const index = currentArray.indexOf(option.value);

      const newValue = (
        index > -1
          ? currentArray.filter((v) => v !== option.value) // Deselect
          : [...currentArray, option.value] // Select
      ) as SelectValue;
      this.value.set(newValue);
      this.onChange(newValue);
      this.selectionChange.emit(newValue);
    } else {
      this.value.set(option.value);
      this.onChange(option.value);
      this.selectionChange.emit(option.value);
      this.close();
    }
  }

  /**
   * Check if an option is selected
   */
  isSelected(option: SelectOption): boolean {
    const currentValue = this.value();
    if (this.multiple()) {
      const values = Array.isArray(currentValue) ? currentValue : [];
      return values.some((v) => v === option.value);
    }
    return currentValue === option.value;
  }

  /**
   * Clear selection
   */
  clear(): void {
    if (this.multiple()) {
      this.value.set([]);
      this.onChange([]);
    } else {
      this.value.set(null);
      this.onChange(null);
    }
    this.selectionChange.emit(this.value());
  }

  /**
   * Handle keyboard navigation (trigger and search input share this handler)
   */
  onKeyDown(event: KeyboardEvent): void {
    if (this.isDisabled() || this.loading()) {
      return;
    }

    switch (event.key) {
      case ' ':
      case 'Enter':
        // Space must keep typing into the search box.
        if (event.key === ' ' && this.isSearchInput(event.target)) {
          return;
        }
        if (!this.isOpen()) {
          this.open();
        } else {
          const option = this.filteredOptions()[this.highlightedIndex()];
          if (option) {
            this.selectOption(option);
          }
        }
        event.preventDefault();
        break;

      case 'Escape':
        if (this.isOpen()) {
          this.close();
          event.preventDefault();
          // Only this select should react; keep the key from reaching enclosing overlays.
          event.stopPropagation();
        }
        break;

      case 'ArrowDown':
        if (!this.isOpen()) {
          this.open();
        } else {
          const count = this.filteredOptions().length;
          if (count > 0) {
            this.highlightedIndex.set((this.highlightedIndex() + 1) % count);
          }
        }
        event.preventDefault();
        break;

      case 'ArrowUp':
        if (!this.isOpen()) {
          this.open();
        } else {
          const count = this.filteredOptions().length;
          if (count > 0) {
            const current = this.highlightedIndex();
            this.highlightedIndex.set(current <= 0 ? count - 1 : current - 1);
          }
        }
        event.preventDefault();
        break;

      case 'Home':
        if (this.isOpen() && this.filteredOptions().length > 0) {
          this.highlightedIndex.set(0);
          event.preventDefault();
        }
        break;

      case 'End':
        if (this.isOpen() && this.filteredOptions().length > 0) {
          this.highlightedIndex.set(this.filteredOptions().length - 1);
          event.preventDefault();
        }
        break;
    }
  }

  /**
   * Handle blur event
   */
  onBlur(): void {
    this.onTouched();
  }

  /**
   * Handle click outside
   */
  onClickOutside(): void {
    this.close();
  }

  // ControlValueAccessor implementation
  writeValue(value: SelectValue): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: SelectValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  // Private helper methods
  private isSearchInput(target: EventTarget | null): boolean {
    return target instanceof HTMLInputElement;
  }

  private restoreFocusFromPanel(): void {
    const panel = this.dropdownPanel()?.nativeElement;
    const active = this.document.activeElement;
    if (panel && active && panel.contains(active)) {
      this.selectTrigger()?.nativeElement.focus();
    }
  }

  private findOptionByValue(
    value: string | number,
    options: SelectOption[] | SelectOptionGroup[],
  ): SelectOption | undefined {
    const flatOptions = this.flattenOptions(options);
    return flatOptions.find((opt) => opt.value === value);
  }

  private flattenOptions(options: SelectOption[] | SelectOptionGroup[]): SelectOption[] {
    if (!options || options.length === 0) {
      return [];
    }

    // Check if first item is a group
    const firstItem = options[0];
    if (firstItem && 'options' in firstItem) {
      return (options as SelectOptionGroup[]).flatMap((group) => group.options);
    }

    return options as SelectOption[];
  }
}
