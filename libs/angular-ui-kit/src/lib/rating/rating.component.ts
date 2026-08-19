import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  computed,
  signal,
  forwardRef,
  viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

export type RatingSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'lc-rating',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RatingComponent),
      multi: true,
    },
  ],
})
/**
 * Rating component for star-based value selection.
 *
 * Features:
 * - Configurable maximum star count
 * - Half-star rating support (click the left half of a star, or step with the arrow keys)
 * - Multiple size variants (sm, md, lg)
 * - Read-only and disabled states
 * - Hover preview with visual feedback
 * - Keyboard: Arrow keys step the value, Home/End jump to the ends
 * - ControlValueAccessor integration for reactive forms
 *
 * @example
 * ```html
 * <lc-rating [max]="5" [allowHalf]="true" label="Rate this" />
 * ```
 */
export class RatingComponent implements ControlValueAccessor {
  private static nextId = 0;

  /** Maximum number of stars */
  max = input<number>(5);

  /** Size variant */
  size = input<RatingSize>('md');

  /** Whether the rating is read-only */
  readonly = input<boolean>(false);

  /** Whether the rating is disabled */
  disabled = input<boolean>(false);

  /** Whether to allow half-star ratings */
  allowHalf = input<boolean>(false);

  /** Label text */
  label = input<string>();

  /** Whether to show the numeric value */
  showValue = input<boolean>(false);

  /** Emits the selected rating */
  ratingChange = output<number>();

  /** Per-instance id naming the radiogroup by the visible label. */
  protected readonly labelId = `lc-rating-${++RatingComponent.nextId}-label`;

  protected value = signal(0);
  protected hoveredValue = signal(0);

  /** Disabled through the form control (`setDisabledState`), as opposed to the input. */
  private readonly formDisabled = signal(false);

  /** Disabled by either route — the one flag the template consults. */
  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  /** Whether clicks and keys change the value. Read-only stays focusable, it just does not react. */
  protected readonly interactive = computed(() => !this.readonly() && !this.isDisabled());

  private readonly starButtons = viewChildren<ElementRef<HTMLButtonElement>>('starBtn');

  protected stars = computed(() => {
    return Array.from({ length: this.max() }, (_, i) => i + 1);
  });

  /** Smallest change the value can make. */
  private readonly stepSize = computed(() => (this.allowHalf() ? 0.5 : 1));

  /**
   * The star that carries the group's single tab stop (roving tabindex): the
   * one holding the current value, or the first when nothing is selected.
   */
  protected readonly focusableStar = computed(() => Math.max(1, Math.ceil(this.value())));

  protected ratingClasses = computed(() => {
    const classes = ['rating', `rating--${this.size()}`];
    if (this.readonly()) classes.push('rating--readonly');
    if (this.isDisabled()) classes.push('rating--disabled');
    return classes.join(' ');
  });

  protected getStarState(star: number): 'full' | 'half' | 'empty' {
    const active = this.hoveredValue() || this.value();
    if (star <= Math.floor(active)) return 'full';
    if (this.allowHalf() && star - 0.5 <= active) return 'half';
    return 'empty';
  }

  protected isStarFilled(star: number): boolean {
    return this.getStarState(star) === 'full';
  }

  protected isStarHalf(star: number): boolean {
    return this.getStarState(star) === 'half';
  }

  /** `aria-checked` for the radio that represents the current value (2.5 lives on star 3). */
  protected isStarChecked(star: number): boolean {
    const val = this.value();
    return val > 0 && Math.ceil(val) === star;
  }

  /** Radio label — names the half value on the star that holds it. */
  protected starLabel(star: number): string {
    const val = this.value();
    const shown = this.isStarChecked(star) && val !== star ? val : star;
    return `${shown} of ${this.max()} stars`;
  }

  /**
   * The value a pointer at `clientX` over `star` stands for: the left half of
   * a star (right half in RTL) is the half step when halves are allowed.
   * Keyboard-triggered clicks carry no coordinates and mean the whole star.
   */
  private valueAt(star: number, event: MouseEvent): number {
    if (!this.allowHalf() || event.detail === 0) return star;
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    if (!rect.width) return star;
    const fromStart = event.clientX - rect.left;
    const rtl = getComputedStyle(el).direction === 'rtl';
    const inFirstHalf = rtl ? fromStart > rect.width / 2 : fromStart < rect.width / 2;
    return inFirstHalf ? star - 0.5 : star;
  }

  protected onStarClick(star: number, event: MouseEvent): void {
    if (!this.interactive()) return;
    this.select(this.valueAt(star, event));
    this.onTouched();
  }

  protected onStarHover(star: number, event: MouseEvent): void {
    if (!this.interactive()) return;
    this.hoveredValue.set(this.valueAt(star, event));
  }

  protected onMouseLeave(): void {
    this.hoveredValue.set(0);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.interactive()) return;
    const step = this.stepSize();
    const cur = this.value();
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = Math.min(this.max(), cur + step);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = Math.max(step, cur - step);
        break;
      case 'Home':
        next = step;
        break;
      case 'End':
        next = this.max();
        break;
      default:
        return;
    }
    event.preventDefault();
    this.select(next);
    // Roving tabindex: focus follows the checked star.
    this.starButtons()[this.focusableStar() - 1]?.nativeElement.focus();
  }

  /** Marks the control touched once focus leaves the group (not when it moves between stars). */
  protected onFocusOut(event: FocusEvent): void {
    const group = event.currentTarget as HTMLElement;
    if (event.relatedTarget instanceof Node && group.contains(event.relatedTarget)) return;
    this.onTouched();
  }

  private select(val: number): void {
    if (val === this.value()) return;
    this.value.set(val);
    this.ratingChange.emit(val);
    this.onChange(val);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange: (val: number) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched: () => void = () => {};

  writeValue(val: number): void {
    this.value.set(val ?? 0);
  }

  registerOnChange(fn: (val: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}
