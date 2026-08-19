import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent', () => {
  let fixture: ComponentFixture<SkeletonComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SkeletonComponent] }).compileComponents();
    fixture = TestBed.createComponent(SkeletonComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  function box(): HTMLElement {
    return el.querySelector('.lc-skeleton') as HTMLElement;
  }

  it('renders a line skeleton by default with the line defaults', () => {
    expect(box()).toBeTruthy();
    expect(box().classList).toContain('lc-skeleton--line');
    expect(box().style.width).toBe('100%');
    expect(box().style.height).toBe('0.875rem');
    expect(el.style.width).toBe('100%');
  });

  it('applies variant defaults for circle and rect', () => {
    fixture.componentRef.setInput('variant', 'circle');
    fixture.detectChanges();
    expect(box().classList).toContain('lc-skeleton--circle');
    expect(box().style.width).toBe('40px');
    expect(box().style.height).toBe('40px');
    expect(box().style.borderRadius).toBe('50%');
    expect(el.style.width).toBe('40px');

    fixture.componentRef.setInput('variant', 'rect');
    fixture.detectChanges();
    expect(box().classList).toContain('lc-skeleton--rect');
    expect(box().style.height).toBe('100px');
  });

  it('honours explicit width / height / borderRadius overrides', () => {
    fixture.componentRef.setInput('width', '120px');
    fixture.componentRef.setInput('height', '2rem');
    fixture.componentRef.setInput('borderRadius', '4px');
    fixture.detectChanges();
    expect(box().style.width).toBe('120px');
    expect(box().style.height).toBe('2rem');
    expect(box().style.borderRadius).toBe('4px');
    expect(el.style.width).toBe('120px');
  });
});
