import {
  ChangeDetectionStrategy,
  Component,
  input,
  computed,
} from '@angular/core';
import { AvatarColor, AvatarComponent, AvatarSize } from '@lifecorner/angular-ui-kit/avatar';

export interface AvatarGroupItem {
  /** Image source URL */
  src?: string;
  /** Alt text */
  alt?: string;
  /** Full name for initials fallback */
  name?: string;
  /** Background of the initials: `default` or a member colour `member-1` … `member-6` (see `lc-avatar`). */
  color?: AvatarColor;
}

@Component({
  selector: 'lc-avatar-group',
  standalone: true,
  imports: [AvatarComponent],
  templateUrl: './avatar-group.component.html',
  styleUrls: ['./avatar-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Avatar group component for displaying multiple user avatars.
 *
 * Features:
 * - Overlapping avatar display with configurable max visible count
 * - Overflow indicator showing remaining count
 * - Shared size variant across all avatars (xs, sm, md, lg)
 * - Automatic truncation based on max property
 * - Member colours per item (`color`), later avatars on top
 * - `ring`: each avatar gets a ring in the page colour instead of the surface
 *   border; with `overlap="4px"` this is the "Weite" member row
 *
 * @example
 * ```html
 * <lc-avatar-group [avatars]="users" [max]="5" size="md" />
 * <lc-avatar-group
 *   [avatars]="[{ name: 'Johanna Apfelbaum', color: 'member-1' }, { name: 'Tom Ek', color: 'member-2' }]"
 *   [ring]="true"
 *   overlap="4px"
 * />
 * ```
 */
export class AvatarGroupComponent {
  /** List of avatars to show */
  avatars = input.required<AvatarGroupItem[]>();

  /** Avatar size */
  size = input<AvatarSize>('md');

  /** Maximum visible avatars before showing overflow count */
  max = input<number>(5);

  /**
   * Separate the avatars with a ring in the page colour
   * (`--lc-avatar-ring-color`, default `--color-background`) instead of the
   * 2 px surface border. Later avatars sit on top.
   */
  ring = input<boolean>(false);

  /**
   * How far each avatar overlaps the previous one, as a CSS length (e.g.
   * `4px`). Empty keeps the size's default (6–12 px).
   */
  overlap = input<string>('');

  protected visibleAvatars = computed(() => {
    const all = this.avatars();
    const limit = this.max();
    return all.slice(0, limit);
  });

  protected overflowCount = computed(() => {
    const all = this.avatars();
    const limit = this.max();
    return Math.max(0, all.length - limit);
  });

  protected groupClasses = computed(() => {
    const classes = ['avatar-group', `avatar-group--${this.size()}`];
    if (this.ring()) classes.push('avatar-group--ring');
    return classes.join(' ');
  });
}
