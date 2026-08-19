import {
  Component,
  input,
  output,
  computed,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  ViewEncapsulation,
} from '@angular/core';
import { NgClass } from '@angular/common';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'link'
  | 'danger'
  | 'warning'
  | 'info';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';
export type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'lc-button',
  standalone: true,
  imports: [NgClass],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  encapsulation: ViewEncapsulation.None, // Required for dynamic variant class styling
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Button component for user actions and form submissions.
 *
 * Features:
 * - Multiple variants (primary, secondary, outline, ghost, danger, link)
 * - Size options (xs, sm, md, lg)
 * - Loading state with spinner
 * - Icon-only mode
 * - Full-width layout option
 * - Keyboard and focus handling
 * - Accessible with ARIA attributes
 *
 * @example
 * ```html
 * <lc-button variant="primary" size="md">Save</lc-button>
 * ```
 */
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly iconOnly = input(false);
  readonly fullWidth = input(false);
  readonly ariaLabel = input('');
  readonly type = input<ButtonType>('button');

  /**
   * Native tooltip (title attribute) on the button.
   */
  readonly title = input('');

  /**
   * Reason shown as tooltip while the button is disabled (or loading).
   * Takes precedence over `title` in that state. The tooltip also appears
   * over the disabled button — the component guarantees the inner button
   * never gets `pointer-events: none`.
   */
  readonly disabledReason = input('');

  /**
   * Render as an inline text button that inherits font size, weight and
   * line-height from the surrounding text (for links inside copy, clickable
   * row titles, linked counters). Pair with `variant="link"`.
   * @default false
   */
  readonly inline = input(false);

  readonly clicked = output<void>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  @ViewChild('buttonElement') buttonElement!: ElementRef<HTMLButtonElement>;

  readonly isDisabled = computed(() => this.disabled() || this.loading());

  /**
   * Tooltip actually applied to the button: `disabledReason` while disabled,
   * `title` otherwise.
   */
  readonly effectiveTitle = computed(() => {
    if (this.isDisabled() && this.disabledReason()) {
      return this.disabledReason();
    }
    return this.title() || null;
  });

  handleClick(): void {
    if (!this.isDisabled()) {
      this.clicked.emit();
    }
  }

  handleFocus(): void {
    this.focused.emit();
  }

  handleBlur(): void {
    this.blurred.emit();
  }

  focus(): void {
    this.buttonElement?.nativeElement.focus();
  }

  blur(): void {
    this.buttonElement?.nativeElement.blur();
  }
}
