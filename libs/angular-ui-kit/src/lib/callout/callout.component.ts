import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
  computed,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export type CalloutVariant = 'info' | 'success' | 'warning' | 'error' | 'neutral';

@Component({
  selector: 'lc-callout',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './callout.component.html',
  styleUrls: ['./callout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Callout component for contextual information banners.
 *
 * Features:
 * - Semantic variants (info, success, warning, error, neutral)
 * - Auto-mapped variant icons
 * - Optional title text
 * - Dismissible with close button; `visible` is two-way bindable so a
 *   dismissed callout can be shown again
 * - `role="alert"` for error / warning, `role="status"` otherwise
 * - Content projection for custom body content
 *
 * @example
 * ```html
 * <lc-callout variant="warning" title="Attention">Please review your input.</lc-callout>
 * ```
 */
export class CalloutComponent {
  /** Visual variant */
  variant = input<CalloutVariant>('info');

  /** Title text (optional) */
  title = input<string>();

  /** Whether the callout can be dismissed */
  dismissible = input<boolean>(false);

  /** Emits when dismiss button is clicked */
  dismissed = output<void>();

  /**
   * Visibility (two-way bindable). Dismissing sets it to `false`; the parent
   * can set it back to `true` to show the callout again.
   */
  visible = model<boolean>(true);

  protected calloutClasses = computed(() => {
    return ['callout', `callout--${this.variant()}`].join(' ');
  });

  /**
   * Live-region semantics: only error / warning callouts interrupt the user
   * (`alert`); informational ones are announced politely (`status`).
   */
  protected role = computed(() =>
    this.variant() === 'error' || this.variant() === 'warning' ? 'alert' : 'status',
  );

  /** Accessible name of the variant icon (it conveys the callout's tone). */
  protected iconLabel = computed(() => {
    const map: Record<CalloutVariant, string> = {
      info: 'Info',
      success: 'Success',
      warning: 'Warning',
      error: 'Error',
      neutral: 'Note',
    };
    return map[this.variant()];
  });

  protected iconName = computed(() => {
    const map: Record<CalloutVariant, string> = {
      info: 'information-circle',
      success: 'check-circle',
      warning: 'exclamation-triangle',
      error: 'x-circle',
      neutral: 'information-circle',
    };
    return map[this.variant()];
  });

  dismiss(): void {
    this.visible.set(false);
    this.dismissed.emit();
  }
}
