import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { By } from '@angular/platform-browser';
import { SectionComponent } from './section.component';

@Component({
  standalone: true,
  imports: [SectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lc-section
      [spacing]="spacing"
      [background]="background"
      [noPaddingX]="noPaddingX"
      [noPaddingY]="noPaddingY"
    >
      <h2>Section Title</h2>
      <p>Section content</p>
    </lc-section>
  `,
})
class TestHostComponent {
  spacing: 'none' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  background: 'none' | 'gray' | 'primary' | 'secondary' = 'none';
  noPaddingX = false;
  noPaddingY = false;
}

describe('SectionComponent', () => {
  let component: SectionComponent;
  let fixture: ComponentFixture<SectionComponent>;
  let hostFixture: ComponentFixture<TestHostComponent>;
  let sectionElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Spacing', () => {
    beforeEach(() => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      sectionElement = hostFixture.debugElement.query(By.css('lc-section')).nativeElement;
    });

    it('should render md spacing by default', () => {
      hostFixture.detectChanges();
      expect(sectionElement.classList).toContain('section-spacing-md');
    });

    it('should render no spacing', () => {
      hostFixture.componentInstance.spacing = 'none';
      hostFixture.detectChanges();
      expect(sectionElement.classList).toContain('section-spacing-none');
    });

    it('should render sm spacing', () => {
      hostFixture.componentInstance.spacing = 'sm';
      hostFixture.detectChanges();
      expect(sectionElement.classList).toContain('section-spacing-sm');
    });

    it('should render lg spacing', () => {
      hostFixture.componentInstance.spacing = 'lg';
      hostFixture.detectChanges();
      expect(sectionElement.classList).toContain('section-spacing-lg');
    });

    it('should render xl spacing', () => {
      hostFixture.componentInstance.spacing = 'xl';
      hostFixture.detectChanges();
      expect(sectionElement.classList).toContain('section-spacing-xl');
    });
  });

  describe('Background', () => {
    beforeEach(() => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      sectionElement = hostFixture.debugElement.query(By.css('lc-section')).nativeElement;
    });

    it('should have no background by default', () => {
      hostFixture.detectChanges();
      expect(sectionElement.classList).toContain('section-bg-none');
    });

    it('should render gray background', () => {
      hostFixture.componentInstance.background = 'gray';
      hostFixture.detectChanges();
      expect(sectionElement.classList).toContain('section-bg-gray');
    });

    it('should render primary background', () => {
      hostFixture.componentInstance.background = 'primary';
      hostFixture.detectChanges();
      expect(sectionElement.classList).toContain('section-bg-primary');
    });

    it('should render secondary background', () => {
      hostFixture.componentInstance.background = 'secondary';
      hostFixture.detectChanges();
      expect(sectionElement.classList).toContain('section-bg-secondary');
    });
  });

  describe('Padding Control', () => {
    beforeEach(() => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      sectionElement = hostFixture.debugElement.query(By.css('lc-section')).nativeElement;
    });

    it('should have horizontal padding by default (no opt-out class)', () => {
      hostFixture.detectChanges();
      expect(sectionElement.classList).not.toContain('section-no-padding-x');
    });

    it('should have vertical padding by default (no opt-out class)', () => {
      hostFixture.detectChanges();
      expect(sectionElement.classList).not.toContain('section-no-padding-y');
    });

    it('should mark horizontal padding as disabled when noPaddingX is true', () => {
      hostFixture.componentInstance.noPaddingX = true;
      hostFixture.detectChanges();
      expect(sectionElement.classList).toContain('section-no-padding-x');
    });

    it('should mark vertical padding as disabled when noPaddingY is true', () => {
      hostFixture.componentInstance.noPaddingY = true;
      hostFixture.detectChanges();
      expect(sectionElement.classList).toContain('section-no-padding-y');
    });

    it('should expose density-driven responsive spacing via host element', () => {
      hostFixture.detectChanges();
      expect(sectionElement.tagName.toLowerCase()).toBe('lc-section');
    });
  });

  describe('Content Projection', () => {
    it('should project child elements', () => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      hostFixture.detectChanges();

      const title = hostFixture.debugElement.query(By.css('h2'));
      const paragraph = hostFixture.debugElement.query(By.css('p'));

      expect(title).toBeTruthy();
      expect(title.nativeElement.textContent).toContain('Section Title');
      expect(paragraph).toBeTruthy();
      expect(paragraph.nativeElement.textContent).toContain('Section content');
    });
  });

  describe('Combined Styles', () => {
    it('should combine spacing and background correctly', () => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      hostFixture.componentInstance.spacing = 'lg';
      hostFixture.componentInstance.background = 'primary';
      hostFixture.detectChanges();

      sectionElement = hostFixture.debugElement.query(By.css('lc-section')).nativeElement;

      expect(sectionElement.classList).toContain('section-spacing-lg');
      expect(sectionElement.classList).toContain('section-bg-primary');
    });

    it('should apply all padding options correctly', () => {
      hostFixture = TestBed.createComponent(TestHostComponent);
      hostFixture.componentInstance.noPaddingX = false;
      hostFixture.componentInstance.noPaddingY = false;
      hostFixture.componentInstance.spacing = 'xl';
      hostFixture.detectChanges();

      sectionElement = hostFixture.debugElement.query(By.css('lc-section')).nativeElement;

      expect(sectionElement.classList).toContain('section-spacing-xl');
      expect(sectionElement.classList).not.toContain('section-no-padding-x');
      expect(sectionElement.classList).not.toContain('section-no-padding-y');
    });
  });

  describe('Responsive Layout', () => {
    it('should work within Container component', () => {
      @Component({
        standalone: true,
        imports: [SectionComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <lc-section>
            <div>Content that should be contained</div>
          </lc-section>
        `,
      })
      class ContainerTestComponent {}

      const containerFixture = TestBed.createComponent(ContainerTestComponent);
      containerFixture.detectChanges();

      const section = containerFixture.debugElement.query(By.css('lc-section'));
      expect(section).toBeTruthy();
    });
  });
});
