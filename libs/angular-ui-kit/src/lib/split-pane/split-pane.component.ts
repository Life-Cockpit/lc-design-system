import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

/**
 * Resizable two-pane layout container.
 *
 * Projects two panes (`slot="start"`, `slot="end"`) side by side with a
 * draggable separator in between. The start pane has a fixed, user-adjustable
 * width; the end pane fills the remaining space.
 *
 * Features:
 * - Drag the separator with mouse / touch (pointer capture), bounded by
 *   `minSize` / `maxSize` (px or percentage of the container)
 * - Double-click the separator to restore `initialSize`
 * - Keyboard resizing: focusable separator, ←/→ adjust by `step`,
 *   Home/End jump to min/max (`role="separator"`, `aria-valuenow`)
 * - Optional persistence: with `storageKey`, the width survives a reload
 * - Below the `stackBelow` viewport breakpoint the panes stack vertically
 *   and the resizer is disabled
 *
 * @example
 * ```html
 * <lc-split-pane
 *   [initialSize]="360"
 *   [minSize]="280"
 *   [maxSize]="'55%'"
 *   storageKey="sidebar-width"
 *   (sizeChange)="onWidthChange($event)"
 * >
 *   <div slot="start">…</div>
 *   <div slot="end">…</div>
 * </lc-split-pane>
 * ```
 */
@Component({
  selector: 'lc-split-pane',
  standalone: true,
  templateUrl: './split-pane.component.html',
  styleUrl: './split-pane.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplitPaneComponent implements OnInit {
  /** Initial width of the start pane in px. Restored on separator double-click. */
  readonly initialSize = input<number>(320);

  /** Minimum width of the start pane in px. */
  readonly minSize = input<number>(0);

  /**
   * Maximum width of the start pane: a number (px) or a percentage string
   * such as `'55%'` (relative to the container width). `null` = no limit
   * beyond the container itself.
   */
  readonly maxSize = input<number | string | null>(null);

  /**
   * When set, the current width is persisted to localStorage under this key
   * and restored on the next init.
   */
  readonly storageKey = input<string>();

  /** Step in px for keyboard resizing (←/→ on the focused separator). */
  readonly step = input<number>(16);

  /**
   * Viewport width in px below which the panes stack vertically and the
   * resizer is disabled. `0` disables stacking.
   */
  readonly stackBelow = input<number>(0);

  /** Accessible label for the separator. */
  readonly separatorLabel = input('Resize panel');

  /** Emitted whenever the start-pane width changes (drag, keyboard, reset). */
  readonly sizeChange = output<number>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /** Requested start-pane width; clamped to min/max for rendering. */
  private readonly size = signal(0);

  /** Container width, tracked so percentage `maxSize` stays responsive. */
  private readonly containerWidth = signal(0);

  /** Whether the panes are stacked (viewport below `stackBelow`). */
  protected readonly stacked = signal(false);

  private dragPointerId: number | null = null;
  private dragStartX = 0;
  private dragStartSize = 0;

  /** Clamped width actually applied to the start pane. */
  protected readonly effectiveSize = computed(() => this.clamp(this.size()));

  /** Resolved max in px for aria-valuemax; null when unbounded. */
  protected readonly ariaMax = computed(() => {
    const max = this.resolveMaxPx();
    return Number.isFinite(max) && max < Number.MAX_SAFE_INTEGER
      ? Math.round(max)
      : null;
  });

  constructor() {
    // Track the stacking breakpoint reactively; re-subscribes when the
    // `stackBelow` input changes.
    effect((onCleanup) => {
      const breakpoint = this.stackBelow();
      if (
        !breakpoint ||
        typeof window === 'undefined' ||
        typeof window.matchMedia !== 'function'
      ) {
        this.stacked.set(false);
        return;
      }
      const query = window.matchMedia(`(max-width: ${breakpoint - 0.02}px)`);
      this.stacked.set(query.matches);
      const onChange = (event: MediaQueryListEvent) =>
        this.stacked.set(event.matches);
      query.addEventListener('change', onChange);
      onCleanup(() => query.removeEventListener('change', onChange));
    });
  }

  ngOnInit(): void {
    this.size.set(this.restoreSize() ?? this.initialSize());
    this.observeContainer();
  }

  /** Restore the initial width (also wired to separator double-click). */
  reset(): void {
    this.applySize(this.initialSize());
    this.persist();
  }

  protected onPointerDown(event: PointerEvent): void {
    const separator = event.currentTarget as HTMLElement;
    try {
      separator.setPointerCapture?.(event.pointerId);
    } catch {
      // Synthetic events carry no active pointer — dragging still works as
      // long as the pointer stays over the separator.
    }
    this.dragPointerId = event.pointerId;
    this.dragStartX = event.clientX;
    this.dragStartSize = this.effectiveSize();
    event.preventDefault();
  }

  protected onPointerMove(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId) return;
    this.applySize(this.dragStartSize + (event.clientX - this.dragStartX));
  }

  protected onPointerUp(event: PointerEvent): void {
    if (this.dragPointerId !== event.pointerId) return;
    this.dragPointerId = null;
    try {
      (event.currentTarget as HTMLElement).releasePointerCapture?.(
        event.pointerId,
      );
    } catch {
      // No capture to release — nothing to do.
    }
    this.persist();
  }

  protected onKeydown(event: KeyboardEvent): void {
    let next: number;
    switch (event.key) {
      case 'ArrowLeft':
        next = this.effectiveSize() - this.step();
        break;
      case 'ArrowRight':
        next = this.effectiveSize() + this.step();
        break;
      case 'Home':
        next = this.minSize();
        break;
      case 'End':
        next = this.resolveMaxPx();
        break;
      default:
        return;
    }
    event.preventDefault();
    this.applySize(next);
    this.persist();
  }

  // ── internals ──────────────────────────────────────────────────────────────

  private applySize(px: number): void {
    const clamped = this.clamp(px);
    const previous = this.effectiveSize();
    // Always store the clamped value so deltas can't accumulate off-limits.
    this.size.set(clamped);
    if (clamped !== previous) {
      this.sizeChange.emit(clamped);
    }
  }

  private clamp(px: number): number {
    const min = this.minSize();
    const max = Math.max(min, this.resolveMaxPx());
    return Math.min(Math.max(px, min), max);
  }

  private resolveMaxPx(): number {
    const raw = this.maxSize();
    const width = this.containerWidth();
    if (raw == null) {
      return width > 0 ? width : Number.MAX_SAFE_INTEGER;
    }
    if (typeof raw === 'number') return raw;
    const trimmed = raw.trim();
    const value = parseFloat(trimmed);
    if (Number.isNaN(value)) return Number.MAX_SAFE_INTEGER;
    if (trimmed.endsWith('%')) {
      return width > 0 ? (width * value) / 100 : Number.MAX_SAFE_INTEGER;
    }
    return value;
  }

  private observeContainer(): void {
    const element = this.host.nativeElement;
    this.containerWidth.set(element.clientWidth || 0);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      this.containerWidth.set(width);
    });
    observer.observe(element);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  private storageId(): string | null {
    const key = this.storageKey();
    return key ? `lc-split-pane:${key}` : null;
  }

  private restoreSize(): number | null {
    const id = this.storageId();
    if (!id) return null;
    try {
      const raw = globalThis.localStorage?.getItem(id);
      const parsed = raw == null ? NaN : parseFloat(raw);
      return Number.isFinite(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  private persist(): void {
    const id = this.storageId();
    if (!id) return;
    try {
      globalThis.localStorage?.setItem(id, String(this.effectiveSize()));
    } catch {
      // Storage unavailable (SSR, private mode) — width simply won't persist.
    }
  }
}
