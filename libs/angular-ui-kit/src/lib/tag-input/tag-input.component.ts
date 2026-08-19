import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
  computed,
  output,
  forwardRef,
  ElementRef,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'lc-tag-input',
  standalone: true,
  templateUrl: './tag-input.component.html',
  styleUrls: ['./tag-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagInputComponent),
      multi: true,
    },
  ],
})
export class TagInputComponent implements ControlValueAccessor {
  private static nextId = 0;

  readonly placeholder = input('Add tag…');
  readonly maxTags = input(Infinity);
  readonly allowDuplicates = input(false);
  readonly removable = input(true);
  readonly disabled = input(false);
  readonly separator = input<'enter' | 'comma' | 'both'>('both');
  readonly suggestions = input<string[]>([]);
  readonly label = input('');

  readonly tagAdded = output<string>();
  readonly tagRemoved = output<string>();

  /** Per-instance id wiring the label, the suggestion listbox and its options to the input. */
  readonly inputId = `lc-tag-input-${++TagInputComponent.nextId}`;
  protected readonly listboxId = `${this.inputId}-listbox`;

  protected tags = signal<string[]>([]);
  protected inputValue = signal('');
  protected focused = signal(false);

  /** Index of the keyboard-highlighted suggestion; -1 = none. */
  protected activeIndex = signal(-1);

  /** Set by Escape; hides the list until the text changes again. */
  private readonly suggestionsDismissed = signal(false);

  /** Disabled through the form control (`setDisabledState`), as opposed to the input. */
  private readonly formDisabled = signal(false);

  /** Disabled by either route — the one flag the template consults. */
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  protected readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');

  protected readonly filteredSuggestions = computed(() => {
    const val = this.inputValue().toLowerCase().trim();
    if (!val) return [];
    return this.suggestions().filter(
      s => s.toLowerCase().includes(val) && (this.allowDuplicates() || !this.tags().includes(s))
    );
  });

  /** Combobox semantics only make sense when there is a list to open. */
  protected readonly hasSuggestions = computed(() => this.suggestions().length > 0);

  protected readonly showSuggestions = computed(
    () => this.focused() && !this.suggestionsDismissed() && this.filteredSuggestions().length > 0
  );

  protected readonly canAdd = computed(() => this.tags().length < this.maxTags());

  /**
   * The input stays mounted when the limit is reached (removing it would drop
   * focus to `<body>`); it becomes read-only and says why.
   */
  protected readonly inputPlaceholder = computed(() => {
    if (!this.canAdd()) return `Maximum of ${this.maxTags()} tags reached`;
    return this.tags().length ? '' : this.placeholder();
  });

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange: (val: string[]) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched: () => void = () => {};

  writeValue(value: string[] | null): void {
    this.tags.set(value ?? []);
  }

  registerOnChange(fn: (val: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  protected optionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }

  protected addTag(value: string): void {
    const tag = value.trim();
    if (!tag || !this.canAdd()) return;
    if (!this.allowDuplicates() && this.tags().includes(tag)) return;

    this.tags.update(t => [...t, tag]);
    this.inputValue.set('');
    this.activeIndex.set(-1);
    this.onChange(this.tags());
    this.tagAdded.emit(tag);
  }

  protected removeTag(index: number): void {
    const removed = this.tags()[index];
    this.tags.update(t => t.filter((_, i) => i !== index));
    this.onChange(this.tags());
    this.tagRemoved.emit(removed);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const sep = this.separator();
    const val = this.inputValue();
    const listOpen = this.showSuggestions();

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        const count = this.filteredSuggestions().length;
        if (!count) return;
        event.preventDefault();
        this.suggestionsDismissed.set(false);
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        const next = (this.activeIndex() + delta + count) % count;
        this.activeIndex.set(next);
        document.getElementById(this.optionId(next))?.scrollIntoView?.({ block: 'nearest' });
        return;
      }
      case 'Escape':
        if (listOpen) {
          event.preventDefault();
          this.suggestionsDismissed.set(true);
          this.activeIndex.set(-1);
        }
        return;
      case 'Enter':
        if (listOpen && this.activeIndex() >= 0) {
          event.preventDefault();
          this.addTag(this.filteredSuggestions()[this.activeIndex()]);
        } else if (sep === 'enter' || sep === 'both') {
          event.preventDefault();
          this.addTag(val);
        }
        return;
      case ',':
        if (sep === 'comma' || sep === 'both') {
          event.preventDefault();
          this.addTag(val);
        }
        return;
      case 'Backspace':
        if (!val && this.removable() && this.tags().length > 0) {
          this.removeTag(this.tags().length - 1);
        }
        return;
    }
  }

  protected onInput(event: Event): void {
    this.inputValue.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(-1);
    this.suggestionsDismissed.set(false);
  }

  protected onFocus(): void {
    this.focused.set(true);
  }

  protected onBlur(): void {
    this.focused.set(false);
    this.activeIndex.set(-1);
    this.onTouched();
    const val = this.inputValue();
    if (val.trim()) this.addTag(val);
  }

  protected selectSuggestion(value: string): void {
    this.addTag(value);
    this.inputEl()?.nativeElement.focus();
  }

  protected focusInput(): void {
    this.inputEl()?.nativeElement.focus();
  }
}
