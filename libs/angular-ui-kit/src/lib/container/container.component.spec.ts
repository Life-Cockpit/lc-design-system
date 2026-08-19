import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ContainerComponent, ContainerSize } from './container.component';

@Component({
  standalone: true,
  imports: [ContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lc-container [size]="size()" [noPadding]="noPadding()" [paddingY]="paddingY()">
      <div>Container Content</div>
    </lc-container>
  `,
})
class TestHostComponent {
  readonly size = signal<ContainerSize>('lg');
  readonly noPadding = signal(false);
  readonly paddingY = signal(false);
}

const TAILWIND_UTILITIES = ['mx-auto', 'px-4', 'sm:px-6', 'lg:px-8', 'py-6'];

describe('ContainerComponent', () => {
  let component: ContainerComponent;
  let fixture: ComponentFixture<ContainerComponent>;
  let hostFixture: ComponentFixture<TestHostComponent>;
  let containerElement: HTMLElement;

  const hostClasses = () => Array.from(containerElement.classList);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Size Variations', () => {
    beforeEach(() => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      containerElement = hostFixture.debugElement.query(By.css('lc-container')).nativeElement;
    });

    it('should render lg size by default', () => {
      hostFixture.detectChanges();
      expect(containerElement.classList).toContain('container-lg');
    });

    it.each<ContainerSize>(['sm', 'md', 'lg', 'xl', 'xxl', 'full'])(
      'should put the container-%s class on the host',
      (size) => {
        hostFixture.componentInstance.size.set(size);
        hostFixture.detectChanges();
        expect(containerElement.classList).toContain(`container-${size}`);
      },
    );

    it('should swap the size class when the input changes', () => {
      hostFixture.componentInstance.size.set('sm');
      hostFixture.detectChanges();
      expect(containerElement.classList).toContain('container-sm');

      hostFixture.componentInstance.size.set('xl');
      hostFixture.detectChanges();
      expect(containerElement.classList).toContain('container-xl');
      expect(containerElement.classList).not.toContain('container-sm');
    });

    it('should not rely on Tailwind max-w-* / mx-auto utilities', () => {
      hostFixture.componentInstance.size.set('xl');
      hostFixture.detectChanges();
      expect(hostClasses().some((c) => c.startsWith('max-w-'))).toBe(false);
      expect(hostClasses()).not.toContain('mx-auto');
    });
  });

  describe('Padding', () => {
    beforeEach(() => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      containerElement = hostFixture.debugElement.query(By.css('lc-container')).nativeElement;
    });

    it('should have horizontal padding by default (no modifier class)', () => {
      hostFixture.detectChanges();
      expect(containerElement.classList).not.toContain('container--no-padding');
      expect(containerElement.classList).not.toContain('container--padding-y');
    });

    it('should mark the host when noPadding is true', () => {
      hostFixture.componentInstance.noPadding.set(true);
      hostFixture.detectChanges();
      expect(containerElement.classList).toContain('container--no-padding');
    });

    it('should mark the host when paddingY is true', () => {
      hostFixture.componentInstance.paddingY.set(true);
      hostFixture.detectChanges();
      expect(containerElement.classList).toContain('container--padding-y');
    });

    it('should not add vertical padding when noPadding is true even with paddingY', () => {
      hostFixture.componentInstance.noPadding.set(true);
      hostFixture.componentInstance.paddingY.set(true);
      hostFixture.detectChanges();
      expect(containerElement.classList).toContain('container--no-padding');
      expect(containerElement.classList).not.toContain('container--padding-y');
    });

    it('should not emit Tailwind padding utilities', () => {
      hostFixture.componentInstance.paddingY.set(true);
      hostFixture.detectChanges();
      for (const utility of TAILWIND_UTILITIES) {
        expect(containerElement.classList).not.toContain(utility);
      }
    });
  });

  describe('Stylesheet (host-scoped layout rules)', () => {
    // Component styles are stripped under jest, so the layout contract is
    // asserted on the stylesheet text.
    const scss = readFileSync(join(__dirname, 'container.component.scss'), 'utf8');

    it.each<[ContainerSize, string]>([
      ['sm', '640px'],
      ['md', '768px'],
      ['lg', '1024px'],
      ['xl', '1280px'],
    ])('should cap container-%s at %s', (size, width) => {
      expect(scss).toMatch(
        new RegExp(`:host\\(\\.container-${size}\\)\\s*\\{[^}]*max-width:\\s*${width}`),
      );
    });

    it('should cap xxl via the --lc-content-max-width token', () => {
      expect(scss).toMatch(
        /:host\(\.container-xxl\)\s*\{[^}]*max-width:\s*var\(--lc-content-max-width,\s*1536px\)/,
      );
    });

    it('should not cap full', () => {
      expect(scss).toMatch(/:host\(\.container-full\)\s*\{[^}]*max-width:\s*none/);
    });

    it('should centre the host and pad it from density tokens', () => {
      expect(scss).toMatch(/:host\s*\{[^}]*margin-inline:\s*auto/);
      expect(scss).toMatch(/:host\s*\{[^}]*padding-inline:\s*var\(--lc-density-padding-md/);
      expect(scss).toMatch(/@media \(min-width: 640px\)[^}]*\{[^}]*padding-inline:\s*var\(--lc-density-padding-lg/);
      expect(scss).toMatch(/@media \(min-width: 1024px\)[^}]*\{[^}]*padding-inline:\s*var\(--lc-density-padding-xl/);
      expect(scss).toMatch(/:host\(\.container--no-padding\)\s*\{[^}]*padding-inline:\s*0/);
      expect(scss).toMatch(/:host\(\.container--padding-y\)\s*\{[^}]*padding-block:\s*var\(--lc-density-padding-lg/);
    });
  });

  describe('Content Projection', () => {
    it('should project child elements', () => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      hostFixture.detectChanges();

      const content = hostFixture.debugElement.query(By.css('lc-container > div'));
      expect(content).toBeTruthy();
      expect(content.nativeElement.textContent).toContain('Container Content');
    });

    it('should handle multiple children', () => {
      @Component({
        standalone: true,
        imports: [ContainerComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <lc-container>
            <h1>Title</h1>
            <p>Paragraph</p>
            <div>Content</div>
          </lc-container>
        `,
      })
      class MultiChildComponent {}

      const multiFixture = TestBed.createComponent(MultiChildComponent);
      multiFixture.detectChanges();

      const children = multiFixture.debugElement.queryAll(By.css('lc-container > *'));
      expect(children.length).toBe(3);
    });
  });

  describe('Class combinations', () => {
    it('should combine size and padding classes correctly', () => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      hostFixture.componentInstance.size.set('xl');
      hostFixture.componentInstance.noPadding.set(false);
      hostFixture.componentInstance.paddingY.set(true);
      hostFixture.detectChanges();

      containerElement = hostFixture.debugElement.query(By.css('lc-container')).nativeElement;

      expect(hostClasses().sort()).toEqual(['container--padding-y', 'container-xl']);
    });
  });
});
