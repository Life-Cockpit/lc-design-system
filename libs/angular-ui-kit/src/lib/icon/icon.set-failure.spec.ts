import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { IconComponent, resetIconCache, resetIconWarnings } from './icon.component';
import { resetIconRendering } from './icon-dom';
import { resetIconSet } from './icon-set-loader';

/**
 * The kit's set fails to load (offline, a deploy that removed the old chunk):
 * the placeholder in the same box, one warning, and the next icon tries again
 * (3.6, AS-17, design §3 step 4).
 */
let mockOffline = true;
jest.mock('@lifecorner/angular-ui-kit/internal/icon-set', () => {
  if (mockOffline) throw new Error('Failed to fetch dynamically imported module');
  return jest.requireActual('@lifecorner/angular-ui-kit/internal/icon-set');
});

describe('lc-icon when the kit set cannot be loaded (AS-17)', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [IconComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    resetIconWarnings();
    resetIconCache();
    resetIconRendering();
    resetIconSet();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
    TestBed.inject(HttpTestingController).verify();
  });

  it('shows the placeholder with one warning, and the next icon loads it', async () => {
    const isPlaceholder = (host: HTMLElement) =>
      Array.from(host.querySelectorAll('.icon-container > svg > *')).map((c) => c.tagName).join(',') === 'rect,text';

    const first = TestBed.createComponent(IconComponent);
    first.componentRef.setInput('name', 'home');
    first.detectChanges();
    const second = TestBed.createComponent(IconComponent);
    second.componentRef.setInput('name', 'sun');
    second.detectChanges();
    await first.whenStable();
    expect(isPlaceholder(first.nativeElement)).toBe(true);
    expect(isPlaceholder(second.nativeElement)).toBe(true);
    expect((first.nativeElement as HTMLElement).querySelector('.icon-container')?.getAttribute('style')).toBe('width: 24px; height: 24px;');
    expect(warnSpy.mock.calls.map(([m]) => m)).toEqual([
      "[lc-icon] The kit's icon set could not be loaded (Failed to fetch dynamically imported module). Rendering a placeholder instead.",
    ]);

    mockOffline = false;
    const third = TestBed.createComponent(IconComponent);
    third.componentRef.setInput('name', 'home');
    third.detectChanges();
    await third.whenStable();
    expect(isPlaceholder(third.nativeElement)).toBe(false);
    expect((third.nativeElement as HTMLElement).querySelector('svg')?.innerHTML).toContain('m2.25 12 8.954-8.955');
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});
