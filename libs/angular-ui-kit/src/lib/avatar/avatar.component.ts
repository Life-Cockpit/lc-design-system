import { Component, ChangeDetectionStrategy, input, computed, linkedSignal } from '@angular/core';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'offline' | 'away' | 'busy';

/**
 * Background of the initials. `default` is the neutral kit avatar; `member-1`
 * … `member-6` are the member colours (`--color-member-1` … `-6`: teal, rust,
 * violet, sage, berry, slate) with white initials, each at least 4.5:1.
 * Assign them per person in a stable order (e.g. join order) and always show
 * the name or initials beside the colour — colour is never the only cue.
 */
export type AvatarColor =
  | 'default'
  | 'member-1'
  | 'member-2'
  | 'member-3'
  | 'member-4'
  | 'member-5'
  | 'member-6';

/** The six member colours in their order (`AvatarColor` without `default`). */
export const AVATAR_MEMBER_COLORS: readonly AvatarColor[] = [
  'member-1',
  'member-2',
  'member-3',
  'member-4',
  'member-5',
  'member-6',
];

/**
 * Avatar component for circular user representation.
 *
 * Features:
 * - Image display with fallback to initials
 * - Auto-generated initials from user name
 * - Status indicator (online, offline, busy, away)
 * - Multiple size variants (xs, sm, md, lg, xl)
 * - Member colours (`color`: `member-1` … `member-6`) with white initials
 * - `ring`: a gap in the page colour around the avatar, for stacks and for
 *   avatars on images or tints
 * - Accessible with alt text support
 *
 * @example
 * ```html
 * <lc-avatar src="https://example.com/avatar.jpg" alt="John Doe" />
 * <lc-avatar name="John Doe" status="online" size="lg" />
 * <lc-avatar name="Tom Ek" color="member-2" [ring]="true" />
 * ```
 */
@Component({
  selector: 'lc-avatar',
  standalone: true,
  imports: [],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  /** Image source URL */
  src = input<string>();

  /** Alt text for the image */
  alt = input<string>();

  /** Full name for generating initials */
  name = input<string>();

  /** Size of the avatar */
  size = input<AvatarSize>('md');

  /** Status indicator */
  status = input<AvatarStatus>();

  /**
   * Background of the initials: `default` (neutral) or a member colour
   * `member-1` … `member-6` with white initials (LK-7).
   */
  color = input<AvatarColor>('default');

  /**
   * Draw a ring in the page colour around the avatar (3 px; 2 px for `xs` and
   * `sm`), so stacked or overlapping avatars stay apart. The ring colour is
   * `--lc-avatar-ring-color` (default `--color-background`); set it to the
   * surface the avatar sits on.
   */
  ring = input<boolean>(false);

  /**
   * Hide the avatar from assistive technology (no `img` role, no label), for
   * avatars inside a control that has its own accessible name — e.g. a menu
   * button labelled "Menu for Tom Ek".
   */
  decorative = input<boolean>(false);

  /**
   * Computed initials from name
   */
  initials = computed(() => {
    const fullName = this.name();
    if (!fullName || fullName.trim() === '') {
      return '?';
    }

    const parts = fullName
      .trim()
      .split(/\s+/)
      .filter((p) => p.length > 0);

    if (parts.length === 0) {
      return '?';
    }

    if (parts.length === 1) {
      return parts[0]?.[0]?.toUpperCase() ?? '?';
    }

    // First and last name initials
    const firstInitial = parts[0]?.[0];
    const lastInitial = parts[parts.length - 1]?.[0];

    if (firstInitial && lastInitial) {
      return (firstInitial + lastInitial).toUpperCase();
    }
    return '?';
  });

  /**
   * Computed CSS classes for the avatar
   */
  avatarClasses = computed(() => {
    const classes = ['lc-avatar'];

    classes.push(`lc-avatar--${this.size()}`);

    if (this.status()) {
      classes.push('lc-avatar--with-status');
    }

    if (this.color() !== 'default') {
      classes.push('lc-avatar--member', `lc-avatar--${this.color()}`);
    }

    if (this.ring()) {
      classes.push('lc-avatar--ring');
    }

    return classes.join(' ');
  });

  /**
   * Get aria-label for accessibility
   */
  ariaLabel = computed(() => {
    return this.alt() || this.name() || 'Avatar';
  });

  /**
   * Check if image should be displayed
   */
  showImage = computed(() => {
    return this.src() && !this.imageError();
  });

  /**
   * Track if image failed to load. Resets whenever `src` changes so a new
   * image gets a fresh attempt instead of staying stuck on the initials.
   */
  protected imageError = linkedSignal<string | undefined, boolean>({
    source: this.src,
    computation: () => false,
  });

  /**
   * Handle image load error
   */
  onImageError(): void {
    this.imageError.set(true);
  }
}
