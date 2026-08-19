import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  afterRenderEffect,
  computed,
  forwardRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

let nextUniqueId = 0;

/**
 * Textarea component for multi-line text input.
 *
 * Features:
 * - Variant styles (outline, filled)
 * - Size presets (xs, sm, md, lg)
 * - Auto-resize with configurable min/max rows
 * - Character count display with maxLength
 * - Validation error message and helper text
 * - Disabled and readonly states
 * - ControlValueAccessor integration for reactive forms
 *
 * @example
 * ```html
 * <lc-textarea placeholder="Enter message" [autoResize]="true" [(ngModel)]="message" />
 * ```
 */
@Component({
  selector: 'lc-textarea',
  standalone: true,
  imports: [],
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    },
  ],
})
export class TextareaComponent implements ControlValueAccessor {
  private readonly textareaElement = viewChild<ElementRef<HTMLTextAreaElement>>('textarea');

  /**
   * Visual variant of the textarea
   */
  readonly variant = input<'outline' | 'filled'>('outline');

  /**
   * Size of the textarea
   */
  readonly size = input<'xs' | 'sm' | 'md' | 'lg'>('md');

  /**
   * Whether the textarea is disabled
   */
  readonly disabled = input<boolean>(false);

  /**
   * Whether the textarea is in error state
   */
  readonly error = input<boolean>(false);

  /**
   * Whether the textarea is required
   */
  readonly required = input<boolean>(false);

  /**
   * Whether the textarea is readonly
   */
  readonly readonly = input<boolean>(false);

  /**
   * Placeholder text
   */
  readonly placeholder = input<string>('');

  /**
   * Label text displayed above the textarea
   */
  readonly label = input<string>('');

  /**
   * Helper text displayed below the textarea
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
   * Number of visible text rows
   */
  readonly rows = input<number>(3);

  /**
   * Maximum number of characters allowed
   */
  readonly maxLength = input<number | undefined>(undefined);

  /**
   * Whether to show character count
   */
  readonly showCharacterCount = input<boolean>(false);

  /**
   * Whether to automatically resize based on content
   */
  readonly autoResize = input<boolean>(false);

  /**
   * Minimum number of rows for auto-resize
   */
  readonly minRows = input<number>(3);

  /**
   * Maximum number of rows for auto-resize
   */
  readonly maxRows = input<number | undefined>(undefined);

  /**
   * Emitted when value changes
   */
  readonly valueChange = output<string>();

  /** Per-instance id: links label, error and helper text to the control. */
  readonly textareaId = `lc-textarea-${nextUniqueId++}`;
  readonly errorId = `${this.textareaId}-error`;
  readonly helperId = `${this.textareaId}-helper`;

  // Internal state
  readonly value = signal<string>('');

  // Internal disabled state (for ControlValueAccessor)
  private readonly formDisabled = signal<boolean>(false);

  /**
   * Computed disabled state from both input and form control
   */
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  // Computed values
  readonly currentCharacterCount = computed(() => this.value().length);

  readonly characterCountText = computed(() => {
    const current = this.currentCharacterCount();
    const max = this.maxLength();
    return max !== undefined ? `${current} / ${max}` : `${current}`;
  });

  readonly isOverLimit = computed(() => {
    const max = this.maxLength();
    return max !== undefined && this.currentCharacterCount() > max;
  });

  /** Whether an error message is shown (drives aria-describedby) */
  readonly showsError = computed(() => this.error() && !!this.errorMessage());

  /** Whether the helper text is shown (error message takes precedence) */
  readonly showsHelper = computed(() => !this.showsError() && !!this.helperText());

  readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.showsError()) ids.push(this.errorId);
    if (this.showsHelper()) ids.push(this.helperId);
    return ids.length ? ids.join(' ') : null;
  });

  /**
   * Computed classes for the textarea element
   */
  readonly textareaClasses = computed(() => {
    const classes = ['lc-textarea', `lc-textarea--${this.variant()}`, `lc-textarea--${this.size()}`];

    if (this.isDisabled()) {
      classes.push('lc-textarea--disabled');
    }

    if (this.error()) {
      classes.push('lc-textarea--error');
    }

    if (this.readonly()) {
      classes.push('lc-textarea--readonly');
    }

    if (this.autoResize()) {
      classes.push('lc-textarea--auto-resize');
    }

    return classes.join(' ');
  });

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange: (value: string) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched: () => void = () => {};

  constructor() {
    // Re-measure after every render in which the value or the resize
    // constraints changed — this covers typing, form writes and input changes
    // without timers, and runs once the DOM already holds the new value.
    afterRenderEffect(() => {
      this.value();
      this.minRows();
      this.maxRows();
      if (this.autoResize()) {
        this.adjustHeight();
      }
    });
  }

  /**
   * Handle input changes
   */
  onInput(value: string): void {
    if (this.isDisabled() || this.readonly()) {
      return;
    }

    this.value.set(value);
    this.onChange(value);
    this.valueChange.emit(value);
  }

  /**
   * Handle blur event
   */
  onBlur(): void {
    this.onTouched();
  }

  // ControlValueAccessor implementation
  writeValue(value: string | null | undefined): void {
    this.value.set(value || '');
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

  // Private helper methods
  private adjustHeight(): void {
    const textarea = this.textareaElement()?.nativeElement;
    if (!textarea) {
      return;
    }

    // Reset height to get accurate scrollHeight
    textarea.style.height = 'auto';

    const minHeight = this.rowsToHeight(textarea, this.minRows());
    const maxHeight = this.rowsToHeight(textarea, this.maxRows());
    let newHeight = textarea.scrollHeight;

    // Apply constraints
    if (minHeight !== undefined) {
      newHeight = Math.max(newHeight, minHeight);
    }
    if (maxHeight !== undefined) {
      newHeight = Math.min(newHeight, maxHeight);
    }

    textarea.style.height = `${newHeight}px`;
  }

  /** Pixel height for `rows` lines incl. vertical padding; undefined when it cannot be measured. */
  private rowsToHeight(textarea: HTMLTextAreaElement, rows: number | undefined): number | undefined {
    if (rows === undefined) {
      return undefined;
    }

    const style = getComputedStyle(textarea);
    const lineHeight = parseFloat(style.lineHeight);
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingBottom = parseFloat(style.paddingBottom) || 0;

    // 'normal' / unmeasurable line-height (e.g. jsdom) → no constraint
    if (!Number.isFinite(lineHeight)) {
      return undefined;
    }

    return lineHeight * rows + paddingTop + paddingBottom;
  }

  protected getInputValue(event: Event): string {
    return (event.target as HTMLTextAreaElement).value;
  }
}
