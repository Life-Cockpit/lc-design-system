import {
  Component,
  input,
  output,
  signal,
  effect,
  untracked,
  afterNextRender,
  afterRenderEffect,
  viewChildren,
  ChangeDetectionStrategy,
  HostListener,
  ElementRef,
  Injector,
  Renderer2,
  OnDestroy,
  inject,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { OverlayStackService } from '../shared/overlay-stack.service';

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  iconSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  href?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
  variant?: 'default' | 'danger';
  dividerAfter?: boolean;
  disabled?: boolean;
  metadata?: {
    subtitle?: string;
    badge?: string;
  };
}

/** Natively focusable elements a projected trigger may be or contain. */
const INTERACTIVE_SELECTOR = 'button, a[href], input, select, textarea, [tabindex]';

/**
 * Menu Component - Dropdown menu for navigation and actions
 *
 * Features:
 * - Customizable menu items with icons
 * - Support for links and buttons
 * - Dividers between menu sections
 * - Optional subtitle/metadata for items
 * - Danger variant for destructive actions
 * - Click outside to close (top-most overlay only)
 * - Keyboard navigation: focus moves into the menu on open, Arrow keys /
 *   Home / End move between items (roving tabindex), Enter / Space activate,
 *   Escape closes and returns focus to the trigger, Tab closes
 * - ARIA menu semantics (`aria-haspopup` / `aria-expanded` / `aria-controls`
 *   on the projected trigger, `role="menu"` / `role="menuitem"` on the panel)
 * - OnPush change detection for performance
 *
 * @example
 * ```html
 * <lc-menu
 *   [items]="menuItems"
 *   [isOpen]="isMenuOpen"
 *   (itemClick)="handleMenuClick($event)"
 *   (closed)="isMenuOpen = false"
 * >
 *   <button trigger>Open Menu</button>
 *   <div header>User Profile</div>
 * </lc-menu>
 * ```
 */
@Component({
  selector: 'lc-menu',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComponent implements OnDestroy {
  private static nextId = 0;
  /** Identifies this instance in the overlay stack. */
  private readonly menuId = `lc-menu-${++MenuComponent.nextId}`;

  readonly items = input<MenuItem[]>([]);
  readonly isOpen = input(false);
  readonly position = input<'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'>('bottom-right');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly minWidth = input('220px');

  readonly itemClick = output<MenuItem>();
  readonly closed = output<void>();

  /** Id of the `role="menu"` element, referenced by the trigger's `aria-controls`. */
  protected readonly panelId = `${this.menuId}-panel`;

  /** Index (into `items()`) of the item that currently owns the roving tabindex. */
  protected readonly activeIndex = signal(-1);

  private readonly itemElements = viewChildren<ElementRef<HTMLElement>>('menuItem');
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly injector = inject(Injector);
  private readonly overlayStack = inject(OverlayStackService);

  constructor() {
    // Whether the menu has been through its first open-state evaluation; a menu
    // that is already open when it renders (demo pages) must not steal focus.
    let initialized = false;
    effect(() => {
      const open = this.isOpen();
      untracked(() => {
        if (open) {
          this.overlayStack.push(this.menuId);
          this.activeIndex.set(this.firstEnabledIndex());
          // Move focus into the menu once the panel has rendered
          if (initialized) {
            afterNextRender(() => this.focusActiveItem(), { injector: this.injector });
          }
        } else {
          this.overlayStack.remove(this.menuId);
          this.restoreFocus();
          this.activeIndex.set(-1);
        }
        initialized = true;
      });
    });

    // Mirror the open state onto the projected trigger so assistive tech knows
    // it opens a menu (the trigger is caller-supplied, so we set the
    // attributes rather than bind them).
    afterRenderEffect(() => {
      const open = this.isOpen();
      const trigger = this.triggerElement();
      if (!trigger) return;
      this.renderer.setAttribute(trigger, 'aria-haspopup', 'menu');
      this.renderer.setAttribute(trigger, 'aria-expanded', String(open));
      if (open) {
        this.renderer.setAttribute(trigger, 'aria-controls', this.panelId);
      } else {
        this.renderer.removeAttribute(trigger, 'aria-controls');
      }
    });
  }

  ngOnDestroy(): void {
    this.overlayStack.remove(this.menuId);
  }

  /**
   * Handle menu item click
   */
  onItemClick(item: MenuItem, event: Event): void {
    if (item.disabled) {
      event.preventDefault();
      return;
    }

    // Links navigate natively; button items only emit
    if (!item.href) {
      event.preventDefault();
    }

    this.itemClick.emit(item);
  }

  /**
   * Close the menu
   */
  close(): void {
    this.closed.emit();
  }

  /**
   * Handle click outside to close menu — only while the menu is the top-most
   * overlay, so a click inside a layer above it (a modal opened from a menu
   * item) is left alone.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) {
      return;
    }

    const target = event.target;
    if (target instanceof Node && this.elementRef.nativeElement.contains(target)) {
      return;
    }
    if (!this.overlayStack.claim(this.menuId, event)) return;
    this.close();
  }

  /**
   * Escape closes the menu (top-most overlay only) and returns focus to the
   * trigger; the event is consumed so overlays underneath stay open.
   */
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
    if (!this.isOpen()) return;
    if (!this.overlayStack.claim(this.menuId, event)) return;
    event.stopPropagation();
    this.triggerElement()?.focus();
    this.close();
  }

  /** Keyboard navigation inside the `role="menu"` panel. */
  protected onPanelKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusIndex(this.nextEnabledIndex(this.activeIndex(), 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusIndex(this.nextEnabledIndex(this.activeIndex(), -1));
        break;
      case 'Home':
        event.preventDefault();
        this.focusIndex(this.firstEnabledIndex());
        break;
      case 'End':
        event.preventDefault();
        this.focusIndex(this.nextEnabledIndex(0, -1));
        break;
      case ' ': {
        // Buttons activate on Space natively, links only on Enter
        const target = event.target as HTMLElement | null;
        if (target?.matches('a[role="menuitem"]')) {
          event.preventDefault();
          target.click();
        }
        break;
      }
      case 'Tab':
        // Focus leaves the menu — let it move on naturally, but close the menu
        this.close();
        break;
    }
  }

  /** Roving tabindex: only the active item is in the tab sequence. */
  protected tabindexFor(index: number, item: MenuItem): number {
    return !item.disabled && index === this.activeIndex() ? 0 : -1;
  }

  private focusIndex(index: number): void {
    if (index < 0) return;
    this.activeIndex.set(index);
    this.focusActiveItem();
  }

  private focusActiveItem(): void {
    this.itemElements()[this.activeIndex()]?.nativeElement.focus();
  }

  private firstEnabledIndex(): number {
    return this.items().findIndex((item) => !item.disabled);
  }

  /** Index of the next enabled item in `direction`, wrapping around; -1 if none. */
  private nextEnabledIndex(from: number, direction: 1 | -1): number {
    const items = this.items();
    for (let step = 1; step <= items.length; step++) {
      const index = (from + direction * step + items.length) % items.length;
      if (!items[index]?.disabled) return index;
    }
    return -1;
  }

  /**
   * The element that carries the menu-button ARIA attributes and receives
   * focus back: the projected `[trigger]` node itself when it is natively
   * interactive, otherwise the first interactive element inside it (e.g. the
   * `<button>` inside an `<lc-button trigger>`).
   */
  private triggerElement(): HTMLElement | null {
    const slot = this.elementRef.nativeElement.querySelector<HTMLElement>('.lc-menu__trigger [trigger]');
    if (!slot) return null;
    return slot.matches(INTERACTIVE_SELECTOR)
      ? slot
      : (slot.querySelector<HTMLElement>(INTERACTIVE_SELECTOR) ?? slot);
  }

  /**
   * Closing removes the panel from the DOM; if focus is inside it (an item was
   * activated by keyboard) it would silently drop to `<body>`, so send it back
   * to the trigger.
   */
  private restoreFocus(): void {
    if (typeof document === 'undefined') return;
    const panel = this.elementRef.nativeElement.querySelector<HTMLElement>('.lc-menu__dropdown');
    if (panel?.contains(document.activeElement)) {
      this.triggerElement()?.focus();
    }
  }
}
