import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ContainerComponent, ContainerSize } from './container.component';

@Component({
  standalone: true,
  imports: [ContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lc-container [size]="size" [noPadding]="noPadding" [paddingY]="paddingY">
      <div>Container Content</div>
    </lc-container>
  `,
})
class TestHostComponent {
  size: ContainerSize = 'lg';
  noPadding: boolean = false;
  paddingY: boolean = false;
}

describe('ContainerComponent', () => {
  let component: ContainerComponent;
  let fixture: ComponentFixture<ContainerComponent>;
  let hostFixture: ComponentFixture<TestHostComponent>;
  let containerElement: HTMLElement;

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

    it('should render sm size (max-w-screen-sm)', () => {
      hostFixture.componentInstance.size = 'sm';
      hostFixture.detectChanges();
      expect(containerElement.classList).toContain('container-sm');
      expect(containerElement.classList).toContain('max-w-screen-sm');
    });

    it('should render md size (max-w-screen-md)', () => {
      hostFixture.componentInstance.size = 'md';
      hostFixture.detectChanges();
      expect(containerElement.classList).toContain('container-md');
      expect(containerElement.classList).toContain('max-w-screen-md');
    });

    it('should render lg size (max-w-screen-lg)', () => {
      hostFixture.componentInstance.size = 'lg';
      hostFixture.detectChanges();
      expect(containerElement.classList).toContain('container-lg');
      expect(containerElement.classList).toContain('max-w-screen-lg');
    });

    it('should render xl size (max-w-screen-xl)', () => {
      hostFixture.componentInstance.size = 'xl';
      hostFixture.detectChanges();
      expect(containerElement.classList).toContain('container-xl');
      expect(containerElement.classList).toContain('max-w-screen-xl');
    });

    it('should render xxl size (capped in SCSS via --lc-content-max-width)', () => {
      hostFixture.componentInstance.size = 'xxl';
      hostFixture.detectChanges();
      expect(containerElement.classList).toContain('container-xxl');
      // xxl deliberately carries no Tailwind max-w utility — the cap comes from
      // the token in container.component.scss.
      const hasTailwindMaxWidth = Array.from(containerElement.classList).some((cls) =>
        cls.startsWith('max-w-')
      );
      expect(hasTailwindMaxWidth).toBe(false);
    });

    it('should keep centering and padding on xxl', () => {
      hostFixture.componentInstance.size = 'xxl';
      hostFixture.detectChanges();
      expect(containerElement.classList).toContain('mx-auto');
      expect(containerElement.classList).toContain('px-4');
      expect(containerElement.classList).toContain('sm:px-6');
      expect(containerElement.classList).toContain('lg:px-8');
    });

    it('should render full size (no max-width)', () => {
      hostFixture.componentInstance.size = 'full';
      hostFixture.detectChanges();
      expect(containerElement.classList).toContain('container-full');
      expect(containerElement.classList).not.toContain('max-w-screen');
    });
  });

  describe('Padding', () => {
    beforeEach(() => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      containerElement = hostFixture.debugElement.query(By.css('lc-container')).nativeElement;
    });

    it('should have horizontal padding by default', () => {
      hostFixture.detectChanges();
      expect(containerElement.classList).toContain('px-4');
    });

    it('should have no padding when noPadding is true', () => {
      hostFixture.componentInstance.noPadding = true;
      hostFixture.detectChanges();
      expect(containerElement.classList).not.toContain('px-4');
    });

    it('should be responsive (sm:px-6, lg:px-8)', () => {
      hostFixture.detectChanges();
      expect(containerElement.classList).toContain('sm:px-6');
      expect(containerElement.classList).toContain('lg:px-8');
    });

    it('should not have vertical padding by default', () => {
      hostFixture.detectChanges();
      expect(containerElement.classList).not.toContain('py-6');
    });

    it('should have vertical padding when paddingY is true', () => {
      hostFixture.componentInstance.paddingY = true;
      hostFixture.detectChanges();
      expect(containerElement.classList).toContain('py-6');
    });

    it('should not have vertical padding when noPadding is true even with paddingY', () => {
      hostFixture.componentInstance.noPadding = true;
      hostFixture.componentInstance.paddingY = true;
      hostFixture.detectChanges();
      expect(containerElement.classList).not.toContain('py-6');
      expect(containerElement.classList).not.toContain('px-4');
    });
  });

  describe('Centering', () => {
    beforeEach(() => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      containerElement = hostFixture.debugElement.query(By.css('lc-container')).nativeElement;
    });

    it('should center content horizontally', () => {
      hostFixture.detectChanges();
      expect(containerElement.classList).toContain('mx-auto');
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

  describe('Responsive Behavior', () => {
    it('should combine size and padding classes correctly', () => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      hostFixture.componentInstance.size = 'xl';
      hostFixture.componentInstance.noPadding = false;
      hostFixture.componentInstance.paddingY = true;
      hostFixture.detectChanges();

      containerElement = hostFixture.debugElement.query(By.css('lc-container')).nativeElement;

      expect(containerElement.classList).toContain('container-xl');
      expect(containerElement.classList).toContain('max-w-screen-xl');
      expect(containerElement.classList).toContain('mx-auto');
      expect(containerElement.classList).toContain('px-4');
      expect(containerElement.classList).toContain('sm:px-6');
      expect(containerElement.classList).toContain('lg:px-8');
      expect(containerElement.classList).toContain('py-6');
    });
  });

  describe('Full Width Mode', () => {
    it('should not have max-width in full mode', () => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      hostFixture.componentInstance.size = 'full';
      hostFixture.detectChanges();

      containerElement = hostFixture.debugElement.query(By.css('lc-container')).nativeElement;

      const classList = Array.from(containerElement.classList);
      const hasMaxWidth = classList.some((cls) => cls.startsWith('max-w-'));
      expect(hasMaxWidth).toBe(false);
    });
  });
});
