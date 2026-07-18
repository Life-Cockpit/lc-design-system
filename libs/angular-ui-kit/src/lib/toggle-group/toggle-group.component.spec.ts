import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToggleGroupComponent, ToggleOption } from './toggle-group.component';
import { Component, signal } from '@angular/core';

@Component({
  standalone: true,
  imports: [ToggleGroupComponent],
  template: `
    <lc-toggle-group
      [options]="options()"
      [(selected)]="selected"
      (selectionChange)="onSelectionChange($event)"
    ></lc-toggle-group>
  `,
})
class TestHostComponent {
  options = signal<ToggleOption[]>([
    { value: '1D', label: '1D' },
    { value: '1h', label: '1H' },
    { value: '15m', label: '15M' },
    { value: 'disabled', label: 'Off', disabled: true },
  ]);
  selected = '1D';
  lastChanged = '';

  onSelectionChange(value: string): void {
    this.lastChanged = value;
  }
}

describe('ToggleGroupComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(
      fixture.nativeElement.querySelector('.lc-toggle-group')
    ).toBeTruthy();
  });

  it('should render all options as buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll(
      '.lc-toggle-group__btn'
    );
    expect(buttons.length).toBe(4);
    expect(buttons[0].textContent.trim()).toBe('1D');
    expect(buttons[1].textContent.trim()).toBe('1H');
    expect(buttons[2].textContent.trim()).toBe('15M');
  });

  it('should mark initial selection as active', () => {
    const buttons = fixture.nativeElement.querySelectorAll(
      '.lc-toggle-group__btn'
    );
    expect(buttons[0].classList).toContain('lc-toggle-group__btn--active');
    expect(buttons[1].classList).not.toContain('lc-toggle-group__btn--active');
  });

  it('should change selection on click', () => {
    const buttons = fixture.nativeElement.querySelectorAll(
      '.lc-toggle-group__btn'
    );
    buttons[1].click();
    fixture.detectChanges();

    expect(host.selected).toBe('1h');
    expect(host.lastChanged).toBe('1h');
    expect(buttons[1].classList).toContain('lc-toggle-group__btn--active');
    expect(buttons[0].classList).not.toContain('lc-toggle-group__btn--active');
  });

  it('should not change selection for disabled option', () => {
    const buttons = fixture.nativeElement.querySelectorAll(
      '.lc-toggle-group__btn'
    );
    buttons[3].click();
    fixture.detectChanges();

    expect(host.selected).toBe('1D');
    expect(buttons[3].classList).toContain('lc-toggle-group__btn--disabled');
  });

  it('should set aria-pressed attribute', () => {
    const buttons = fixture.nativeElement.querySelectorAll(
      '.lc-toggle-group__btn'
    );
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
  });

  describe('dot indicator', () => {
    it('should not render a dot by default', () => {
      expect(
        fixture.nativeElement.querySelector('.lc-toggle-group__dot')
      ).toBeNull();
    });

    it('should render a warning dot for dot: true', () => {
      host.options.set([
        { value: 'a', label: 'A', dot: true },
        { value: 'b', label: 'B' },
      ]);
      fixture.detectChanges();

      const dots = fixture.nativeElement.querySelectorAll(
        '.lc-toggle-group__dot'
      );
      expect(dots.length).toBe(1);
      expect(dots[0].classList).toContain('lc-toggle-group__dot--warning');
      expect(dots[0].getAttribute('aria-hidden')).toBe('true');
    });

    it('should render the requested semantic tone', () => {
      host.options.set([
        { value: 'a', label: 'A', dot: 'error' },
        { value: 'b', label: 'B', dot: 'success' },
      ]);
      fixture.detectChanges();

      const dots = fixture.nativeElement.querySelectorAll(
        '.lc-toggle-group__dot'
      );
      expect(dots[0].classList).toContain('lc-toggle-group__dot--error');
      expect(dots[1].classList).toContain('lc-toggle-group__dot--success');
    });
  });
});
