import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export type ChipVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type ChipSize = 'sm' | 'md' | 'lg';

/**
 * Chip component for displaying tags, filters, or selections.
 *
 * Features:
 * - Color variants (primary, secondary, success, warning, error, info, neutral)
 * - Multiple size options (sm, md, lg)
 * - Optional leading icon
 * - Removable with close button and remove event
 * - Clickable variant that renders as a button and emits `chipClick`
 * - Disabled state support
 *
 * @example
 * ```html
 * <lc-chip variant="primary" [removable]="true" (remove)="onRemove()">
 *   Tag Name
 * </lc-chip>
 *
 * <lc-chip [clickable]="true" (chipClick)="onNavigate()">
 *   Linked item
 * </lc-chip>
 * ```
 */
@Component({
  selector: 'lc-chip',
  standalone: true,
  imports: [IconComponent, NgTemplateOutlet],
  templateUrl: './chip.component.html',
  styleUrl: './chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipComponent {
  /** Visual variant of the chip */
  variant = input<ChipVariant>('default');

  /** Size of the chip */
  size = input<ChipSize>('md');

  /** Icon name from Tabler Icons */
  icon = input<string>();

  /** Whether the chip can be removed */
  removable = input<boolean>(false);

  /**
   * Whether the chip acts as a button (e.g. for navigation). Renders the chip
   * as a `<button type="button">` with hover / active / focus-visible states.
   */
  clickable = input<boolean>(false);

  /** Whether the chip is disabled */
  disabled = input<boolean>(false);

  /** Emitted when the chip is removed */
  readonly remove = output<void>();

  /** Emitted when a clickable chip is activated (click, Enter or Space). */
  readonly chipClick = output<void>();

  /**
   * Computed CSS classes for the chip
   */
  chipClasses = computed(() => {
    const classes = ['lc-chip'];

    classes.push(`lc-chip--${this.variant()}`);
    classes.push(`lc-chip--${this.size()}`);

    if (this.removable()) {
      classes.push('lc-chip--removable');
    }

    if (this.clickable()) {
      classes.push('lc-chip--clickable');
    }

    if (this.disabled()) {
      classes.push('lc-chip--disabled');
    }

    return classes.join(' ');
  });

  /**
   * Handle activation of a clickable chip
   */
  onChipClick(): void {
    if (!this.disabled()) {
      this.chipClick.emit();
    }
  }

  /**
   * Handle remove button click
   */
  onRemove(event: Event): void {
    event.stopPropagation();

    if (!this.disabled()) {
      this.remove.emit();
    }
  }

  /**
   * Keyboard activation of the delete affordance inside a clickable chip
   * (a span with role="button", since nesting native buttons is invalid).
   */
  onDeleteKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.onRemove(event);
    }
  }

  /**
   * Handle keyboard navigation
   */
  onKeydown(event: KeyboardEvent): void {
    if (!this.removable() || this.disabled()) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.remove.emit();
    }
  }
}
