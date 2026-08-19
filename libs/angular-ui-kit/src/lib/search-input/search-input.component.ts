import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  model,
  output,
  computed,
  ElementRef,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IconComponent } from '../icon/icon.component';
import { Subject, debounce, distinctUntilChanged, filter, of, timer } from 'rxjs';

export type SearchInputSize = 'sm' | 'md' | 'lg';

/** A value travelling through the debounce pipe. */
interface SearchEmission {
  readonly value: string;
  /** Bypass the debounce (clear button, external writes). */
  readonly immediate: boolean;
  /** Only update the dedupe baseline, never reach `searchChange` (external writes). */
  readonly silent: boolean;
}

let nextUniqueId = 0;

/**
 * Search input component with integrated search functionality.
 *
 * Features:
 * - Built-in search icon
 * - Clear button for resetting input
 * - RxJS-based configurable debounce
 * - Multiple size variants (sm, md, lg)
 * - Disabled state support
 * - Submit event on Enter key
 * - Two-way bindable `value` so a parent can preset or reset the query
 *
 * @example
 * ```html
 * <lc-search-input
 *   placeholder="Search..."
 *   [debounceMs]="300"
 *   [(value)]="query"
 *   (searchChange)="onSearch($event)"
 * ></lc-search-input>
 * ```
 */
@Component({
  selector: 'lc-search-input',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent {
  /**
   * id of the native input (lets a parent `<label for>` point at it).
   * @default generated
   */
  readonly inputId = input<string>(`lc-search-input-${++nextUniqueId}`);

  /**
   * Placeholder text.
   * @default 'Search…'
   */
  placeholder = input<string>('Search…');

  /**
   * Size variant.
   * @default 'md'
   */
  size = input<SearchInputSize>('md');

  /**
   * Debounce delay in milliseconds. 0 means no debounce.
   * @default 300
   */
  debounceMs = input<number>(300);

  /**
   * Whether the search input is disabled.
   * @default false
   */
  disabled = input<boolean>(false);

  /**
   * Accessible name of the input.
   * @default 'Search'
   */
  readonly ariaLabel = input<string>();

  /** id(s) of external element(s) labelling the input (wins over `ariaLabel`). */
  readonly ariaLabelledBy = input<string>();

  /**
   * Current query (two-way bindable). Writing it from outside updates the
   * field without emitting `searchChange`; `valueChange` emits on every
   * keystroke (undebounced) and on clear.
   */
  readonly value = model<string>('');

  /**
   * Emitted when the search value changes (debounced).
   */
  readonly searchChange = output<string>();

  /**
   * Emitted when the user presses Enter.
   */
  readonly searchSubmit = output<string>();

  protected readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('searchInputEl');

  protected wrapperClasses = computed(() => {
    return [
      'search-input',
      `search-input--${this.size()}`,
      this.disabled() ? 'search-input--disabled' : '',
    ]
      .filter(Boolean)
      .join(' ');
  });

  private readonly input$ = new Subject<SearchEmission>();
  /** Last value pushed into the pipe (by typing, clear or an external write). */
  private lastPushed = '';

  constructor() {
    this.input$
      .pipe(
        // debounceMs is read per emission, so changing it takes effect immediately.
        // 0 means "no debounce" — emit synchronously rather than on a 0ms timer.
        debounce(({ immediate }) => {
          const ms = this.debounceMs();
          return immediate || ms <= 0 ? of(null) : timer(ms);
        }),
        distinctUntilChanged((a, b) => a.value === b.value),
        filter(({ silent }) => !silent),
        takeUntilDestroyed(),
      )
      .subscribe(({ value }) => this.searchChange.emit(value));

    // A value written from outside is already known to the parent: run it through
    // the pipe silently so it becomes the dedupe baseline (and cancels a pending
    // debounce) without echoing a searchChange back.
    effect(() => {
      const value = this.value();
      untracked(() => {
        if (value !== this.lastPushed) {
          this.push(value, { immediate: true, silent: true });
        }
      });
    });
  }

  protected onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.push(val, { immediate: false, silent: false });
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchSubmit.emit(this.value());
    }
  }

  protected clear(): void {
    this.value.set('');
    // immediate: emits '' synchronously through the pipe, exactly once
    this.push('', { immediate: true, silent: false });
    this.inputRef()?.nativeElement.focus();
  }

  private push(value: string, opts: Omit<SearchEmission, 'value'>): void {
    this.lastPushed = value;
    this.input$.next({ value, ...opts });
  }
}
