import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '@lifecorner/angular-ui-kit/icon';

/**
 * Field group component for displaying label-value pairs.
 *
 * Features:
 * - Consistent label-value layout for read-only data
 * - Optional leading icon from Tabler Icons
 * - Compact mode for dense layouts
 * - Content projection for custom value rendering
 * - Configurable icon size (xs, sm, md)
 *
 * @example
 * ```html
 * <lc-field-group label="Email" value="user@example.com" />
 * <lc-field-group label="Language" value="English" icon="globe-alt" />
 * ```
 */
@Component({
  selector: 'lc-field-group',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './field-group.component.html',
  styleUrls: ['./field-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'lc-field-group',
    '[class.lc-field-group--with-icon]': 'icon()',
    '[class.lc-field-group--compact]': 'compact()',
  },
})
export class FieldGroupComponent {
  /**
   * Label text displayed above the value
   */
  label = input.required<string>();

  /**
   * Value text to display (optional if using content projection)
   */
  value = input<string>();

  /**
   * Optional icon name from Tabler Icons
   */
  icon = input<string>();

  /**
   * Icon size
   * @default 'sm'
   */
  iconSize = input<'xs' | 'sm' | 'md'>('sm');

  /**
   * Use compact styling with less padding
   * @default false
   */
  compact = input<boolean>(false);
}
