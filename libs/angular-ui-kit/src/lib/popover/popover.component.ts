import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  untracked,
  afterRenderEffect,
  ElementRef,
  HostListener,
  Renderer2,
  inject,
  OnDestroy,
} from '@angular/core';
import { OverlayStackService } from '../shared/overlay-stack.service';

export type PopoverPosition = 'top' | 'bottom' | 'left' | 'right';
export type PopoverTrigger = 'click' | 'hover';

/** Natively focusable elements a projected trigger may be or contain. */
const INTERACTIVE_SELECTOR = 'button, a[href], input, select, textarea, [tabindex]';

/**
 * Popover component for displaying rich floating content.
 *
 * Features:
 * - Position options (top, bottom, left, right)
 * - Click or hover trigger modes
 * - Optional arrow indicator
 * - Click-outside and Escape to close (top-most overlay only)
 * - Open state change event
 * - Content projection for trigger and body
 *
 * @example
 * ```html
 * <lc-popover position="bottom" trigger="click">
 *   <button popover-trigger>Open</button>
 *   <div popover-content>Rich content here</div>
 * </lc-popover>
 * ```
 */
@Component({
  selector: 'lc-popover',
  standalone: true,
  templateUrl: './popover.component.html',
  styleUrls: ['./popover.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PopoverComponent implements OnDestroy {
  private static nextId = 0;
  /** Identifies this instance in the overlay stack. */
  private readonly overlayId = `lc-popover-${++PopoverComponent.nextId}`;

  /**
   * Position relative to the trigger element.
   * @default 'bottom'
   */
  position = input<PopoverPosition>('bottom');

  /**
   * How the popover is triggered.
   * @default 'click'
   */
  trigger = input<PopoverTrigger>('click');

  /**
   * Whether to show an arrow pointing at the trigger.
   * @default true
   */
  showArrow = input<boolean>(true);

  /**
   * Emitted when the popover opens or closes.
   */
  readonly openChange = output<boolean>();

  protected isOpen = signal(false);

  /** Id of the panel, referenced by the trigger's `aria-controls`. */
  protected readonly panelId = `${this.overlayId}-panel`;

  protected panelClasses = computed(() => {
    return [
      'popover__panel',
      `popover__panel--${this.position()}`,
      this.showArrow() ? 'popover__panel--arrow' : '',
    ]
      .filter(Boolean)
      .join(' ');
  });

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly overlayStack = inject(OverlayStackService);

  constructor() {
    effect(() => {
      const open = this.isOpen();
      untracked(() => {
        if (open) {
          this.overlayStack.push(this.overlayId);
        } else {
          this.overlayStack.remove(this.overlayId);
        }
      });
    });

    // Mirror the open state onto the projected trigger so assistive tech knows
    // it controls a popup (the trigger is caller-supplied, so we set the
    // attributes rather than bind them).
    afterRenderEffect(() => {
      const open = this.isOpen();
      const trigger = this.triggerElement();
      if (!trigger) return;
      this.renderer.setAttribute(trigger, 'aria-haspopup', 'dialog');
      this.renderer.setAttribute(trigger, 'aria-expanded', String(open));
      if (open) {
        this.renderer.setAttribute(trigger, 'aria-controls', this.panelId);
      } else {
        this.renderer.removeAttribute(trigger, 'aria-controls');
      }
    });
  }

  /**
   * Click outside closes the popover — only while it is the top-most overlay,
   * so a click inside a layer above it (a modal opened from the popover) is
   * left alone.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen() || this.trigger() !== 'click') return;
    const el = this.elementRef.nativeElement;
    if (el.contains(event.target as Node)) return;
    if (!this.overlayStack.claim(this.overlayId, event)) return;
    this.close();
  }

  /**
   * Escape closes the popover only while it is the top-most overlay; the event
   * is consumed so overlays underneath stay open.
   */
  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (!this.isOpen()) return;
    if (!this.overlayStack.claim(this.overlayId, event)) return;
    event.stopPropagation();
    this.close();
  }

  ngOnDestroy(): void {
    this.overlayStack.remove(this.overlayId);
  }

  protected toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  protected open(): void {
    this.isOpen.set(true);
    this.openChange.emit(true);
  }

  protected close(): void {
    this.restoreFocus();
    this.isOpen.set(false);
    this.openChange.emit(false);
  }

  protected onMouseEnter(): void {
    if (this.trigger() === 'hover') {
      this.open();
    }
  }

  protected onMouseLeave(): void {
    if (this.trigger() === 'hover') {
      this.close();
    }
  }

  /**
   * The element that carries the popup ARIA attributes and receives focus back:
   * the projected `[popover-trigger]` node itself when it is natively
   * interactive, otherwise the first interactive element inside it (e.g. the
   * `<button>` inside an `<lc-button popover-trigger>`).
   */
  private triggerElement(): HTMLElement | null {
    const slot = this.elementRef.nativeElement.querySelector<HTMLElement>('[popover-trigger]');
    if (!slot) return null;
    return slot.matches(INTERACTIVE_SELECTOR)
      ? slot
      : (slot.querySelector<HTMLElement>(INTERACTIVE_SELECTOR) ?? slot);
  }

  /**
   * Closing removes the panel from the DOM; if focus is inside it (Escape after
   * tabbing in) it would silently drop to `<body>`, so send it back to the trigger.
   */
  private restoreFocus(): void {
    if (typeof document === 'undefined') return;
    const panel = this.elementRef.nativeElement.querySelector<HTMLElement>('.popover__panel');
    if (panel?.contains(document.activeElement)) {
      this.triggerElement()?.focus();
    }
  }
}
