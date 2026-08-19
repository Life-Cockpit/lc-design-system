import { Component, ChangeDetectionStrategy, input, computed, linkedSignal } from '@angular/core';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'offline' | 'away' | 'busy';

/**
 * Avatar component for circular user representation.
 *
 * Features:
 * - Image display with fallback to initials
 * - Auto-generated initials from user name
 * - Status indicator (online, offline, busy, away)
 * - Multiple size variants (xs, sm, md, lg, xl)
 * - Accessible with alt text support
 *
 * @example
 * ```html
 * <lc-avatar src="https://example.com/avatar.jpg" alt="John Doe" />
 * <lc-avatar name="John Doe" status="online" size="lg" />
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
