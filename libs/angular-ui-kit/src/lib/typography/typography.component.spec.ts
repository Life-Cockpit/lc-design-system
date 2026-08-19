import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TypographyComponent } from './typography.component';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { readFileSync } from 'fs';
import { join } from 'path';

type Variant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'body1'
  | 'body2'
  | 'subtitle1'
  | 'subtitle2'
  | 'caption'
  | 'overline';
type Align = 'left' | 'center' | 'right' | 'justify';
type Color = 'primary' | 'secondary' | 'disabled' | 'error' | 'success' | 'warning' | 'info';
type Weight = 'regular' | 'medium' | 'semibold' | 'bold' | undefined;
type Transform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

@Component({
  selector: 'lc-test-wrapper',
  standalone: true,
  imports: [TypographyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lc-typography
      [variant]="variant()"
      [align]="align()"
      [color]="color()"
      [weight]="weight()"
      [transform]="transform()"
      [noWrap]="noWrap()"
      [lineClamp]="lineClamp()"
      [gutterBottom]="gutterBottom()"
    >
      {{ content() }}
    </lc-typography>
  `,
})
class TestWrapperComponent {
  readonly variant = signal<Variant>('body1');
  readonly align = signal<Align>('left');
  readonly color = signal<Color>('primary');
  readonly weight = signal<Weight>(undefined);
  readonly transform = signal<Transform>('none');
  readonly noWrap = signal(false);
  readonly lineClamp = signal<number | undefined>(undefined);
  readonly gutterBottom = signal(false);
  readonly content = signal('Test content');
}

describe('TypographyComponent', () => {
  let fixture: ComponentFixture<TestWrapperComponent>;
  let component: TestWrapperComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestWrapperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestWrapperComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges() here - let each test control it
  });

  function getTypographyElement(): HTMLElement {
    const element = fixture.nativeElement.querySelector('[class*="typography"]');
    if (!element) {
      throw new Error('Typography element not found');
    }
    return element as HTMLElement;
  }

  describe('Basic', () => {
    it('should create', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render content', () => {
      component.content.set('Hello World');
      fixture.detectChanges();
      const element = getTypographyElement();
      expect(element.textContent?.trim()).toBe('Hello World');
    });
  });

  describe('Variants - Semantic HTML Elements', () => {
    it.each<[Variant, string]>([
      ['h1', 'h1'],
      ['h2', 'h2'],
      ['h3', 'h3'],
      ['h4', 'h4'],
      ['h5', 'h5'],
      ['h6', 'h6'],
      ['body1', 'p'],
      ['body2', 'p'],
      ['subtitle1', 'p'],
      ['subtitle2', 'p'],
      ['caption', 'span'],
      ['overline', 'span'],
    ])('should render %s variant as <%s>', (variant, tag) => {
      component.variant.set(variant);
      fixture.detectChanges();
      const element = fixture.nativeElement.querySelector(tag);
      expect(element).toBeTruthy();
      expect(element.classList.contains(`typography-${variant}`)).toBe(true);
    });
  });

  describe('Text Alignment', () => {
    it.each<Align>(['left', 'center', 'right', 'justify'])('should apply %s alignment', (align) => {
      component.align.set(align);
      fixture.detectChanges();
      const element = getTypographyElement();
      expect(element.classList.contains(`lc-typography--align-${align}`)).toBe(true);
    });

    it('should not emit the Tailwind text-* alignment utilities', () => {
      component.align.set('center');
      fixture.detectChanges();
      const element = getTypographyElement();
      expect(element.classList.contains('text-center')).toBe(false);
    });
  });

  describe('Color Variants', () => {
    it.each<Color>(['primary', 'secondary', 'disabled', 'error', 'success', 'warning', 'info'])(
      'should apply %s color',
      (color) => {
        component.color.set(color);
        fixture.detectChanges();
        const element = getTypographyElement();
        expect(element.classList.contains(`lc-typography--color-${color}`)).toBe(true);
      },
    );
  });

  describe('Font Weights', () => {
    it('should not force a weight by default (variant weight applies)', () => {
      component.variant.set('h1');
      fixture.detectChanges();
      const element = getTypographyElement();
      expect(Array.from(element.classList).some((c) => c.startsWith('lc-typography--weight-'))).toBe(
        false,
      );
    });

    it.each<Exclude<Weight, undefined>>(['regular', 'medium', 'semibold', 'bold'])(
      'should apply %s weight',
      (weight) => {
        component.weight.set(weight);
        fixture.detectChanges();
        const element = getTypographyElement();
        expect(element.classList.contains(`lc-typography--weight-${weight}`)).toBe(true);
        expect(element.classList.contains(`font-${weight}`)).toBe(false);
      },
    );
  });

  describe('Text Transform', () => {
    it('should apply no transform by default', () => {
      component.transform.set('none');
      fixture.detectChanges();
      const element = getTypographyElement();
      expect(element.classList.contains('lc-typography--uppercase')).toBe(false);
      expect(element.classList.contains('lc-typography--lowercase')).toBe(false);
      expect(element.classList.contains('lc-typography--capitalize')).toBe(false);
    });

    it.each<Exclude<Transform, 'none'>>(['uppercase', 'lowercase', 'capitalize'])(
      'should apply %s transform',
      (transform) => {
        component.transform.set(transform);
        fixture.detectChanges();
        const element = getTypographyElement();
        expect(element.classList.contains(`lc-typography--${transform}`)).toBe(true);
        expect(element.classList.contains(transform)).toBe(false);
      },
    );
  });

  describe('Text Wrapping', () => {
    it('should wrap text by default', () => {
      component.noWrap.set(false);
      fixture.detectChanges();
      const element = getTypographyElement();
      expect(element.classList.contains('lc-typography--nowrap')).toBe(false);
    });

    it('should not wrap text when noWrap is true', () => {
      component.noWrap.set(true);
      fixture.detectChanges();
      const element = getTypographyElement();
      expect(element.classList.contains('lc-typography--nowrap')).toBe(true);
      expect(element.classList.contains('whitespace-nowrap')).toBe(false);
      expect(element.classList.contains('overflow-hidden')).toBe(false);
    });
  });

  describe('Line Clamping', () => {
    it('should not clamp lines by default', () => {
      component.lineClamp.set(undefined);
      fixture.detectChanges();
      const element = getTypographyElement();
      expect(Array.from(element.classList).some((c) => c.startsWith('lc-typography--clamp-'))).toBe(
        false,
      );
    });

    it.each([1, 2, 3, 4, 5, 6])('should clamp to %i line(s)', (lines) => {
      component.lineClamp.set(lines);
      fixture.detectChanges();
      const element = getTypographyElement();
      expect(element.classList.contains(`lc-typography--clamp-${lines}`)).toBe(true);
      expect(element.classList.contains(`line-clamp-${lines}`)).toBe(false);
    });

    it('should ignore out-of-range values', () => {
      component.lineClamp.set(7);
      fixture.detectChanges();
      const element = getTypographyElement();
      expect(Array.from(element.classList).some((c) => c.startsWith('lc-typography--clamp-'))).toBe(
        false,
      );
    });
  });

  describe('Gutter Bottom', () => {
    it('should not have gutter bottom by default', () => {
      component.gutterBottom.set(false);
      fixture.detectChanges();
      const element = getTypographyElement();
      expect(element.classList.contains('lc-typography--gutter-bottom')).toBe(false);
    });

    it('should apply gutter bottom spacing', () => {
      component.gutterBottom.set(true);
      fixture.detectChanges();
      const element = getTypographyElement();
      expect(element.classList.contains('lc-typography--gutter-bottom')).toBe(true);
      expect(element.classList.contains('mb-4')).toBe(false);
    });
  });

  describe('Component Initialization', () => {
    it('should use body1 variant by default', () => {
      fixture.detectChanges();
      const element = fixture.nativeElement.querySelector('p');
      expect(element).toBeTruthy();
      expect(element.classList.contains('typography-body1')).toBe(true);
    });

    it('should accept all input properties', () => {
      component.variant.set('h1');
      component.align.set('center');
      component.color.set('error');
      component.weight.set('bold');
      component.transform.set('uppercase');
      component.noWrap.set(true);
      component.lineClamp.set(2);
      component.gutterBottom.set(true);
      fixture.detectChanges();

      const element = fixture.nativeElement.querySelector('h1');
      expect(element).toBeTruthy();
      expect(element.classList.contains('typography-h1')).toBe(true);
      expect(element.classList.contains('lc-typography--align-center')).toBe(true);
      expect(element.classList.contains('lc-typography--color-error')).toBe(true);
      expect(element.classList.contains('lc-typography--weight-bold')).toBe(true);
      expect(element.classList.contains('lc-typography--uppercase')).toBe(true);
      expect(element.classList.contains('lc-typography--nowrap')).toBe(true);
      expect(element.classList.contains('lc-typography--clamp-2')).toBe(true);
      expect(element.classList.contains('lc-typography--gutter-bottom')).toBe(true);
    });

    it('should update classes when inputs change after the first render', () => {
      fixture.detectChanges();
      component.weight.set('semibold');
      component.transform.set('capitalize');
      fixture.detectChanges();
      const element = getTypographyElement();
      expect(element.classList.contains('lc-typography--weight-semibold')).toBe(true);
      expect(element.classList.contains('lc-typography--capitalize')).toBe(true);
    });
  });

  describe('Stylesheet', () => {
    // Component styles are stripped under jest, so the cascade is asserted on
    // the stylesheet text: no `!important` (which made the weight modifier
    // unable to win), modifiers at higher specificity, prefixed class names,
    // ink tokens for status colours and the font-family token.
    const scss = readFileSync(join(__dirname, 'typography.component.scss'), 'utf8');

    it('should not use !important anywhere', () => {
      expect(scss).not.toContain('!important');
    });

    it('should let the weight modifier win over the variant weight via specificity', () => {
      for (const weight of ['regular', 'medium', 'semibold', 'bold']) {
        expect(scss).toMatch(
          new RegExp(`\\.typography\\.lc-typography--weight-${weight}\\s*\\{[^}]*font-weight:`),
        );
      }
    });

    it('should not emit app-global Tailwind utility class names', () => {
      const tailwindLike = [
        /^\s*\.uppercase\b/m,
        /^\s*\.lowercase\b/m,
        /^\s*\.capitalize\b/m,
        /^\s*\.mb-4\b/m,
        /^\s*\.text-(left|center|right|justify|primary|secondary|error|success|warning|info|disabled|ellipsis)\b/m,
        /^\s*\.font-(regular|medium|semibold|bold)\b/m,
        /^\s*\.line-clamp-\d/m,
        /^\s*\.overflow-hidden\b/m,
        /^\s*\.whitespace-nowrap\b/m,
      ];
      for (const pattern of tailwindLike) {
        expect(scss).not.toMatch(pattern);
      }
    });

    it('should use ink tokens for the status colours', () => {
      expect(scss).toMatch(/lc-typography--color-error\s*\{[^}]*var\(--color-text-error\)/);
      expect(scss).toMatch(/lc-typography--color-success\s*\{[^}]*var\(--color-text-success\)/);
      expect(scss).toMatch(/lc-typography--color-warning\s*\{[^}]*var\(--color-text-warning\)/);
      expect(scss).not.toMatch(/color:\s*var\(--color-(error|success|warning|info)\)/);
    });

    it('should use the font-family token instead of a literal font', () => {
      expect(scss).not.toContain('Open Sans');
      expect(scss).toMatch(/font-family:\s*var\(--font-family-base/);
    });
  });
});
