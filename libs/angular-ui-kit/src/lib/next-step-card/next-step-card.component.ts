import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  isDevMode,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ButtonComponent } from '@lifecorner/angular-ui-kit/button';
import { IconComponent } from '@lifecorner/angular-ui-kit/icon';

export type NextStepCardTone = 'neutral' | 'primary' | 'success' | 'warning' | 'info';

/**
 * Appearance of the card.
 * - `default`: white surface, hairline border, 4 px tonal rail, 36 px tinted bubble
 * - `soft`: tinted fill per tone, radius 24 px (28 px from 1024 px), no rail,
 *   border or shadow, a larger white bubble with a 1 px ring (the "Weite" look)
 */
export type NextStepCardVariant = 'default' | 'soft';

/**
 * How several actions are laid out.
 * - `inline`: side by side at the end of the card; below 480 px card width in
 *   their own row, stretched
 * - `stacked`: always in their own row, one per line at equal width, 8 px apart
 */
export type NextStepCardActionsLayout = 'inline' | 'stacked';

/** Element that renders the title (semantics only, the look stays the same). */
export type NextStepCardTitleTag = 'div' | 'h2' | 'h3';

/** Size of the built-in action buttons (`sm` 32 px, `md` 42 px, `lg` 48.5 px). */
export type NextStepCardActionSize = 'sm' | 'md' | 'lg';

/**
 * Next-step card — the single status-and-action surface of a page: "where does
 * this stand, and what is the one next step?".
 *
 * Features:
 * - Tonal accent rail (4px left) + tinted icon bubble, token colors only
 * - Title, message (string input or default slot for markup)
 * - Primary action (with loading / disabled + mandatory disabled reason),
 *   ghost secondary action, or an external link instead of the primary button
 * - `[slot='blockers']`: rows inside the card under a subtle divider (dot
 *   prefix); each projected element with `slot="blockers"` becomes one row —
 *   blockers are rows IN the card, never additional banners
 * - `[slot='meta']`: one footer line (icon + text)
 * - `[slot='actions']`: fully replaces the built-in action buttons
 * - `[slot='body']`: content below the message without the message's text
 *   styles, so form fields, lists or a description list keep their own look
 * - `role="region"` labelled by the title; optional polite live announcement
 *   of title changes via `announce`
 * - Narrow layout: below 480 px of card width (a CSS container query on the
 *   host) the icon sits beside the title, message, body, blockers and meta
 *   take the full inner width, the inline padding drops to `padding-md`, and
 *   the actions take their own row with every action stretched. A projected
 *   `fullWidth` button gets its own row at every width.
 * - `variant="soft"`: the tinted card of the "Weite" look; `actionsLayout`
 *   `stacked` for several equal-width actions; `titleTag` for a heading
 *
 * The host is a size container (`container-type: inline-size`) and takes the
 * full inline size of its parent.
 *
 * Usage rule: exactly ONE next-step card per page.
 *
 * @example
 * ```html
 * <lc-next-step-card
 *   tone="warning"
 *   icon="clock"
 *   cardTitle="Wartet auf Freigabe"
 *   message="Der Entwurf ist vollständig und kann geprüft werden."
 *   primaryLabel="Freigeben"
 *   secondaryLabel="Änderungen anfordern"
 *   (primaryClick)="approve()"
 * />
 * ```
 */
@Component({
  selector: 'lc-next-step-card',
  standalone: true,
  imports: [ButtonComponent, IconComponent],
  templateUrl: './next-step-card.component.html',
  styleUrls: ['./next-step-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NextStepCardComponent implements AfterViewChecked {
  /**
   * Tone of the accent rail and icon bubble. Colors come exclusively from the
   * semantic tokens (`--color-*` rail, `--color-*-subtle` bubble tint,
   * `--color-on-*-subtle` icon ink).
   * @default 'neutral'
   */
  tone = input<NextStepCardTone>('neutral');

  /**
   * Appearance: `default` (surface, border, 4 px rail) or `soft` (tinted fill
   * per tone, radius 24 px / 28 px from 1024 px, no rail, border or shadow,
   * a 48 px white bubble with a 1 px ring; 56 px from 1024 px, 60 px from
   * 1440 px). Soft fills come from `--color-next-step-soft-neutral` /
   * `--color-next-step-soft-primary` and the tone's `-subtle` token; the bubble
   * from `--color-bubble`, `--color-bubble-ring`, `--color-bubble-icon`.
   * @default 'default'
   */
  variant = input<NextStepCardVariant>('default');

  /** Icon name for the round bubble (36 px; 48–60 px in the soft variant). */
  icon = input<string>('information-circle');

  /** Title (1rem semibold; 20–28 px bold in the soft variant). Also the card's accessible name. */
  cardTitle = input.required<string>();

  /**
   * Element that renders the title: `div` (default), `h2` or `h3`. Use a
   * heading when the page has sections, so heading navigation reaches the
   * most important item. Semantics only, the look stays the same.
   * @default 'div'
   */
  titleTag = input<NextStepCardTitleTag>('div');

  /**
   * Layout of several actions. `inline`: side by side at the end of the card
   * (below 480 px card width in their own row, stretched). `stacked`: always
   * in their own row, one per line at equal width, 8 px apart (e.g. a list of
   * sign-in methods).
   * @default 'inline'
   */
  actionsLayout = input<NextStepCardActionsLayout>('inline');

  /**
   * Size of the built-in action buttons and link: `sm` (32 px, the 3.2
   * default), `md` (42 px) or `lg` (48.5 px, meets the 44 px touch target).
   * @default 'sm'
   */
  actionSize = input<NextStepCardActionSize>('sm');

  /** Message below the title. For markup, use the default slot instead. */
  message = input<string>();

  /** Label of the primary action. Omit to render no primary button. */
  primaryLabel = input<string>();

  /** Optional leading icon of the primary action. */
  primaryIcon = input<string>();

  /** Shows a spinner on the primary action. */
  primaryLoading = input<boolean>(false);

  /**
   * Disables the primary action. A disabled primary REQUIRES
   * `primaryDisabledReason`; disabled without a reason logs a dev warning.
   */
  primaryDisabled = input<boolean>(false);

  /** Why the primary action is disabled — shown as tooltip on the button. */
  primaryDisabledReason = input<string>('');

  /** Label of the ghost secondary action (rendered with a chevron). */
  secondaryLabel = input<string>();

  /**
   * Label of an external link rendered instead of the primary button
   * (opens in a new tab). Requires `linkHref`.
   */
  linkLabel = input<string>();

  /** Target URL of the external link. */
  linkHref = input<string>();

  /**
   * Where the link opens: `_blank` (a new tab, with `rel="noopener noreferrer"`,
   * the 3.2 behaviour) or `_self` (the same tab, no `rel`).
   * @default '_blank'
   */
  linkTarget = input<'_blank' | '_self'>('_blank');

  /**
   * Announce title changes to screen readers via `aria-live="polite"` —
   * for cards whose state advances in place.
   * @default false
   */
  announce = input<boolean>(false);

  /** Emits when the primary action is clicked. */
  primaryClick = output<void>();

  /** Emits when the secondary action is clicked. */
  secondaryClick = output<void>();

  private actionsSlot = viewChild<ElementRef<HTMLElement>>('actionsSlot');

  /**
   * Whether content was projected into `[slot='actions']` — projected actions
   * fully replace the built-in buttons.
   */
  protected hasProjectedActions = signal(false);

  protected cardClasses = computed(() =>
    [
      'lc-next-step-card',
      `lc-next-step-card--${this.tone()}`,
      this.variant() === 'soft' ? 'lc-next-step-card--soft' : null,
      this.actionsLayout() === 'stacked' ? 'lc-next-step-card--actions-stacked' : null,
    ]
      .filter(Boolean)
      .join(' '),
  );

  /** `rel` of the external link: only a new tab needs `noopener noreferrer`. */
  protected linkRel = computed(() => (this.linkTarget() === '_blank' ? 'noopener noreferrer' : null));

  protected showLink = computed(() => !!(this.linkLabel() && this.linkHref()));

  /**
   * Whether the card renders any action: hides the empty actions box, so the
   * narrow layout gets no empty row.
   */
  protected hasActions = computed(
    () =>
      this.hasProjectedActions() ||
      !!this.secondaryLabel() ||
      this.showLink() ||
      !!this.primaryLabel(),
  );

  constructor() {
    effect(() => {
      if (isDevMode() && this.primaryDisabled() && !this.primaryDisabledReason()) {
        console.warn(
          '[lc-next-step-card] `primaryDisabled` is set without a `primaryDisabledReason`. ' +
            'A disabled primary action must explain why (shown as tooltip).',
        );
      }
    });
  }

  ngAfterViewChecked(): void {
    // Projected [slot='actions'] content replaces the built-in buttons. The
    // signal write is equality-guarded, so unchanged checks are no-ops.
    const el = this.actionsSlot()?.nativeElement;
    this.hasProjectedActions.set(!!el && el.childElementCount > 0);
  }
}
