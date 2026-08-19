import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Injector,
  OnDestroy,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { IconComponent } from '../icon/icon.component';
import { SpinnerComponent } from '../spinner/spinner.component';
import { NgStyle } from '@angular/common';
import { isSafeImageUrl } from '../shared/safe-url';

export type GalleryLayout = 'grid' | 'masonry';
export type GallerySize = 'sm' | 'md' | 'lg';

export interface GalleryItem {
  /** Image source URL */
  src: string;
  /** Thumbnail URL (falls back to src if not provided) */
  thumbnail?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Optional caption displayed below the image */
  caption?: string;
  /** Optional category for filtering */
  category?: string;
}

const SIZE_COLUMNS: Record<GallerySize, number> = {
  sm: 4,
  md: 3,
  lg: 2,
};

/**
 * Gallery component for displaying image collections with lightbox.
 *
 * Features:
 * - Grid and masonry layout modes
 * - Responsive column count via size presets (sm, md, lg thumbnails)
 * - Configurable custom column count
 * - Lightbox overlay with navigation (prev/next)
 * - Keyboard navigation (Arrow keys, Escape); focus is trapped inside the
 *   lightbox and returned to the originating thumbnail on close
 * - Optional captions and category filtering
 * - Lazy loading with placeholder shimmer
 * - Zoom control in lightbox
 * - Download button in lightbox
 * - Dark/light theme support
 *
 * @example
 * ```html
 * <lc-gallery
 *   [items]="images"
 *   layout="grid"
 *   size="md"
 *   [showCaptions]="true" />
 * ```
 */
@Component({
  selector: 'lc-gallery',
  standalone: true,
  imports: [IconComponent, SpinnerComponent, NgStyle, CdkTrapFocus],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"gallery"',
  },
})
export class GalleryComponent implements OnDestroy {
  /** Array of gallery items to display */
  readonly items = input.required<GalleryItem[]>();

  /** Layout mode */
  readonly layout = input<GalleryLayout>('grid');

  /** Thumbnail size preset — controls column count (sm=4col, md=3col, lg=2col) */
  readonly size = input<GallerySize>('md');

  /** Custom column count (overrides size preset) */
  readonly columns = input<number | null>(null);

  /** Whether to show captions below thumbnails */
  readonly showCaptions = input(false);

  /** Whether clicking a thumbnail opens the lightbox */
  readonly enableLightbox = input(true);

  /** Gap between items in pixels */
  readonly gap = input(8);

  /** Aspect ratio for grid items (ignored in masonry mode) */
  readonly aspectRatio = input('1 / 1');

  /** Emitted when lightbox opens with item index */
  readonly lightboxOpen = output<number>();

  /** Emitted when lightbox closes */
  readonly lightboxClose = output<void>();

  // ── Internal state ───────────────────────────────────────────────────

  private readonly injector = inject(Injector);
  private readonly closeBtn = viewChild<ElementRef<HTMLButtonElement>>('closeBtn');
  /** Element that opened the lightbox — focus returns there on close. */
  private triggerElement: HTMLElement | null = null;

  protected lightboxIndex = signal<number | null>(null);
  protected lightboxZoom = signal(100);
  protected loadedImages = signal<Set<number>>(new Set());
  protected activeFilter = signal<string | null>(null);

  // ── Computed ─────────────────────────────────────────────────────────

  protected gridColumns = computed(() => {
    return this.columns() ?? SIZE_COLUMNS[this.size()];
  });

  protected gridStyle = computed(() => {
    const cols = this.gridColumns();
    const g = this.gap();
    if (this.layout() === 'masonry') {
      return {
        'column-count': `${cols}`,
        'column-gap': `${g}px`,
      };
    }
    return {
      'display': 'grid',
      'grid-template-columns': `repeat(${cols}, 1fr)`,
      'gap': `${g}px`,
    };
  });

  protected itemStyle = computed(() => {
    if (this.layout() === 'masonry') return {};
    return { 'aspect-ratio': this.aspectRatio() };
  });

  protected categories = computed<string[]>(() => {
    const cats = new Set<string>();
    for (const item of this.items()) {
      if (item.category) cats.add(item.category);
    }
    return Array.from(cats).sort();
  });

  protected filteredItems = computed(() => {
    const filter = this.activeFilter();
    if (!filter) return this.items();
    return this.items().filter(item => item.category === filter);
  });

  protected showFilters = computed(() => this.categories().length > 1);

  protected lightboxItem = computed<GalleryItem | null>(() => {
    const idx = this.lightboxIndex();
    if (idx === null) return null;
    const items = this.filteredItems();
    return items[idx] ?? null;
  });

  protected lightboxCounter = computed(() => {
    const idx = this.lightboxIndex();
    if (idx === null) return '';
    return `${idx + 1} / ${this.filteredItems().length}`;
  });

  protected lightboxTransform = computed(() => {
    const z = this.lightboxZoom() / 100;
    return `scale(${z})`;
  });

  protected canGoPrev = computed(() => {
    const idx = this.lightboxIndex();
    return idx !== null && idx > 0;
  });

  protected canGoNext = computed(() => {
    const idx = this.lightboxIndex();
    return idx !== null && idx < this.filteredItems().length - 1;
  });

  // ── Lifecycle ────────────────────────────────────────────────────────

  ngOnDestroy(): void {
    // No focus restore here: the injector is going away with the view.
    this.closeLightbox(false);
  }

  // ── Actions ──────────────────────────────────────────────────────────

  /**
   * Opens the lightbox for `index`. Like a native button, Space activates on
   * *keyup* (keydown only prevents the page scroll): activating on keydown
   * would move focus to the Close button before the key is released, and the
   * Space keyup would then immediately click Close.
   */
  protected openLightbox(index: number, event?: Event): void {
    if (!this.enableLightbox()) return;
    if (event instanceof KeyboardEvent) event.preventDefault();
    this.triggerElement =
      (event?.currentTarget as HTMLElement | null) ??
      (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    this.lightboxIndex.set(index);
    this.lightboxZoom.set(100);
    this.lightboxOpen.emit(index);
    document.body.style.overflow = 'hidden';
    // The dialog is `@if`-rendered — move focus in once it exists.
    afterNextRender(() => this.closeBtn()?.nativeElement.focus(), { injector: this.injector });
  }

  protected closeLightbox(restoreFocus = true): void {
    if (this.lightboxIndex() === null) return;
    this.lightboxIndex.set(null);
    this.lightboxZoom.set(100);
    this.lightboxClose.emit();
    document.body.style.overflow = '';
    const trigger = this.triggerElement;
    this.triggerElement = null;
    if (restoreFocus && trigger?.isConnected) {
      afterNextRender(() => trigger.focus(), { injector: this.injector });
    }
  }

  protected goToPrev(): void {
    const idx = this.lightboxIndex();
    if (idx !== null && idx > 0) {
      this.lightboxIndex.set(idx - 1);
      this.lightboxZoom.set(100);
    }
  }

  protected goToNext(): void {
    const idx = this.lightboxIndex();
    if (idx !== null && idx < this.filteredItems().length - 1) {
      this.lightboxIndex.set(idx + 1);
      this.lightboxZoom.set(100);
    }
  }

  protected zoomIn(): void {
    this.lightboxZoom.update(z => Math.min(z + 25, 500));
  }

  protected zoomOut(): void {
    this.lightboxZoom.update(z => Math.max(z - 25, 25));
  }

  protected resetZoom(): void {
    this.lightboxZoom.set(100);
  }

  protected downloadCurrent(): void {
    const item = this.lightboxItem();
    // A programmatic click on a caller-supplied URL: only image-safe schemes.
    if (!item || !isSafeImageUrl(item.src)) return;
    const a = document.createElement('a');
    a.href = item.src;
    a.download = item.alt || 'image';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  protected setFilter(category: string | null): void {
    this.activeFilter.set(category);
  }

  protected onImageLoad(index: number): void {
    this.loadedImages.update(set => {
      const next = new Set(set);
      next.add(index);
      return next;
    });
  }

  protected isLoaded(index: number): boolean {
    return this.loadedImages().has(index);
  }

  protected getThumbnail(item: GalleryItem): string {
    return item.thumbnail || item.src;
  }

  protected trackByIndex(index: number): number {
    return index;
  }

  /**
   * Keyboard handling while the lightbox is open. Bound on the lightbox itself
   * (focus is trapped inside it) and, as a fallback, on `document`. A handled
   * Escape stops propagating so an enclosing modal/drawer doesn't close too.
   */
  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (this.lightboxIndex() === null) return;
    switch (event.key) {
      case 'Escape':
        event.stopPropagation();
        this.closeLightbox();
        break;
      case 'ArrowLeft':
        event.stopPropagation();
        this.goToPrev();
        break;
      case 'ArrowRight':
        event.stopPropagation();
        this.goToNext();
        break;
    }
  }
}
