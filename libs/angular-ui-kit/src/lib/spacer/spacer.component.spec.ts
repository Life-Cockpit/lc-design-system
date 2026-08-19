import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { readFileSync } from 'fs';
import { join } from 'path';
import { SpacerComponent, SpacerSize } from './spacer.component';
import { StackComponent } from '../stack/stack.component';

@Component({
  standalone: true,
  imports: [SpacerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: flex;">
      <div>Start</div>
      <lc-spacer [size]="size()"></lc-spacer>
      <div>End</div>
    </div>
  `,
})
class TestHostComponent {
  readonly size = signal<SpacerSize>('auto');
}

describe('SpacerComponent', () => {
  let component: SpacerComponent;
  let fixture: ComponentFixture<SpacerComponent>;
  let hostFixture: ComponentFixture<TestHostComponent>;
  let spacerElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpacerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpacerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Size Variations', () => {
    beforeEach(() => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      spacerElement = hostFixture.debugElement.query(By.css('lc-spacer')).nativeElement;
    });

    it('should render auto size by default (flex-grow)', () => {
      hostFixture.detectChanges();
      expect(spacerElement.classList).toContain('spacer-auto');
    });

    it.each<SpacerSize>(['xs', 'sm', 'md', 'lg', 'xl'])('should render %s size on the host', (size) => {
      hostFixture.componentInstance.size.set(size);
      hostFixture.detectChanges();
      expect(spacerElement.classList).toContain(`spacer-${size}`);
    });

    it('should swap the size class when the input changes', () => {
      hostFixture.componentInstance.size.set('md');
      hostFixture.detectChanges();
      expect(spacerElement.classList).toContain('spacer-md');

      hostFixture.componentInstance.size.set('xl');
      hostFixture.detectChanges();
      expect(spacerElement.classList).toContain('spacer-xl');
      expect(spacerElement.classList).not.toContain('spacer-md');
    });
  });

  describe('Flex Behavior', () => {
    beforeEach(() => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      spacerElement = hostFixture.debugElement.query(By.css('lc-spacer')).nativeElement;
    });

    it('should grow to fill available space with auto size', () => {
      hostFixture.componentInstance.size.set('auto');
      hostFixture.detectChanges();
      expect(spacerElement.classList).toContain('spacer-grow');
    });

    it('should not grow with fixed sizes', () => {
      hostFixture.componentInstance.size.set('md');
      hostFixture.detectChanges();
      expect(spacerElement.classList).not.toContain('spacer-grow');
    });
  });

  describe('Stylesheet (host-scoped size rules)', () => {
    // jest-preset-angular strips component styles, so the cascade can't be
    // measured in jsdom. Assert the stylesheet itself: sizes must be written
    // as `:host(.spacer-*)` — plain `.spacer-*` rules are scoped to the
    // component's (empty) content by emulated encapsulation and give the
    // spacer zero size.
    const scss = readFileSync(join(__dirname, 'spacer.component.scss'), 'utf8');

    it.each<SpacerSize>(['xs', 'sm', 'md', 'lg', 'xl'])(
      'should size the host for %s via a :host(.spacer-%s) rule',
      (size) => {
        const rule = new RegExp(`:host\\(\\.spacer-${size}\\)\\s*\\{([^}]*)\\}`);
        const match = scss.match(rule);
        expect(match).toBeTruthy();
        const body = match?.[1] ?? '';
        expect(body).toMatch(new RegExp(`width:\\s*var\\(--lc-density-gap-${size}`));
        expect(body).toMatch(new RegExp(`height:\\s*var\\(--lc-density-gap-${size}`));
        expect(body).toMatch(new RegExp(`flex:\\s*0 0 var\\(--lc-density-gap-${size}`));
      },
    );

    it('should not contain content-scoped .spacer-* rules that never match the host', () => {
      // A `.spacer-xs {` selector at the start of a line (not wrapped in :host())
      expect(scss).not.toMatch(/^\s*\.spacer-[a-z]+\s*[,{]/m);
    });

    it('should grow the host in auto mode', () => {
      expect(scss).toMatch(/:host\(\.spacer-grow\)\s*\{[^}]*flex:\s*1 1 auto/);
    });
  });

  describe('Usage in Stack', () => {
    it('should work within horizontal stack', () => {
      @Component({
        standalone: true,
        imports: [SpacerComponent, StackComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <lc-stack direction="horizontal">
            <div>Left</div>
            <lc-spacer></lc-spacer>
            <div>Right</div>
          </lc-stack>
        `,
      })
      class StackTestComponent {}

      const stackFixture = TestBed.createComponent(StackTestComponent);
      stackFixture.detectChanges();

      const spacer = stackFixture.debugElement.query(By.css('lc-spacer'));
      expect(spacer).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-hidden attribute', () => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      hostFixture.detectChanges();
      spacerElement = hostFixture.debugElement.query(By.css('lc-spacer')).nativeElement;
      expect(spacerElement.getAttribute('aria-hidden')).toBe('true');
    });

    it('should not be focusable', () => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      hostFixture.detectChanges();
      spacerElement = hostFixture.debugElement.query(By.css('lc-spacer')).nativeElement;
      expect(spacerElement.tabIndex).toBe(-1);
      expect(spacerElement.hasAttribute('tabindex')).toBe(false);
    });
  });
});
