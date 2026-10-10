import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { By } from '@angular/platform-browser';
import { DividerComponent, DividerOrientation, DividerVariant, DividerSpacing } from './divider.component';

@Component({
  standalone: true,
  imports: [DividerComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <lc-divider
      [orientation]="orientation"
      [variant]="variant"
      [spacing]="spacing"
      [label]="label"
    ></lc-divider>
  `,
})
class TestHostComponent {
  orientation: DividerOrientation = 'horizontal';
  variant: DividerVariant = 'solid';
  spacing: DividerSpacing = 'md';
  label: string | undefined = undefined;
}

describe('DividerComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(DividerComponent))).toBeTruthy();
  });

  it('should render horizontal by default', () => {
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('.divider')).nativeElement;
    expect(el.classList).toContain('divider--horizontal');
    expect(el.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('should render vertical', () => {
    host.orientation = 'vertical';
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('.divider')).nativeElement;
    expect(el.classList).toContain('divider--vertical');
    expect(el.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('should apply variant class', () => {
    host.variant = 'dashed';
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.divider')).nativeElement.classList).toContain('divider--dashed');
  });

  it('should apply spacing class', () => {
    host.spacing = 'lg';
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.divider')).nativeElement.classList).toContain('divider--spacing-lg');
  });

  it('should render label when provided', () => {
    host.label = 'OR';
    fixture.detectChanges();
    const label = fixture.debugElement.query(By.css('.divider__label'));
    expect(label).toBeTruthy();
    expect(label.nativeElement.textContent.trim()).toBe('OR');
  });

  it('should not render label by default', () => {
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.divider__label'))).toBeNull();
  });

  it('should have role="separator"', () => {
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[role="separator"]'))).toBeTruthy();
  });
});
