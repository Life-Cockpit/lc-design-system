import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { By } from '@angular/platform-browser';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { HeroComponent, HeroColor, HeroContentWidth, HeroSize, HeroVariant } from './hero.component';

@Component({
  standalone: true,
  imports: [HeroComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <lc-hero
      [title]="title"
      [label]="label"
      [color]="color"
      [size]="size"
      [borderRadius]="borderRadius"
      [variant]="variant"
      [contentWidth]="contentWidth"
    >
      <p class="body-content">Description text</p>
      <div hero-footer>
        <div class="stat">Stat 1</div>
        <div class="stat">Stat 2</div>
      </div>
    </lc-hero>
  `,
})
class TestHostComponent {
  title = 'Test Title';
  label: string | undefined = undefined;
  color: HeroColor = 'primary';
  size: HeroSize = 'md';
  borderRadius: 'none' | 'sm' | 'md' | 'lg' = 'lg';
  variant: HeroVariant = 'default';
  contentWidth: HeroContentWidth = 'full';
}

@Component({
  standalone: true,
  imports: [HeroComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <lc-hero title="With media" contentWidth="lg">
      <p class="body-content">Description text</p>
      <div hero-media class="media-content">Visual</div>
      <div hero-footer class="footer-content">Footer</div>
    </lc-hero>
  `,
})
class MediaHostComponent {}

describe('HeroComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let heroEl: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
  });

  function getHeroDiv(): HTMLElement {
    return fixture.debugElement.query(By.css('.hero')).nativeElement;
  }

  it('should create', () => {
    fixture.detectChanges();
    const hero = fixture.debugElement.query(By.directive(HeroComponent));
    expect(hero).toBeTruthy();
  });

  describe('Title', () => {
    it('should render the title', () => {
      fixture.detectChanges();
      heroEl = getHeroDiv();
      const titleEl = heroEl.querySelector('.hero__title');
      expect(titleEl?.textContent?.trim()).toBe('Test Title');
    });

    it('should render a different title', () => {
      hostComponent.title = 'Another Title';
      fixture.detectChanges();
      heroEl = getHeroDiv();
      expect(heroEl.querySelector('.hero__title')?.textContent?.trim()).toBe('Another Title');
    });
  });

  describe('Label', () => {
    it('should not render label when not provided', () => {
      fixture.detectChanges();
      heroEl = getHeroDiv();
      expect(heroEl.querySelector('.hero__label')).toBeNull();
    });

    it('should render label when provided', () => {
      hostComponent.label = 'MY LABEL';
      fixture.detectChanges();
      heroEl = getHeroDiv();
      const labelEl = heroEl.querySelector('.hero__label');
      expect(labelEl).toBeTruthy();
      expect(labelEl?.textContent?.trim()).toBe('MY LABEL');
    });
  });

  describe('Color', () => {
    it('should apply primary color class by default', () => {
      fixture.detectChanges();
      heroEl = getHeroDiv();
      expect(heroEl.classList).toContain('hero--primary');
    });

    const colors: HeroColor[] = [
      'primary',
      'secondary',
      'neutral',
      'success',
      'info',
      'warning',
      'accent-orange',
      'accent-purple',
      'accent-violet',
    ];

    colors.forEach((color) => {
      it(`should apply ${color} color class`, () => {
        hostComponent.color = color;
        fixture.detectChanges();
        heroEl = getHeroDiv();
        expect(heroEl.classList).toContain(`hero--${color}`);
      });
    });
  });

  describe('Size', () => {
    it('should apply md size class by default', () => {
      fixture.detectChanges();
      heroEl = getHeroDiv();
      expect(heroEl.classList).toContain('hero--md');
    });

    const sizes: HeroSize[] = ['sm', 'md', 'lg'];

    sizes.forEach((size) => {
      it(`should apply ${size} size class`, () => {
        hostComponent.size = size;
        fixture.detectChanges();
        heroEl = getHeroDiv();
        expect(heroEl.classList).toContain(`hero--${size}`);
      });
    });
  });

  describe('Border Radius', () => {
    it('should apply lg border radius by default', () => {
      fixture.detectChanges();
      heroEl = getHeroDiv();
      expect(heroEl.classList).toContain('hero--radius-lg');
    });

    it('should apply none border radius', () => {
      hostComponent.borderRadius = 'none';
      fixture.detectChanges();
      heroEl = getHeroDiv();
      expect(heroEl.classList).toContain('hero--radius-none');
    });
  });

  describe('Variant', () => {
    it('should apply default variant class by default', () => {
      fixture.detectChanges();
      expect(getHeroDiv().classList).toContain('hero--default');
    });

    (['slim', 'light'] as HeroVariant[]).forEach((variant) => {
      it(`should apply ${variant} variant class`, () => {
        hostComponent.variant = variant;
        fixture.detectChanges();
        expect(getHeroDiv().classList).toContain(`hero--${variant}`);
      });
    });
  });

  describe('Content width', () => {
    it('keeps the full width by default (unchanged behaviour)', () => {
      fixture.detectChanges();
      expect(getHeroDiv().classList).toContain('hero--content-full');
      expect(getHeroDiv().classList).not.toContain('hero--content-lg');
    });

    it('applies the lg content width class', () => {
      hostComponent.contentWidth = 'lg';
      fixture.detectChanges();
      expect(getHeroDiv().classList).toContain('hero--content-lg');
    });
  });

  describe('Media slot', () => {
    it('renders an empty media column when nothing is projected into it', () => {
      fixture.detectChanges();
      const media = getHeroDiv().querySelector('.hero__media');
      expect(media).toBeTruthy();
      expect(media?.children.length).toBe(0);
    });

    it('projects [hero-media] into the media column, outside the body and its opacity', () => {
      const mediaFixture = TestBed.createComponent(MediaHostComponent);
      mediaFixture.detectChanges();
      const hero: HTMLElement = mediaFixture.debugElement.query(By.css('.hero')).nativeElement;
      const media = hero.querySelector('.hero__media .media-content');
      expect(media?.textContent?.trim()).toBe('Visual');
      expect(hero.querySelector('.hero__body .media-content')).toBeNull();
      // the media column sits beside the text block, and the footer stays below both
      const inner = hero.querySelector('.hero__inner');
      expect(inner?.querySelector(':scope > .hero__content')).toBeTruthy();
      expect(inner?.querySelector(':scope > .hero__media')).toBeTruthy();
      expect(hero.querySelector(':scope > .footer-content')).toBeTruthy();
    });
  });

  describe('Stylesheet contract', () => {
    // jsdom does not apply component styles, so the two theming guarantees are
    // checked against the source: they are what keeps the light variant
    // readable under the dark root and the footer rule out of the global scope.
    const scss = readFileSync(resolve(__dirname, 'hero.component.scss'), 'utf-8');

    it('pins the light variant ink to a literal dark value (not a theme-dependent token)', () => {
      const start = scss.indexOf('&--light {');
      expect(start).toBeGreaterThan(-1);
      const lightBlock = scss.slice(start, scss.indexOf('// Light gradient overrides', start));
      expect(lightBlock).not.toContain('var(--color-text-primary');
      expect(lightBlock).toMatch(/color:\s*colors\.\$color-neutral-800/);
    });

    it('does not ship a bare (unscoped) ::ng-deep rule', () => {
      const bareNgDeep = scss.split('\n').filter((line) => /^::ng-deep/.test(line));
      expect(bareNgDeep).toEqual([]);
    });

    it('centres the lg content on the 1024 px page column, never closer to the edge than the size padding', () => {
      expect(scss).toContain('.hero--content-lg {');
      expect(scss).toMatch(/max\(\s*3\.5rem,\s*calc\(\(100% - 1024px\) \/ 2 \+ 3rem\)\s*\)/);
    });

    it('lays out text and media side by side from 1024 px through the media width hook', () => {
      expect(scss).toContain('minmax(0, 1fr) var(--lc-hero-media-width, 23rem)');
      expect(scss).toMatch(/\.hero__inner:has\(> \.hero__media:not\(:empty\)\)/);
    });
  });

  describe('Content Projection', () => {
    it('should project body content', () => {
      fixture.detectChanges();
      heroEl = getHeroDiv();
      const body = heroEl.querySelector('.body-content');
      expect(body?.textContent?.trim()).toBe('Description text');
    });

    it('should project footer content', () => {
      fixture.detectChanges();
      const footer = fixture.debugElement.query(By.css('[hero-footer]'));
      expect(footer).toBeTruthy();
      const stats = footer.nativeElement.querySelectorAll('.stat');
      expect(stats.length).toBe(2);
    });
  });
});
