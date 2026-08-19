import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  inject,
  input,
} from '@angular/core';

/** Focusable descendants considered by the toolbar's arrow-key navigation. */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Elements where Left/Right already have a meaning (caret movement, option
 * selection) — the toolbar must not hijack arrows originating from them.
 */
const OWNS_ARROW_KEYS_SELECTOR = [
  'input:not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="reset"])',
  'textarea',
  'select',
  '[contenteditable="true"]',
  '[role="tablist"]',
  '[role="listbox"]',
  '[role="menu"]',
  '[role="menubar"]',
  '[role="radiogroup"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="combobox"]',
  '[role="grid"]',
  '[role="tree"]',
].join(',');

/**
 * Toolbar — a horizontal strip of controls with built-in density-aware spacing.
 *
 * Use for action bars above tables, on top of cards, inside drawers, or
 * anywhere a row of buttons / filters / titles needs consistent rhythm.
 *
 * The toolbar exposes three slots:
 *  - `[slot="start"]` — leading content (icon, title, primary filter)
 *  - default          — middle content (grows to fill remaining space)
 *  - `[slot="end"]`   — trailing actions (right-aligned)
 *
 * If only `[slot="start"]` and `[slot="end"]` are provided, the middle
 * automatically becomes a flexible spacer so actions push to the right.
 *
 * Padding, gap and divider styles are driven by `--lc-density-padding-*`
 * and `--lc-density-gap-*` tokens, so wrapping a `data-density` ancestor
 * automatically rescales the toolbar — no template changes needed.
 *
 * Keyboard: the host carries `role="toolbar"`, and Left/Right (plus Home/End)
 * move focus between the toolbar's focusable controls, as the role promises.
 * Arrows are left alone inside text fields, selects and nested composite
 * widgets (tablist, listbox, menu, …) that own them. Tab still reaches every
 * control — the projected content is arbitrary, so the toolbar deliberately
 * does not rewrite child `tabindex`es (roving tabindex).
 *
 * Naming note: `density` here is the toolbar's *local* rhythm override
 * (compact / cosy / comfortable — the same vocabulary as the page-level
 * `data-density` attribute), whereas `lc-page-header` calls its scale `size`.
 * Left as-is for API stability.
 *
 * @example
 * ```html
 * <lc-toolbar>
 *   <h2 slot="start">Reports</h2>
 *   <lc-button slot="end" variant="secondary">Export</lc-button>
 *   <lc-button slot="end" variant="primary">New report</lc-button>
 * </lc-toolbar>
 * ```
 */
@Component({
  selector: 'lc-toolbar',
  standalone: true,
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'hostClasses()',
    role: 'toolbar',
    '(keydown)': 'onKeydown($event)',
  },
})
export class ToolbarComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /**
   * Visual density of the toolbar itself.
   * - `comfortable` — generous padding/gap (default for dashboards)
   * - `cosy`        — balanced padding/gap (default in chrome)
   * - `compact`     — tight, data-dense (tables, side panels)
   */
  readonly density = input<'compact' | 'cosy' | 'comfortable'>('cosy');

  /**
   * Background variant.
   * - `transparent` — inherits parent background (default)
   * - `surface`     — subtle surface color (use when stacking on page bg)
   * - `muted`       — slightly stronger fill (use as a toolbar on a card)
   */
  readonly background = input<'transparent' | 'surface' | 'muted'>('transparent');

  /**
   * Border placement.
   * - `none`   — no border (default)
   * - `bottom` — divider below the toolbar
   * - `top`    — divider above the toolbar
   * - `around` — full border
   */
  readonly border = input<'none' | 'bottom' | 'top' | 'around'>('none');

  /**
   * Allow toolbar content to wrap onto multiple lines on small viewports.
   * @default true
   */
  readonly wrap = input<boolean>(true);

  /**
   * Vertical alignment of toolbar children.
   * @default 'center'
   */
  readonly align = input<'start' | 'center' | 'end' | 'stretch' | 'baseline'>('center');

  /**
   * Sticky behavior — pins the toolbar to the top of its scroll container.
   * @default false
   */
  readonly sticky = input<boolean>(false);

  protected readonly hostClasses = computed(() =>
    [
      'lc-toolbar',
      `lc-toolbar--density-${this.density()}`,
      `lc-toolbar--bg-${this.background()}`,
      `lc-toolbar--border-${this.border()}`,
      `lc-toolbar--align-${this.align()}`,
      this.wrap() ? 'lc-toolbar--wrap' : null,
      this.sticky() ? 'lc-toolbar--sticky' : null,
    ]
      .filter(Boolean)
      .join(' '),
  );

  /**
   * Arrow-key navigation between the toolbar's focusable controls
   * (WAI-ARIA toolbar pattern): Left/Right move by one, Home/End jump.
   */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    const key = event.key;
    if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'Home' && key !== 'End') {
      return;
    }

    const target = event.target as HTMLElement | null;
    // Let text fields, selects and nested composites keep their own arrows.
    if (!target || target.closest(OWNS_ARROW_KEYS_SELECTOR)) {
      return;
    }

    const focusables = this.focusableControls();
    const currentIndex = focusables.findIndex((el) => el === target || el.contains(target));
    if (currentIndex === -1) {
      return;
    }

    let nextIndex: number;
    switch (key) {
      case 'ArrowRight':
        nextIndex = currentIndex + 1;
        break;
      case 'ArrowLeft':
        nextIndex = currentIndex - 1;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      default:
        nextIndex = focusables.length - 1;
    }

    // Walk on past controls the browser refuses to focus (e.g. hidden ones).
    const step = key === 'ArrowLeft' || key === 'End' ? -1 : 1;
    while (nextIndex >= 0 && nextIndex < focusables.length && nextIndex !== currentIndex) {
      const candidate = focusables[nextIndex];
      candidate?.focus();
      if (document.activeElement === candidate) {
        event.preventDefault();
        return;
      }
      nextIndex += step;
    }
  }

  private focusableControls(): HTMLElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => !el.closest('[hidden], [aria-hidden="true"]') && el.getAttribute('aria-disabled') !== 'true',
    );
  }
}
