import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { GalleryComponent, GalleryItem, GalleryLayout, GallerySize } from './gallery.component';
import { provideHttpClient } from '@angular/common/http';

const MOCK_ITEMS: GalleryItem[] = [
  { src: '/img/1.jpg', alt: 'Image 1', caption: 'First image', category: 'Nature' },
  { src: '/img/2.jpg', alt: 'Image 2', caption: 'Second image', category: 'Nature' },
  { src: '/img/3.jpg', alt: 'Image 3', caption: 'Third image', category: 'City' },
  { src: '/img/4.jpg', alt: 'Image 4', category: 'City' },
];

@Component({
  standalone: true,
  imports: [GalleryComponent],
  template: `
    <lc-gallery
      [items]="items"
      [layout]="layout"
      [size]="size"
      [columns]="columns"
      [showCaptions]="showCaptions"
      [enableLightbox]="enableLightbox"
      [gap]="gap"
      [aspectRatio]="aspectRatio"
    />
  `,
})
class TestHostComponent {
  items: GalleryItem[] = MOCK_ITEMS;
  layout: GalleryLayout = 'grid';
  size: GallerySize = 'md';
  columns: number | null = null;
  showCaptions = false;
  enableLightbox = true;
  gap = 8;
  aspectRatio = '1 / 1';
}

describe('GalleryComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render all items', () => {
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.gallery__item');
    expect(items.length).toBe(4);
  });

  it('should render images with correct src', () => {
    fixture.detectChanges();
    const imgs = fixture.nativeElement.querySelectorAll('.gallery__thumb');
    expect(imgs[0].getAttribute('src')).toBe('/img/1.jpg');
    expect(imgs[2].getAttribute('src')).toBe('/img/3.jpg');
  });

  it('should set alt text on images', () => {
    fixture.detectChanges();
    const imgs = fixture.nativeElement.querySelectorAll('.gallery__thumb');
    expect(imgs[0].getAttribute('alt')).toBe('Image 1');
  });

  // ── Captions ─────────────────────────────────────────────────────────

  it('should hide captions by default', () => {
    fixture.detectChanges();
    const captions = fixture.nativeElement.querySelectorAll('.gallery__caption');
    expect(captions.length).toBe(0);
  });

  it('should show captions when enabled', () => {
    host.showCaptions = true;
    fixture.detectChanges();
    const captions = fixture.nativeElement.querySelectorAll('.gallery__caption');
    // 3 items have captions, 1 does not
    expect(captions.length).toBe(3);
    expect(captions[0].textContent).toContain('First image');
  });

  // ── Filters ──────────────────────────────────────────────────────────

  it('should show filter buttons when categories exist', () => {
    fixture.detectChanges();
    const filters = fixture.nativeElement.querySelectorAll('.gallery__filter-btn');
    // "All" + "City" + "Nature"
    expect(filters.length).toBe(3);
  });

  it('should not show filters when no categories', () => {
    host.items = [
      { src: '/img/1.jpg', alt: 'A' },
      { src: '/img/2.jpg', alt: 'B' },
    ];
    fixture.detectChanges();
    const filters = fixture.nativeElement.querySelectorAll('.gallery__filter-btn');
    expect(filters.length).toBe(0);
  });

  it('should filter items by category', () => {
    fixture.detectChanges();
    const filterBtns = fixture.nativeElement.querySelectorAll('.gallery__filter-btn');
    // Click "City" (sorted: City, Nature — so index 1 = City)
    filterBtns[1].click();
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.gallery__item');
    expect(items.length).toBe(2);
  });

  it('should show all items when "All" filter clicked', () => {
    fixture.detectChanges();
    const filterBtns = fixture.nativeElement.querySelectorAll('.gallery__filter-btn');
    // Click City first
    filterBtns[1].click();
    fixture.detectChanges();
    // Click All
    filterBtns[0].click();
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.gallery__item');
    expect(items.length).toBe(4);
  });

  // ── Layout ───────────────────────────────────────────────────────────

  it('should apply grid layout by default', () => {
    fixture.detectChanges();
    const grid = fixture.nativeElement.querySelector('.gallery__grid');
    expect(grid.style.display).toBe('grid');
  });

  it('should apply masonry class for masonry layout', () => {
    host.layout = 'masonry';
    fixture.detectChanges();
    const grid = fixture.nativeElement.querySelector('.gallery__grid--masonry');
    expect(grid).toBeTruthy();
  });

  it('should set 3 columns for md size', () => {
    fixture.detectChanges();
    const grid = fixture.nativeElement.querySelector('.gallery__grid');
    expect(grid.style.gridTemplateColumns).toBe('repeat(3, 1fr)');
  });

  it('should set 4 columns for sm size', () => {
    host.size = 'sm';
    fixture.detectChanges();
    const grid = fixture.nativeElement.querySelector('.gallery__grid');
    expect(grid.style.gridTemplateColumns).toBe('repeat(4, 1fr)');
  });

  it('should override columns with custom count', () => {
    host.columns = 5;
    fixture.detectChanges();
    const grid = fixture.nativeElement.querySelector('.gallery__grid');
    expect(grid.style.gridTemplateColumns).toBe('repeat(5, 1fr)');
  });

  it('should apply custom gap', () => {
    host.gap = 16;
    fixture.detectChanges();
    const grid = fixture.nativeElement.querySelector('.gallery__grid');
    expect(grid.style.gap).toBe('16px');
  });

  // ── Lightbox ─────────────────────────────────────────────────────────

  it('should not show lightbox initially', () => {
    fixture.detectChanges();
    const lightbox = fixture.nativeElement.querySelector('.gallery__lightbox');
    expect(lightbox).toBeNull();
  });

  it('should open lightbox on item click', () => {
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.gallery__item');
    items[1].click();
    fixture.detectChanges();
    const lightbox = fixture.nativeElement.querySelector('.gallery__lightbox');
    expect(lightbox).toBeTruthy();
  });

  it('should show correct image in lightbox', () => {
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.gallery__item');
    items[1].click();
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.gallery__lightbox-image');
    expect(img.getAttribute('src')).toBe('/img/2.jpg');
  });

  it('should show counter in lightbox', () => {
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.gallery__item');
    items[0].click();
    fixture.detectChanges();
    const counter = fixture.nativeElement.querySelector('.gallery__lightbox-counter');
    expect(counter.textContent.trim()).toBe('1 / 4');
  });

  it('should close lightbox on close button click', () => {
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.gallery__item');
    items[0].click();
    fixture.detectChanges();
    const closeBtn = fixture.nativeElement.querySelector('[aria-label="Close"]');
    closeBtn.click();
    fixture.detectChanges();
    const lightbox = fixture.nativeElement.querySelector('.gallery__lightbox');
    expect(lightbox).toBeNull();
  });

  it('should close lightbox on backdrop click', () => {
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.gallery__item');
    items[0].click();
    fixture.detectChanges();
    const backdrop = fixture.nativeElement.querySelector('.gallery__lightbox-backdrop');
    backdrop.click();
    fixture.detectChanges();
    const lightbox = fixture.nativeElement.querySelector('.gallery__lightbox');
    expect(lightbox).toBeNull();
  });

  it('should navigate to next image', () => {
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.gallery__item');
    items[0].click();
    fixture.detectChanges();
    const nextBtn = fixture.nativeElement.querySelector('[aria-label="Next image"]');
    nextBtn.click();
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.gallery__lightbox-image');
    expect(img.getAttribute('src')).toBe('/img/2.jpg');
  });

  it('should navigate to previous image', () => {
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.gallery__item');
    items[1].click();
    fixture.detectChanges();
    const prevBtn = fixture.nativeElement.querySelector('[aria-label="Previous image"]');
    prevBtn.click();
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.gallery__lightbox-image');
    expect(img.getAttribute('src')).toBe('/img/1.jpg');
  });

  it('should hide prev button on first image', () => {
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.gallery__item');
    items[0].click();
    fixture.detectChanges();
    const prevBtn = fixture.nativeElement.querySelector('[aria-label="Previous image"]');
    expect(prevBtn).toBeNull();
  });

  it('should hide next button on last image', () => {
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.gallery__item');
    items[3].click();
    fixture.detectChanges();
    const nextBtn = fixture.nativeElement.querySelector('[aria-label="Next image"]');
    expect(nextBtn).toBeNull();
  });

  it('should show caption in lightbox if available', () => {
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.gallery__item');
    items[0].click();
    fixture.detectChanges();
    const caption = fixture.nativeElement.querySelector('.gallery__lightbox-caption');
    expect(caption).toBeTruthy();
    expect(caption.textContent).toContain('First image');
  });

  it('should not show caption in lightbox if not available', () => {
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.gallery__item');
    items[3].click();
    fixture.detectChanges();
    const caption = fixture.nativeElement.querySelector('.gallery__lightbox-caption');
    expect(caption).toBeNull();
  });

  // ── Lightbox disabled ────────────────────────────────────────────────

  it('should not open lightbox when disabled', () => {
    host.enableLightbox = false;
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.gallery__item');
    items[0].click();
    fixture.detectChanges();
    const lightbox = fixture.nativeElement.querySelector('.gallery__lightbox');
    expect(lightbox).toBeNull();
  });

  // ── Keyboard ─────────────────────────────────────────────────────────

  it('should close lightbox on Escape key', () => {
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.gallery__item');
    items[0].click();
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    const lightbox = fixture.nativeElement.querySelector('.gallery__lightbox');
    expect(lightbox).toBeNull();
  });

  it('should navigate with arrow keys', () => {
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.gallery__item');
    items[0].click();
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();
    let img = fixture.nativeElement.querySelector('.gallery__lightbox-image');
    expect(img.getAttribute('src')).toBe('/img/2.jpg');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    fixture.detectChanges();
    img = fixture.nativeElement.querySelector('.gallery__lightbox-image');
    expect(img.getAttribute('src')).toBe('/img/1.jpg');
  });

  // ── Thumbnail ────────────────────────────────────────────────────────

  it('should use thumbnail URL when provided', () => {
    host.items = [
      { src: '/img/large.jpg', thumbnail: '/img/thumb.jpg', alt: 'Test' },
    ];
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.gallery__thumb');
    expect(img.getAttribute('src')).toBe('/img/thumb.jpg');
  });

  it('should fall back to src when no thumbnail', () => {
    host.items = [{ src: '/img/large.jpg', alt: 'Test' }];
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.gallery__thumb');
    expect(img.getAttribute('src')).toBe('/img/large.jpg');
  });

  // ── Accessibility ────────────────────────────────────────────────────

  it('should set role=button on clickable items', () => {
    fixture.detectChanges();
    const item = fixture.nativeElement.querySelector('.gallery__item');
    expect(item.getAttribute('role')).toBe('button');
  });

  it('should not set role=button when lightbox disabled', () => {
    host.enableLightbox = false;
    fixture.detectChanges();
    const item = fixture.nativeElement.querySelector('.gallery__item');
    expect(item.getAttribute('role')).toBeNull();
  });

  it('should set aria-label on lightbox dialog', () => {
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.gallery__item');
    items[0].click();
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  // ── Focus management ─────────────────────────────────────────────────

  describe('lightbox focus management', () => {
    it('moves focus to the close button when the lightbox opens', () => {
      fixture.detectChanges();
      const items = fixture.nativeElement.querySelectorAll('.gallery__item');
      items[1].focus();
      items[1].click();
      fixture.detectChanges();
      const closeBtn = fixture.nativeElement.querySelector('[aria-label="Close"]');
      expect(document.activeElement).toBe(closeBtn);
    });

    it('traps focus inside the lightbox', () => {
      fixture.detectChanges();
      fixture.nativeElement.querySelectorAll('.gallery__item')[0].click();
      fixture.detectChanges();
      const dialog = fixture.nativeElement.querySelector('.gallery__lightbox') as HTMLElement;
      // cdkTrapFocus surrounds the region with focus-catching sibling anchors.
      expect(dialog.previousElementSibling?.classList).toContain('cdk-focus-trap-anchor');
      expect(dialog.nextElementSibling?.classList).toContain('cdk-focus-trap-anchor');
      expect(dialog.getAttribute('tabindex')).toBe('-1');
    });

    it('returns focus to the originating thumbnail on close', () => {
      fixture.detectChanges();
      const items = fixture.nativeElement.querySelectorAll('.gallery__item');
      items[2].focus();
      items[2].click();
      fixture.detectChanges();
      expect(document.activeElement).not.toBe(items[2]);
      (fixture.nativeElement.querySelector('[aria-label="Close"]') as HTMLElement).click();
      fixture.detectChanges();
      expect(document.activeElement).toBe(items[2]);
    });

    it('returns focus to the thumbnail after closing with Escape', () => {
      fixture.detectChanges();
      const items = fixture.nativeElement.querySelectorAll('.gallery__item');
      items[0].focus();
      items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      fixture.detectChanges();
      const dialog = fixture.nativeElement.querySelector('.gallery__lightbox') as HTMLElement;
      dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.gallery__lightbox')).toBeNull();
      expect(document.activeElement).toBe(items[0]);
    });
  });

  // ── Keyboard: thumbnails + Escape stacking ───────────────────────────

  describe('keyboard', () => {
    it('opens the lightbox on Space (keyup, like a native button) and prevents page scroll', () => {
      fixture.detectChanges();
      const item = fixture.nativeElement.querySelectorAll('.gallery__item')[1] as HTMLElement;
      const down = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      item.dispatchEvent(down);
      fixture.detectChanges();
      expect(down.defaultPrevented).toBe(true);
      // Not yet — activating on keydown would let the Space keyup hit the Close button.
      expect(fixture.nativeElement.querySelector('.gallery__lightbox')).toBeNull();
      item.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true, cancelable: true }));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.gallery__lightbox')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.gallery__lightbox-image').getAttribute('src')).toBe('/img/2.jpg');
    });

    it('does not open the lightbox on Space when the lightbox is disabled', () => {
      host.enableLightbox = false;
      fixture.detectChanges();
      const item = fixture.nativeElement.querySelector('.gallery__item') as HTMLElement;
      item.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
      item.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true, cancelable: true }));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.gallery__lightbox')).toBeNull();
    });

    it('stops a handled Escape from propagating to enclosing dialogs', () => {
      fixture.detectChanges();
      fixture.nativeElement.querySelectorAll('.gallery__item')[0].click();
      fixture.detectChanges();
      const outer = jest.fn();
      document.addEventListener('keydown', outer);
      try {
        const dialog = fixture.nativeElement.querySelector('.gallery__lightbox') as HTMLElement;
        dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('.gallery__lightbox')).toBeNull();
        expect(outer).not.toHaveBeenCalled();
      } finally {
        document.removeEventListener('keydown', outer);
      }
    });

    it('lets Escape through once the lightbox is closed', () => {
      fixture.detectChanges();
      const outer = jest.fn();
      document.addEventListener('keydown', outer);
      try {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(outer).toHaveBeenCalledTimes(1);
      } finally {
        document.removeEventListener('keydown', outer);
      }
    });
  });
});
