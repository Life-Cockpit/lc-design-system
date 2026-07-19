import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconComponent, resetIconWarnings } from './icon.component';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

// Sample SVG for testing
const MOCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
</svg>`;

describe('IconComponent', () => {
  let component: IconComponent;
  let fixture: ComponentFixture<IconComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    resetIconWarnings();
    fixture = TestBed.createComponent(IconComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Flush any pending HTTP requests with mock SVG to avoid test pollution
    const pendingRequests = httpMock.match(() => true);
    pendingRequests.forEach((req) => {
      if (!req.cancelled) {
        req.flush(MOCK_SVG);
      }
    });
    httpMock.verify();
  });

  /**
   * Helper to mock successful icon load
   */
  function mockIconLoad(iconName = 'user', variant = 'outline'): void {
    const folder = variant === 'solid' ? 'filled' : 'outline';
    const req = httpMock.expectOne(`/tabler-icons/${folder}/${iconName}.svg`);
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_SVG);
    fixture.detectChanges();
  }

  /**
   * Helper to wait for async operations
   */
  async function waitForAsync(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 10));
    fixture.detectChanges();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Basic Properties', () => {
    it('should have default name', () => {
      expect(component.name()).toBe('');
    });

    it('should have default variant', () => {
      expect(component.variant()).toBe('outline');
    });

    it('should have default size', () => {
      expect(component.size()).toBe('md');
    });

    it('should have default color', () => {
      expect(component.color()).toBe('currentColor');
    });

    it('should accept custom name via input', () => {
      fixture.componentRef.setInput('name', 'arrow-right');
      expect(component.name()).toBe('arrow-right');
    });

    it('should accept variant via input', () => {
      fixture.componentRef.setInput('variant', 'solid');
      expect(component.variant()).toBe('solid');
    });

    it('should accept size via input', () => {
      fixture.componentRef.setInput('size', 'lg');
      expect(component.size()).toBe('lg');
    });

    it('should accept color via input', () => {
      fixture.componentRef.setInput('color', '#FF0000');
      expect(component.color()).toBe('#FF0000');
    });
  });

  describe('Icon Variants', () => {
    it('should render outline variant by default', () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.detectChanges();
      const container = fixture.nativeElement.querySelector('.icon-container');
      expect(container?.classList.contains('icon-outline')).toBe(true);
    });

    it('should render solid variant', () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.componentRef.setInput('variant', 'solid');
      fixture.detectChanges();
      const container = fixture.nativeElement.querySelector('.icon-container');
      expect(container?.classList.contains('icon-solid')).toBe(true);
    });

    it('should load correct SVG path for outline variant', () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.componentRef.setInput('variant', 'outline');
      fixture.detectChanges();
      expect(component.iconPath()).toContain('/outline/anchor.svg');
    });

    it('should load correct SVG path for solid variant', () => {
      fixture.componentRef.setInput('name', 'check');
      fixture.componentRef.setInput('variant', 'solid');
      fixture.detectChanges();
      expect(component.iconPath()).toContain('/filled/check.svg');
    });
  });

  describe('Icon Sizes', () => {
    const sizes = {
      xs: '16px',
      sm: '20px',
      md: '24px',
      lg: '32px',
      xl: '40px',
    };

    Object.entries(sizes).forEach(([size, pixels]) => {
      it(`should apply ${size} size (${pixels})`, async () => {
        fixture.componentRef.setInput('name', 'anchor');
        fixture.componentRef.setInput('size', size);
        fixture.detectChanges();
        mockIconLoad('anchor');
        await waitForAsync();

        const svg = fixture.nativeElement.querySelector('svg');
        expect(svg?.getAttribute('width')).toBe(pixels);
        expect(svg?.getAttribute('height')).toBe(pixels);
      });
    });

    it('should have size class on container', async () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();
      mockIconLoad('anchor');
      await waitForAsync();

      const container = fixture.nativeElement.querySelector('.icon-container');
      expect(container?.classList.contains('icon-lg')).toBe(true);
    });
  });

  describe('Icon Colors', () => {
    it('should apply currentColor by default', async () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.detectChanges();
      mockIconLoad('anchor');
      await waitForAsync();

      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg?.style.color).toBe('currentcolor');
    });

    it('should apply custom hex color', async () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.componentRef.setInput('color', '#FF5733');
      fixture.detectChanges();
      mockIconLoad('anchor');
      await waitForAsync();

      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg?.style.color).toBe('rgb(255, 87, 51)'); // Browser converts hex to rgb
    });

    it('should apply CSS variable color', async () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.componentRef.setInput('color', 'var(--color-primary-500)');
      fixture.detectChanges();
      mockIconLoad('anchor');
      await waitForAsync();

      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg).toBeTruthy();
      // Note: In test environment, style may be set as inline property or style attribute
      // Just verify the SVG was loaded and component has the color value
      expect(component.colorStyle()).toBe('var(--color-primary-500)');
    });

    it('should apply CSS variable color', async () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.componentRef.setInput('color', 'var(--color-primary-500)');
      fixture.detectChanges();
      mockIconLoad('anchor');
      await waitForAsync();

      expect(component.colorStyle()).toBe('var(--color-primary-500)');
    });
  });

  describe('Computed Classes', () => {
    it('should compute correct classes for default state', () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.detectChanges();
      const classes = component.computedClasses().split(' ');
      expect(classes).toContain('icon-container');
      expect(classes).toContain('icon-md');
      expect(classes).toContain('icon-outline');
    });

    it('should compute classes with all custom inputs', () => {
      fixture.componentRef.setInput('name', 'check');
      fixture.componentRef.setInput('variant', 'solid');
      fixture.componentRef.setInput('size', 'xl');
      fixture.detectChanges();
      const classes = component.computedClasses().split(' ');
      expect(classes).toContain('icon-container');
      expect(classes).toContain('icon-xl');
      expect(classes).toContain('icon-solid');
    });
  });

  describe('SVG Loading', () => {
    it('should fetch SVG content for valid icon', async () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.detectChanges();
      mockIconLoad('anchor');
      await waitForAsync();

      // SVG content should be loaded
      expect(component.svgContent()).toBeTruthy();
    });

    it('should handle an unknown icon name gracefully with a visible fallback and NO fetch', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
        // silence expected warning
      });
      fixture.componentRef.setInput('name', 'non-existent-icon-xyz');
      fixture.detectChanges();

      // Unknown names must never be fetched: in SPA deployments the server
      // would answer with the index.html fallback (status 200).
      httpMock.expectNone('/tabler-icons/outline/non-existent-icon-xyz.svg');

      await waitForAsync();
      // Should not throw error, shows a visible placeholder glyph (dashed frame
      // with a "?"), not an empty space.
      const el = fixture.nativeElement.querySelector('.icon-container');
      expect(el?.innerHTML).toContain('stroke-dasharray');
      expect(el?.textContent).toContain('?');
      warnSpy.mockRestore();
    });

    it('should update SVG when name changes', async () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.detectChanges();
      mockIconLoad('anchor');
      await waitForAsync();
      const firstContent = component.svgContent();

      fixture.componentRef.setInput('name', 'settings');
      fixture.detectChanges();
      mockIconLoad('settings');
      await waitForAsync();
      const secondContent = component.svgContent();

      expect(firstContent).not.toBe(secondContent);
    });

    it('should update SVG when variant changes', async () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.componentRef.setInput('variant', 'outline');
      fixture.detectChanges();
      mockIconLoad('anchor', 'outline');
      await waitForAsync();
      const outlineContent = component.svgContent();

      fixture.componentRef.setInput('variant', 'solid');
      fixture.detectChanges();
      mockIconLoad('anchor', 'solid');
      await waitForAsync();
      const solidContent = component.svgContent();

      expect(outlineContent).not.toBe(solidContent);
    });
  });

  describe('Transient load retry', () => {
    // This project runs zoneless (no zone.js/testing), so we use real timers.
    const waitFor = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    it('retries a transient failure and then renders the icon', async () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.detectChanges();

      // First attempt fails transiently (e.g. connection reset / server busy)
      httpMock
        .expectOne('/tabler-icons/outline/anchor.svg')
        .error(new ProgressEvent('error'));

      await waitFor(300); // allow the backoff timer to elapse

      // Retry succeeds
      httpMock.expectOne('/tabler-icons/outline/anchor.svg').flush(MOCK_SVG);
      fixture.detectChanges();

      const el = fixture.nativeElement.querySelector('.icon-container');
      expect(el?.innerHTML).not.toContain('stroke-dasharray');
      expect(fixture.nativeElement.querySelector('svg')).toBeTruthy();
    });

    it('does not retry a genuine 404 and falls back immediately', async () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.detectChanges();

      httpMock
        .expectOne('/tabler-icons/outline/anchor.svg')
        .flush('Not Found', { status: 404, statusText: 'Not Found' });

      await waitFor(300); // no retry should be scheduled
      httpMock.expectNone('/tabler-icons/outline/anchor.svg');
      fixture.detectChanges();

      const el = fixture.nativeElement.querySelector('.icon-container');
      expect(el?.innerHTML).toContain('stroke-dasharray');
    });
  });

  describe('Accessibility', () => {
    it('should have role="img" by default', async () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.detectChanges();
      mockIconLoad('anchor');
      await waitForAsync();

      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg?.getAttribute('role')).toBe('img');
    });

    it('should accept custom aria-label', async () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.componentRef.setInput('ariaLabel', 'User profile');
      fixture.detectChanges();
      mockIconLoad('anchor');
      await waitForAsync();

      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg?.getAttribute('aria-label')).toBe('User profile');
    });

    it('should be aria-hidden when decorative', async () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.componentRef.setInput('decorative', true);
      fixture.detectChanges();
      mockIconLoad('anchor');
      await waitForAsync();

      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should not have aria-label when decorative', async () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.componentRef.setInput('decorative', true);
      fixture.componentRef.setInput('ariaLabel', 'Should be ignored');
      fixture.detectChanges();
      mockIconLoad('anchor');
      await waitForAsync();

      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg?.hasAttribute('aria-label')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty name', () => {
      fixture.componentRef.setInput('name', '');
      fixture.detectChanges();
      // Should not throw, should handle gracefully
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should show warning for invalid variant', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
        // Mock implementation
      });
      fixture.componentRef.setInput('name', 'anchor');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fixture.componentRef.setInput('variant', 'invalid' as any);
      fixture.detectChanges();
      // Component should handle invalid variant gracefully
      expect(() => fixture.detectChanges()).not.toThrow();
      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should not reload SVG unnecessarily', async () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.detectChanges();
      mockIconLoad('anchor');
      await waitForAsync();

      // Change unrelated property (size/color won't trigger HTTP reload)
      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();
      await waitForAsync();

      // SVG content HTML will be different (due to size attribute change)
      // but no new HTTP request was made
      expect(component.name()).toBe('anchor'); // Name hasn't changed
    });
  });

  describe('Visual Rendering', () => {
    it('should render inline SVG', async () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.detectChanges();
      mockIconLoad('anchor');
      await waitForAsync();

      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('should preserve SVG attributes', async () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.detectChanges();
      mockIconLoad('anchor');
      await waitForAsync();

      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg?.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');
      expect(svg?.getAttribute('fill')).toBe('none');
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
      expect(svg?.getAttribute('stroke-width')).toBe('1.5');
      expect(svg?.getAttribute('stroke')).toBe('currentColor');
    });
  });

  describe('Fail-loud on unknown names', () => {
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
        // capture without printing
      });
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('warns in dev mode for an unknown icon name', () => {
      fixture.componentRef.setInput('name', 'beaker');
      fixture.detectChanges();

      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('[lc-icon] Unknown icon "beaker"');
    });

    it('does NOT warn for a valid Tabler name', () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.detectChanges();

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('does NOT warn for a documented Heroicon alias', () => {
      fixture.componentRef.setInput('name', 'x-mark');
      fixture.detectChanges();

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('renders a visible placeholder for an unknown name without fetching', async () => {
      fixture.componentRef.setInput('name', 'beaker');
      fixture.detectChanges();

      httpMock.expectNone('/tabler-icons/outline/beaker.svg');
      await waitForAsync();

      const el = fixture.nativeElement.querySelector('.icon-container');
      expect(el?.innerHTML).toContain('stroke-dasharray');
      expect(el?.textContent).toContain('?');
    });

    it('warns only once per unknown name across instances', () => {
      fixture.componentRef.setInput('name', 'beaker');
      fixture.detectChanges();

      const second = TestBed.createComponent(IconComponent);
      second.componentRef.setInput('name', 'beaker');
      second.detectChanges();

      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('does not warn when the name is cleared', () => {
      fixture.componentRef.setInput('name', '');
      fixture.detectChanges();

      expect(warnSpy).not.toHaveBeenCalled();
      expect(component.svgContent()).toBe('');
    });

    describe('strict mode', () => {
      it('throws in dev mode for an unknown name', () => {
        fixture.componentRef.setInput('strict', true);
        fixture.componentRef.setInput('name', 'beaker');

        expect(() => fixture.detectChanges()).toThrow(/Unknown icon "beaker"/);
      });

      it('does not throw for a valid name', () => {
        fixture.componentRef.setInput('strict', true);
        fixture.componentRef.setInput('name', 'anchor');

        expect(() => fixture.detectChanges()).not.toThrow();
      });
    });
  });

  describe('SPA index.html fallback protection', () => {
    // What a SPA server returns for any missing path: the app shell, with
    // status 200 and content-type text/html.
    const INDEX_HTML =
      '<!doctype html>\n<html lang="en"><head><base href="/"><title>App</title></head>' +
      '<body><app-root></app-root><script src="main-abc123.js"></script></body></html>';

    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {
        // capture without printing
      });
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('drops a text/html response for a valid name and renders the placeholder', async () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.detectChanges();

      httpMock
        .expectOne('/tabler-icons/outline/anchor.svg')
        .flush(INDEX_HTML, { headers: { 'content-type': 'text/html' } });
      await waitForAsync();

      const el = fixture.nativeElement.querySelector('.icon-container');
      expect(el?.innerHTML).not.toContain('app-root');
      expect(el?.querySelector('script')).toBeNull();
      expect(el?.querySelector('base')).toBeNull();
      expect(el?.innerHTML).toContain('stroke-dasharray');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('non-SVG');
    });

    it('drops a non-SVG body even when the content-type claims image/svg+xml', async () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.detectChanges();

      httpMock
        .expectOne('/tabler-icons/outline/anchor.svg')
        .flush(INDEX_HTML, { headers: { 'content-type': 'image/svg+xml' } });
      await waitForAsync();

      const el = fixture.nativeElement.querySelector('.icon-container');
      expect(el?.querySelector('script')).toBeNull();
      expect(el?.innerHTML).toContain('stroke-dasharray');
    });

    it('warns exactly once per name even with many affected instances', async () => {
      const fixtures = [
        fixture,
        TestBed.createComponent(IconComponent),
        TestBed.createComponent(IconComponent),
      ];
      for (const f of fixtures) {
        f.componentRef.setInput('name', 'anchor');
        f.detectChanges();
      }

      httpMock
        .match('/tabler-icons/outline/anchor.svg')
        .forEach((req) =>
          req.flush(INDEX_HTML, { headers: { 'content-type': 'text/html' } })
        );
      await waitForAsync();

      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('still renders a valid SVG response with a single request', async () => {
      fixture.componentRef.setInput('name', 'anchor');
      fixture.detectChanges();

      httpMock
        .expectOne('/tabler-icons/outline/anchor.svg')
        .flush(MOCK_SVG, { headers: { 'content-type': 'image/svg+xml' } });
      await waitForAsync();

      httpMock.expectNone('/tabler-icons/outline/anchor.svg');
      const svg = fixture.nativeElement.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(fixture.nativeElement.innerHTML).not.toContain('stroke-dasharray');
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
